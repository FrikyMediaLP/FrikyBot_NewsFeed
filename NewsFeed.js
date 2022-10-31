const express = require('express');
const PATH = require('path');
const fs = require('fs');

const FrikyDB = require('./../../Util/FrikyDB.js');

const PACKAGE_DETAILS = {
    name: "NewsFeed",
    description: "News Feed used to Share Updates and Informations on recent Events.",
    picture: "/images/icons/newspaper-solid.svg",
    version: '0.4.1.0',
    server: '0.4.0.0',
    modules: {
        webapp: '0.4.0.0'
    },
    packages: []
};
const COOKIES = {
    SessionStorage: [
        { name: 'NEWS_FEED_DATA', by: 'News Feed Embedded', set: 'When new News were fetched', reason: 'Reduce loadtimes by storing a temporary dataset of the News Data.' }
    ]
};
const API_ENDPOINT_PARAMETERS = {
    'oldest-news': {
        first: 'filter',
        pagination: 'filter'
    },
    news: {
        id: 'query',
        page: 'query',
        title: 'query',
        day: 'query',
        start: 'query',
        end: 'query',
        first: 'filter',
        pagination: 'filter'
    },
    changelogs: {
        id: 'query',
        page: 'query',
        changelog: 'query',
        title: 'query',
        day: 'query',
        start: 'query',
        end: 'query',
        first: 'filter',
        pagination: 'filter'
    }
};

const SUPPORTED_IMG_FILES = ['png', 'jpg', 'jpeg', 'gif', 'mp4'];
const SUPPORTED_VIDEO_FILES = ['mp4'];
const SUPPORTED_SOUND_FILES = ['ogg', 'mp3', 'wav'];
const SUPPORTED_FILES = SUPPORTED_IMG_FILES.concat(SUPPORTED_SOUND_FILES);

class NewsFeed extends require('./../../Util/PackageBase.js').PackageBase {
    constructor(webappinteractor, twitchirc, twitchapi, logger) {
        super(PACKAGE_DETAILS, webappinteractor, twitchirc, twitchapi, logger);

        //Change Config Defaults
        this.Config.EditSettingTemplate('HTML_ROOT_NAME', { default: 'News' });
        this.Config.EditSettingTemplate('API_ROOT_NAME', { default: 'News' });
        
        this.Config.AddSettingTemplates([
            { name: 'API_NEWS_FIRST_DEFAULT', type: 'number', default: 10, min: 0 },
            { name: 'API_CHANGELOG_FIRST_DEFAULT', type: 'number', default: 10, min: 0 },
            { name: 'News_File_Dir', type: 'string', default: this.getMainPackageRoot() + this.getName() + "/custom_files/" },
            { name: 'News_Dir', type: 'string', default: this.getMainPackageRoot() + this.getName() + "/data/" }
        ]);
        this.Config.Load();
        this.Config.FillConfig();

        //Cookies
        this.setWebCookies(COOKIES);

        //Databases
        this.NEWS_DATABASE;
        this.CHANGELOG_DATABASE;
    }

    async Init(startparameters) {
        if (!this.isEnabled()) return Promise.resolve();
        let cfg = this.GetConfig();

        //Setup File Structure
        const files = [cfg['News_File_Dir'], cfg['News_Dir']];
        for (let file of files) {
            try {
                if (!fs.existsSync(PATH.resolve(file))) {
                    fs.mkdirSync(PATH.resolve(file));
                }
            } catch (err) {
                this.Logger.error(err.message);
            }
        }

        //API ROUTE
        let APIRouter = express.Router();

        APIRouter.get('/', async (req, res) => {
            let authenticated = false;

            try {
                await this.WebAppInteractor.AuthorizeUser(res.locals.user, { user_level: 'moderator' });
                authenticated = true;
            } catch (err) {

            }
            
            try {
                res.json({ data: await this.getNews(req.query, authenticated) });
            } catch (err) {
                res.json({ err: "Internal Error." });
            }
        });
        APIRouter.get('/oldest', async (req, res) => {
            let authenticated = false;

            try {
                await this.WebAppInteractor.AuthorizeUser(res.locals.user, { user_level: 'moderator' });
                authenticated = true;
            } catch (err) {

            }

            try {
                res.json({ data: await this.getOldestNews(req.query, authenticated) });
            } catch (err) {
                res.json({ err: "Internal Error." });
            }
        });
        super.setAuthenticatedAPIEndpoint('/', { user_level: 'moderator' }, async (req, res) => {
            let news_data = req.body['news_data'];

            let dta = this.validateNews(news_data);

            if (dta == true) {
                try {
                    await this.AddNews(news_data);
                    res.json({ state: "News saved!" });
                } catch (err) {
                    res.json({ err: "News save failed!" });
                }
            } else {
                res.json({ err: "News unfinished / has errors" });
            }

            return Promise.resolve();
        }, 'POST');
        super.setAuthenticatedAPIEndpoint('/', { user_level: 'moderator' }, async (req, res) => {
            try {
                res.json({ removed: await this.RemoveNews(req.body.page) });
            } catch (err) {
                if (err.message !== 'News Data not found' && err.message !== 'News Data not in the correct format' && err.message !== 'News Page Identifier not found') res.json({ err: "Internal Error." });
                else res.json({ err: err.message });
            }

            return Promise.resolve();
        }, 'DELETE');
        super.setAuthenticatedAPIEndpoint('/', { user_level: 'moderator' }, async (req, res) => {
            let news_data = req.body['news_data'];
            let old_page = req.body['old_page'];

            let dta = this.validateNews(news_data);

            if (dta == true) {
                try {
                    await this.EditNews(news_data, old_page);
                    res.json({ state: "News saved!" });
                } catch (err) {
                    res.json({ err: "News save failed!" });
                }
            } else {
                res.json({ err: "News unfinished / has errors" });
            }

            return Promise.resolve();
        }, 'PUT');

        //Changelog
        APIRouter.get('/Changelog', async (req, res) => {
            let authenticated = false;

            try {
                await this.WebAppInteractor.AuthorizeUser(res.locals.user, { user_level: 'moderator' });
                authenticated = true;
            } catch (err) {

            }

            try {
                res.json({ data: await this.getChangelogs(req.query, authenticated) });
            } catch (err) {
                res.json({ err: "Internal Error." });
            }
        });
        super.setAuthenticatedAPIEndpoint('/Changelog/full', { user_level: 'moderator' }, async (req, res) => {
            try {
                res.json({ data: await this.getChangelogs(req.query, true) });
            } catch (err) {
                res.json({ err: "Internal Error." });
            }
        }, 'GET');
        super.setAuthenticatedAPIEndpoint('/Changelog', { user_level: 'moderator' }, async (req, res) => {
            let changelog_data = req.body.changelog_data;
            
            let dta = this.validateChangelog(changelog_data);

            if (dta == true) {
                try {
                    await this.AddChangelog(changelog_data);
                    res.json({ state: "Changelog saved!" });
                } catch (err) {
                    console.log(err);
                    res.json({ err: "Changelog save failed!" });
                }
            } else {
                res.json({ err: "Changelog unfinished / has errors" });
            }

            return Promise.resolve();
        }, 'POST');
        super.setAuthenticatedAPIEndpoint('/Changelog', { user_level: 'moderator' }, async (req, res) => {
            try {
                await this.RemoveChangelog(req.body.page);
                res.sendStatus(200);
            } catch (err) {
                if (err.message !== 'Changelog Data not found' && err.message !== 'Changelog Data not in the correct format' && err.message !== 'Changelog Page Identifier not found') res.json({ err: "Internal Error." });
                else res.json({ err: err.message });
            }

            return Promise.resolve();
        }, 'DELETE');
        super.setAuthenticatedAPIEndpoint('/Changelog', { user_level: 'moderator' }, async (req, res) => {
            let changelog_data = req.body['changelog_data'];
            let old_page = req.body['old_page'];

            let dta = this.validateChangelog(changelog_data);

            if (dta == true) {
                try {
                    await this.EditChangelog(changelog_data, old_page);
                    res.json({ state: "Changelog saved!" });
                } catch (err) {
                    res.json({ err: "Changelog save failed!" });
                }
            } else {
                res.json({ err: "Changelog unfinished / has errors" });
            }

            return Promise.resolve();
        }, 'PUT');

        //Custom Files
        super.setAuthenticatedAPIEndpoint('/files', { user_level: 'moderator' }, (req, res, next) => {
            res.json({ files: this.GetCustomFiles(), upload_limit: this.WebAppInteractor.GetUploadLimit() });
        });
        super.setAuthenticatedAPIEndpoint('/files', { user_level: 'moderator' }, (req, res, next) => {
            let file_info = req.body['file_info'];
            if (!file_info) return res.json({ err: 'File Info not supplied!' });

            let file_name = file_info.name;
            if (!file_name) return res.json({ err: 'File Name not supplied!' });

            let file_data = req.body['file_data'];
            if (!file_data) return res.json({ err: 'File Data not supplied!' });

            let extension = file_name.split('.').pop().toLowerCase();

            if (!SUPPORTED_FILES.find(elt => elt === extension)) return res.json({ err: 'Filetype not supported!' });

            let cfg = this.Config.GetConfig();
            let file_path = PATH.resolve(cfg['News_File_Dir'] + file_name);

            try {
                if (fs.existsSync(file_path)) return res.json({ err: 'File already exists!' });

                if (SUPPORTED_VIDEO_FILES.find(elt => elt === extension)) fs.writeFileSync(file_path, file_data.replace(/^data:video\/\w+;base64,/, ''), { encoding: 'base64' });
                else if (SUPPORTED_IMG_FILES.find(elt => elt === extension)) fs.writeFileSync(file_path, file_data.replace(/^data:image\/\w+;base64,/, ''), { encoding: 'base64' });
                else if (SUPPORTED_SOUND_FILES.find(elt => elt === extension)) fs.writeFileSync(file_path, file_data.replace(/^data:audio\/\w+;base64,/, ''), { encoding: 'base64' });
            } catch (err) {
                return res.sendStatus(500);
            }

            //Check Size
            try {
                let stats = fs.statSync(file_path);
                if (!stats) return res.sendStatus(500);
                if (stats.size === file_info.size) return res.sendStatus(200);
            } catch (err) {
                //Delete Corrupted File
                try {
                    fs.existsSync(file_path);
                } catch (err) {

                }

                return res.json({ err: 'File corrupted! Try again!' });
            }

            res.sendStatus(500);
        }, 'POST');
        super.setAuthenticatedAPIEndpoint('/files', { user_level: 'moderator' }, (req, res, next) => {
            let cfg = this.Config.GetConfig();
            let file = PATH.resolve(cfg['News_File_Dir'] + req.body['file']);

            try {
                if (fs.existsSync(file)) {
                    fs.unlinkSync(file);
                    res.sendStatus(200);
                } else {
                    res.sendStatus(404);
                }
            } catch (err) {
                console.log(err);
                res.sendStatus(500);
            }
        }, 'DELETE');

        super.setAPIRouter(APIRouter);
        
        //STATIC FILE ROUTE
        let StaticRouter = express.Router();
        StaticRouter.use("/", (req, res, next) => {
            let url = decodeURI(req.url.split('?')[0].toLowerCase());
            let cfg = this.Config.GetConfig();
            
            if (url.startsWith('/custom/')) {
                try {
                    let page = this.HTMLFileExists(url.substring(8), cfg['News_File_Dir']);
                    if (page != "") res.sendFile(page);
                    else res.sendStatus(404);
                } catch (err) {
                    res.sendStatus(404);
                }
            } else if (url == "/newsmaker") {
                res.sendFile(PATH.resolve(this.getMainPackageRoot() + "NewsFeed/html/NewsMaker.html"));
            } else if(url == "/changelogmaker") {
                res.sendFile(PATH.resolve(this.getMainPackageRoot() + "NewsFeed/html/ChangelogMaker.html"));
            } else if (url == "/news_styles") {
                res.sendFile(PATH.resolve(this.getMainPackageRoot() + "NewsFeed/html/style/NewsFeed.css"));
            } else if (url == "/news_scripts") {
                res.sendFile(PATH.resolve(this.getMainPackageRoot() + "NewsFeed/html/script/NewsFeed.js"));
            } else if (url == "/changelog_styles") {
                res.sendFile(PATH.resolve(this.getMainPackageRoot() + "NewsFeed/html/style/Changelog.css"));
            } else if (url == "/changelog_scripts") {
                res.sendFile(PATH.resolve(this.getMainPackageRoot() + "NewsFeed/html/script/Changelog.js"));
            } else if (url.startsWith('/changelog')) {
                res.sendFile(PATH.resolve(this.getMainPackageRoot() + "NewsFeed/html/Changelog_Template.html"));
            } else {
                res.sendFile(PATH.resolve(this.getMainPackageRoot() + "NewsFeed/html/News_Template.html"));
            }
        });
        super.setFileRouter(StaticRouter);

        //HTML Navigation
        this.setWebNavigation({
            name: "News",
            href: this.getHTMLROOT(),
            icon: "images/icons/newspaper-solid.svg"
        });

        this.SETUP_COMPLETE = true;
        //Load Data
        return this.reload();
    }
    async reload() {
        if (!this.isEnabled()) return Promise.reject(new Error("Package is disabled!"));

        //Load News Data
        this.LoadNews();
        this.LoadChangelog();
        
        this.Logger.info("NewsFeed (Re)Loaded!");
        return Promise.resolve();
    }
    
    //////////////////////////////////////////
    //              DATABASE
    //////////////////////////////////////////

    //News
    LoadNews() {
        let cfg = this.GetConfig();
        if (!this.NEWS_DATABASE) this.NEWS_DATABASE = new FrikyDB.Collection({ path: PATH.resolve(cfg['News_Dir'] + 'News_Index.db') });
    }
    async AddNews(news_data) {
        if (!news_data) return Promise.reject(new Error('News Data not found'));
        if (!(news_data instanceof Object)) return Promise.reject(new Error('News Data not in the correct format'));
        if (!news_data.page) return Promise.reject(new Error('News Page Identifier not found'));
        
        try {
            let news = await this.AccessFrikyDB(this.NEWS_DATABASE, { page: news_data.page });
            if (news.length > 0) return Promise.reject(new Error('News Page Identifier allready in use'));
        } catch (err) {
            return Promise.reject(err);
        }

        return this.NEWS_DATABASE.insert(news_data);
    }
    async EditNews(news_data, old_page) {
        if (!news_data) return Promise.reject(new Error('News Data not found'));
        if (!(news_data instanceof Object)) return Promise.reject(new Error('News Data not in the correct format'));
        if (!news_data.page) return Promise.reject(new Error('News Page Identifier not found'));

        //Oldpage Exists Check
        if (old_page !== news_data.page) {
            try {
                let news = await this.AccessFrikyDB(this.NEWS_DATABASE, { page: old_page });
                if (news.length > 0) return Promise.reject(new Error("News Page already exists!"));
            } catch (err) {
                return Promise.reject(err);
            }
        }
        
        return this.NEWS_DATABASE.update({ page: old_page || news_data.page }, news_data);
    }
    async RemoveNews(page) {
        if (!page) return Promise.reject(new Error('Page not found'));
        return this.NEWS_DATABASE.remove({ page });
    }
    
    async getNews(params, include_scheduled = false) {
        let News = [];
        let pagination;
        let cfg = this.Config.GetConfig();

        //Scheduled
        if (include_scheduled == false) {
            try {
                if (!(params.end && parseInt(params.end) < Date.now())) params.end = Date.now() + "";
            } catch (err) {
                params.end = Date.now() + "";
            }
        }
        
        //Fetch
        try {
            News = await this.AccessFrikyDB(this.NEWS_DATABASE, this.createNEDBQuery('news', params));
        } catch (err) {
            return Promise.reject(err);
        }
        
        //Filter
        News.sort((a, b) => b.date - a.date);
        if (params.pagination) {
            //index;first
            pagination = this.getNextArrayPagination(News, params.pagination);
            News = this.getArrayPage(News, params.pagination);
        } else if (params.first) {
            try {
                pagination = this.getNextArrayPagination(News, '0;' + parseInt(params.first));
                News = News.slice(0, parseInt(params.first));
            } catch (err) {
                News = News.slice(0, cfg['API_NEWS_FIRST_DEFAULT']);
            }
        } else {
            News = News.slice(0, cfg['API_NEWS_FIRST_DEFAULT']);
        }

        return Promise.resolve({ News, pagination });
    }
    async getOldestNews(params, include_scheduled = false) {
        let News = [];
        let pagination;
        let cfg = this.Config.GetConfig();

        //Scheduled
        if (include_scheduled == false) {
            try {
                if (!(params.end && parseInt(params.end) < Date.now())) params.end = Date.now() + "";
            } catch (err) {
                params.end = Date.now() + "";
            }
        }

        //Fetch
        try {
            News = await this.AccessFrikyDB(this.NEWS_DATABASE, this.createNEDBQuery('oldest-news', params));
        } catch (err) {
            return Promise.reject(err);
        }

        News = News.reverse();

        //Filter
        if (params.pagination) {
            //index;first
            pagination = this.getNextArrayPagination(News, params.pagination);
            News = this.getArrayPage(News, params.pagination);
        } else if (params.first) {
            try {
                pagination = this.getNextArrayPagination(News, '0;' + parseInt(params.first));
                News = News.slice(0, parseInt(params.first));
            } catch (err) {
                News = News.slice(0, cfg['API_NEWS_FIRST_DEFAULT']);
            }
        } else {
            News = News.slice(0, cfg['API_NEWS_FIRST_DEFAULT']);
        }

        return Promise.resolve({ News, pagination });
    }
    
    validateNews(jsonData) {
        if (!jsonData.title || !jsonData.date || !jsonData.page) {
            return false;
        }

        if (isNaN(jsonData.date) || typeof (jsonData.title) != "string") {
            return false;
        }

        //Description
        if (jsonData.description) {
            if (jsonData.description.top) {
                if (!Array.isArray(jsonData.description.top)) {
                    return false;
                }

                for (let p of jsonData.description.top) {
                    if (typeof (p) == "object") {
                        if (!p.text) {
                            return false;
                        }
                    } else if (typeof (p) != "string") {
                        return false;
                    }
                }
            }

            if (jsonData.description.bottom) {
                if (!Array.isArray(jsonData.description.bottom)) {
                    return false;
                }

                for (let p of jsonData.description.bottom) {
                    if (typeof (p) == "object") {
                        if (!p.text) {
                            return false;
                        }
                    } else if (typeof (p) != "string") {
                        return false;
                    }
                }
            }
        }

        //Images
        if (jsonData.images) {
            if (!Array.isArray(jsonData.images)) {
                return false;
            }

            for (let p of jsonData.images) {
                if (!p.source) {
                    return false;
                }
            }
        }


        //Misc
        if (jsonData.misc) {
            if (!Array.isArray(jsonData.misc)) {
                return false;
            }

            for (let p of jsonData.misc) {
                if (!p.icon || !p.text || !p.type) {
                    return false;
                }

                if (p.type == "link") {
                    if (!p.link) {
                        return false;
                    }
                }
            }
        }

        return true;
    }

    //Changelog
    LoadChangelog() {
        let cfg = this.GetConfig();
        if (!this.CHANGELOG_DATABASE) this.CHANGELOG_DATABASE = new FrikyDB.Collection({ path: PATH.resolve(cfg['News_Dir'] + 'Changelogs_Index.db') });
    }
    async AddChangelog(changelog_data) {
        if (!changelog_data) return Promise.reject(new Error('Changelog Data not found'));
        if (!(changelog_data instanceof Object)) return Promise.reject(new Error('Changelog Data not in the correct format'));
        if (!changelog_data.page) return Promise.reject(new Error('Changelog Page Identifier not found'));

        try {
            let changelogs = await this.AccessFrikyDB(this.CHANGELOG_DATABASE, { page: changelog_data.page });
            if (changelogs.length > 0) return Promise.reject(new Error('Changelog Page Identifier allready in use'));
        } catch (err) {
            return Promise.reject(err);
        }

        return this.CHANGELOG_DATABASE.insert(changelog_data);
    }
    async EditChangelog(changelog_data, old_page) {
        if (!changelog_data) return Promise.reject(new Error('Changelog Data not found'));
        if (!(changelog_data instanceof Object)) return Promise.reject(new Error('Changelog Data not in the correct format'));
        if (!changelog_data.page) return Promise.reject(new Error('Changelog Page Identifier not found'));

        //Oldpage Exists Check
        if (old_page !== changelog_data.page) {
            try {
                let news = await this.AccessFrikyDB(this.CHANGELOG_DATABASE, { page: old_page });
                if (news.length > 0) return Promise.reject(new Error("Changelog Page already exists!"));
            } catch (err) {
                return Promise.reject(err);
            }
        }

        return this.CHANGELOG_DATABASE.update({ page: old_page || changelog_data.page }, changelog_data);
    }
    async RemoveChangelog(page) {
        if (!page) return Promise.reject(new Error('Page not found'));

        return this.CHANGELOG_DATABASE.remove({ page });
    }
    
    async getChangelogs(params, include_scheduled = false) {
        let Changelogs = [];
        let pagination;
        let cfg = this.Config.GetConfig();

        for (let p in params) {
            if (p.charAt(0) === '?') {
                params[p.substring(1)] = params[p];
                delete params[p];
            }
        }
        
        //Scheduled
        if (include_scheduled == false) {
            try {
                if (!(params.end && parseInt(params.end) < Date.now())) params.end = Date.now() + "";
            } catch (err) {
                params.end = Date.now() + "";
            }
        }
        let query = this.createNEDBQuery('changelogs', params);

        if (!query) return Promise.reject(new Error("Internal Error."));

        //Fetch
        try {
            Changelogs = await this.AccessFrikyDB(this.CHANGELOG_DATABASE, query);
        } catch (err) {
            return Promise.reject(err);
        }

        //Filter
        Changelogs.sort((a, b) => b.date - a.date);
        if (params.pagination) {
            //index;first
            pagination = this.getNextArrayPagination(Changelogs, params.pagination);
            Changelogs = this.getArrayPage(Changelogs, params.pagination);
        } else if (params.first) {
            try {
                pagination = this.getNextArrayPagination(Changelogs, '0;' + parseInt(params.first));
                Changelogs = Changelogs.slice(0, parseInt(params.first));
            } catch (err) {
                Changelogs = Changelogs.slice(0, cfg['API_CHANGELOG_FIRST_DEFAULT']);
            }
        } else {
            Changelogs = Changelogs.slice(0, cfg['API_CHANGELOG_FIRST_DEFAULT']);
        }

        return Promise.resolve({ Changelogs, pagination });
    }
    
    validateChangelog(jsonData) {
        if (!jsonData.title || !jsonData.date || !jsonData.page) {
            return false;
        }
        if (isNaN(jsonData.date) || typeof (jsonData.title) != "string") {
            return false;
        }
        return true;
    }

    //UTIL
    GetCustomFiles() {
        let files = [];
        let cfg = this.Config.GetConfig();

        try {
            files = this.getFilesFromDir(PATH.resolve(cfg['News_File_Dir']));
        } catch (err) {

        }

        return files;
    }
    createNEDBQuery(dir, params) {
        let query = [];

        //Querry
        for (let param in params) {
            if (API_ENDPOINT_PARAMETERS[dir] && API_ENDPOINT_PARAMETERS[dir][param] === undefined) return null;
            if (API_ENDPOINT_PARAMETERS[dir] && API_ENDPOINT_PARAMETERS[dir][param] !== 'query') continue;

            try {
                if (param === 'idx') {
                    query.push({ [param]: parseInt(params.idx) });
                } else if (param === 'day') {
                    let start = (new Date(parseInt(params.day)));
                    start.setHours(0, 0, 0, 0);
                    let end = (new Date(parseInt(params.day)));
                    end.setHours(23, 59, 59, 999);
                    query.push({ date: { $gt: start.getTime(), $lt: end.getTime() } });
                } else if (param === 'start' && params.end === undefined) {
                    query.push({ date: { $gt: parseInt(params.start) } });
                } else if (param === 'end' && params.start === undefined) {
                    query.push({ date: { $lt: parseInt(params.end) } });
                } else if (param === 'start') {
                    query.push({ date: { $gt: parseInt(params.start), $lt: parseInt(params.end) } });
                } else {
                    query.push({ [param]: params[param] });
                }
            } catch (err) {

            }
        }

        return { $and: query };
    }
    getNeDBTimeQuery(type, a, b) {
        try {
            if (type === 'day') {
                let start = (new Date(a));
                start.setHours(0, 0, 0, 0);
                let end = (new Date(b));
                end.setHours(23, 59, 59, 999);

                return { $gt: start.getTime(), $lt: end.getTime() };
            } else {
                return a;
            }
        } catch (err) {
            return a;
        }
    }

    getArrayPage(array, pagination) {
        try {
            let index = parseInt(pagination.split(';')[0]);
            let first = parseInt(pagination.split(';')[1]);

            return array.slice(first * index, first * (index + 1));
        } catch (err) {
            return array;
        }
    }
    getNextArrayPagination(array, pagination) {
        try {
            let index = parseInt(pagination.split(';')[0]);
            let first = parseInt(pagination.split(';')[1]);
            let max = Math.floor(array.length / first);
            return (max > (index + 1) ? (index + 1) : max) + ';' + first;
        } catch (err) {
            return pagination;
        }
    }
}

module.exports.DETAILS = PACKAGE_DETAILS;
module.exports.NewsFeed = NewsFeed;