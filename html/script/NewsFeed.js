/* -------------------------------------
 *          NEEDED HTML CODE
 * -------------------------------------
 * 
    <div id="News_Feed">
        <!-- News will be placed here -->
    </div>
 * 
 * -------------------------------------
 *            DOCUMENTATION
 * -------------------------------------
 * 
 *  -> See BIG Documentation .../Util/NewsFeed
 * 
 */

let NEWS_FEED_SETTINGS = {
    reversed: false,
    folder: "News/",
    publicFolder: "/News/Custom/",
    DEFAULT_LINK_TARGET: "_blank",
    ROOT_URL: "/api/News"
};

function NEWS_FEED_Settings(settings) {
    for (key in settings) {
        NEWS_FEED_SETTINGS[key] = settings[key];
    }
}

////////////////////////////////////
//          API STUFF
////////////////////////////////////

async function NEWS_FEED_FETCH(endpoint, querry) {
    const url = NEWS_FEED_SETTINGS.ROOT_URL + (endpoint ? '/' + endpoint : '') + (querry ? "?" + querry : "");

    return fetch(url, getAuthHeader())
        .then(STANDARD_FETCH_RESPONSE_CHECKER)
        .then(json => {
            if (json.err) {
                return Promise.reject(new Error(json.err));
            } else {
                return Promise.resolve(json);
            }
        })
        .catch(err => {
            return Promise.reject(err);
        });
}

async function NEWS_FEED_FETCH_Feed(endpoint, querry, replace) {
    try {
        document.getElementById("NEWS_FEED_Feed").innerHTML = '<div id="NEWS_FEED_Feed_WAITER">' + MISC_LOADING_RING_CREATE() + '</div>';
    } catch (err) {

    }

    return NEWS_FEED_FETCH(endpoint, querry)
        .then(json => {
            const News = json.data.News;
            
            if (document.getElementById("NEWS_FEED_Feed") && News && Array.isArray(News)) {
                let s = "";

                for (let news of News) {
                    if (NEWS_FEED_SETTINGS.reversed) {
                        s = NEWS_FEED_createFeed(news) + s;
                    } else {
                        s += NEWS_FEED_createFeed(news);
                    }
                }

                if (s === "") {
                    s = '<center class="NEWS_FEED_NO_NEWS">NO NEWS FOUND</center>';
                }

                if (replace) {
                    document.getElementById("NEWS_FEED_Feed").innerHTML = s;
                } else {
                    document.getElementById("NEWS_FEED_Feed").innerHTML += s;
                }
            }
            
            if (document.getElementById("NEWS_FEED_Feed_WAITER")) document.getElementById("NEWS_FEED_Feed_WAITER").remove();
            return json.data;
        })
        .catch(err => {
            if (document.getElementById("NEWS_FEED_Feed_WAITER")) document.getElementById("NEWS_FEED_Feed_WAITER").remove();
            document.getElementById("NEWS_FEED_Feed").innerHTML = '<center class="NEWS_FEED_NO_NEWS">NO NEWS FOUND</center>';
            return Promise.reject(err);
        });
}
async function NEWS_FEED_FETCH_FullPage(page) {
    try {
        document.getElementById("NEWS_FEED_Feed").innerHTML = '<div id="NEWS_FEED_Feed_WAITER">' + MISC_LOADING_RING_CREATE() + '</div>';
    } catch (err) {

    }
    
    return NEWS_FEED_FETCH(null, 'page=' + page)
        .then(json => {
            if (document.getElementById("NEWS_FEED_FullPage") && json.data.News && json.data.News[0]) {
                document.getElementById("NEWS_FEED_FullPage").innerHTML = NEWS_FEED_createFullPage(json.data.News[0]);
            } else if (document.getElementById("NEWS_FEED_FullPage")) {
                document.getElementById("NEWS_FEED_FullPage").innerHTML = '<center class="NEWS_FEED_NO_NEWS">NO NEWS FOUND</center>';
            }
            
            return json.data;
        })
        .catch(err => {
            console.log(err);
            return Promise.reject(err);
        });
}

////////////////////////////////////
//          CreateParts
////////////////////////////////////

function NEWS_FEED_createFeed(data) {
    if (!data.title || !data.date) {
        return "";
    }

    //HEADERS - Title / Date
    let News_Feed_Header = '<div class="News_Feed_Header">';
    News_Feed_Header += '<h2><a ' + (data.page ? 'href="' + NEWS_FEED_SETTINGS.folder + data.page + '"' : '') + '>' + data.title + '</a></h2>';
    News_Feed_Header += '<p ' + (data.date > Date.now() ? 'scheduled' : '') + ' title="' + NEWS_FEED_getFullDateString(data.date) + '">' + NEWS_FEED_getDateString(data.date) + '</p>';
    News_Feed_Header += '</div>';

    //BODY
    let News_Feed_Body = '<div class="News_Feed_Body">' + NEWS_FEED_createImages(data.images, data.page) + NEWS_FEED_createDescription(data.description.top, "News_Feed_Text_Top") + NEWS_FEED_createDescription(data.description.bottom, "News_Feed_Text_Bottom") + NEWS_FEED_createMisc(data.misc) + '</div >';
    
    //News Wrapper
    let News_Feed_News = '<div class="News_Feed_News">' + News_Feed_Header + News_Feed_Body + '</div>';


    return News_Feed_News;
}
function NEWS_FEED_createFullPage(data) {
    if (!data.title || !data.date) {
        return "";
    }

    //HEADERS - Title / Date
    let News_Feed_Header = '<div class="News_Feed_Header">';
    News_Feed_Header += '<h2>' + data.title + '</h2>';
    News_Feed_Header += '<p ' + (data.date > Date.now() ? 'scheduled' : '') + ' title="' + NEWS_FEED_getFullDateString(data.date) + '">' + NEWS_FEED_getDateString(data.date) + '</p>';
    News_Feed_Header += '</div >';

    //BODY
    let News_Feed_Big_Image = data.images && data.images.length >= 1 ? NEWS_FEED_createA(NEWS_FEED_createImage(data.images[0].source, data.images[0].title), (data.images[0].link == "this" ? data.images[0].source : data.images[0].link), data.images[0].target, "News_Feed_Big_Image") : "";
    let News_Feed_Body = '<div class="News_Feed_Body">' + News_Feed_Big_Image + NEWS_FEED_createDescription(data.description.top, "News_Feed_Text_Top") + NEWS_FEED_createDescription(data.description.bottom, "News_Feed_Text_Bottom") + NEWS_FEED_createMisc(data.misc) + '</div >';
    
    //News Wrapper
    return '<div class="Wrapper">' + News_Feed_Header + News_Feed_Body + "</div>" + NEWS_FEED_getExtraImages(data.images);
    
}

function NEWS_FEED_createImages(images, page) {
    let News_Feed_Images = '';

    if (images && Array.isArray(images)) {

        let Images = '';

        for (let i = 0; i < images.length && i < 5; i++) {
            let img = images[i];

            if (!img.source) {
                continue;
            }

            Images += NEWS_FEED_createA(NEWS_FEED_createImage(img.source, img.title), (img.link == "this" ? img.source : img.link), img.target, (i == 0 ? "News_Feed_Big_Image" : "News_Feed_Small_Image"));
        }

        if (images.length >= 5) {
            Images += '<a ' + (page ? 'href="' + NEWS_FEED_SETTINGS.folder + page + '"' : '') + ' class="News_Feed_More_Images">...</a>';
        }

        News_Feed_Images = '<div class="News_Feed_Images">' + Images + '</div>';
    }

    return News_Feed_Images;
}
function NEWS_FEED_createDescription(array, Class) {
    if (array && Array.isArray(array)) {
        let content = '';
        for (let p of array) {
            if (typeof p === 'string' || p instanceof String) {
                content += '<p>' + p + '</p>';
            } else if (p.text && (!p.isHeadline || p.isHeadline == false)) {
                content += '<p>' + p.text + '</p>';
            } else if (p.text && p.isHeadline == true) {
                content += '<h3>' + p.text + '</h3>';
            }
        }
        return '<div ' + (Class ? ' class="' + Class + '" ' : '') +  '>' + content + '</div>';
    }
    return "";
}
function NEWS_FEED_createMisc(miscs) {
    if (miscs && Array.isArray(miscs)) {

        let Miscs = "";

        for (let misc of miscs) {
            if (!misc.icon || !misc.type || !misc.text) {
                continue;
            }

            if (misc.type == "link" && misc.link) {
                Miscs += '<div class="News_Feed_Text_Misc">' + NEWS_FEED_createImage(misc.icon) + NEWS_FEED_createA(misc.text, (misc.type == "link" ? (misc.link == "this" ? misc.icon : misc.link) : null), misc.target) + '</div>';
            } else if (isColor(misc.type)) {
                Miscs += '<div class="News_Feed_Text_Misc">' + NEWS_FEED_createImage(misc.icon) + '<a style="color: ' + misc.type + '">' + misc.text + '</a></div>';
            } else if (isSize(misc.type)) {
                Miscs += '<div class="News_Feed_Text_Misc">' + NEWS_FEED_createImage(misc.icon) + '<a style="font-size: ' + misc.type + '">' + misc.text + '</a></div>';
            } else {
                Miscs += '<div class="News_Feed_Text_Misc">' + NEWS_FEED_createImage(misc.icon) + '<a>' + misc.text + '</a></div>';
            }
        }

        return '<div class="News_Feed_Text_Miscs">' + Miscs + '</div>';
    }

    return "";
}
function NEWS_FEED_getExtraImages(images) {
    if (images && Array.isArray(images) && images.length >= 2) {
        let AllImages = '';

        for (let img of images) {
            if (!img.source) {
                continue;
            }
            AllImages += NEWS_FEED_createA(NEWS_FEED_createImage(img.source, img.title), (img.link == "this" ? img.source : img.link), img.target);
        }
        return '<div class="News_Feed_Images"><h2>Other Images</h2><div>' + AllImages + '</div></div>';
    }
    return "";
}

////////////////////////////////////
//          CreateElements
////////////////////////////////////

function NEWS_FEED_createImage(source, title) {
    return '<img src="' + source + '"' + (title ? 'title="' + title + '"' : "") + '/>';
}
function NEWS_FEED_createA(text, link, target, Class, id) {
    return '<a ' + (Class ? ' class="' + Class + '" ' : '') + (id ? ' id="' + id + '" ' : '') + ' ' + (link ? ' href="' + link + '" ' : "") + 'target="' + (target ? target : NEWS_FEED_SETTINGS.DEFAULT_LINK_TARGET) + '" >' + text + '</a>';
}

////////////////////////////////////
//          NEWSMAKER
////////////////////////////////////

const NEWS_FEED_NEWSMAKER_ELEMENTS = {
    title_id: 'Editor_Input_Title',
    data_id: 'Editor_Input_Date',
    page_id: 'Editor_Input_Page',
    top_id: 'Editor_Input_Description_Top',
    bottom_id: 'Editor_Input_Description_Bottom',
    image_class: 'NEWS_FEED_NEWSMAKER_IMAGE',
    misc_class: 'NEWS_FEED_NEWSMAKER_MISC'
};
let FILES = [];
let FILE_LIB_ELT = null;

function NEWS_FEED_NEWSMAKER_updatePreview() {
    let json = NEWS_FEED_NEWSMAKER_generateJSON();
    document.getElementById("NEWS_FEED_FullPage").innerHTML = NEWS_FEED_createFullPage(json);
    if (document.getElementById("NEWS_FEED_FullPage").innerHTML) document.getElementById('SaveBTN').disabled = false;
    else document.getElementById('SaveBTN').disabled = true;
}
function NEWS_FEED_NEWSMAKER_generateJSON() {
    //Collect Data
    let preview = {
        title: document.getElementById(NEWS_FEED_NEWSMAKER_ELEMENTS.title_id).value,
        description: {
            top: [],
            bottom: []
        },
        images: [],
        misc: [],
        date: new Date(document.getElementById(NEWS_FEED_NEWSMAKER_ELEMENTS.data_id).value).getTime(),
        page: toURLFriendlyText(document.getElementById(NEWS_FEED_NEWSMAKER_ELEMENTS.page_id).value || document.getElementById(NEWS_FEED_NEWSMAKER_ELEMENTS.title_id).value)
    };

    //Add Top Paragraphs
    for (let p of document.getElementById(NEWS_FEED_NEWSMAKER_ELEMENTS.top_id).value.split("\n")) {
        if (p.indexOf("#") == 0) {
            preview.description.top.push({ text: p.substring(1), isHeadline: true });
        } else if (p.length > 0) {
            preview.description.top.push(p);
        }
    }

    //Add Bottom Paragraphs
    for (let p of document.getElementById(NEWS_FEED_NEWSMAKER_ELEMENTS.bottom_id).value.split("\n")) {
        if (p.indexOf("#") == 0) {
            preview.description.bottom.push({ text: p.substring(1), isHeadline: true });
        } else if (p.length > 0) {
            preview.description.bottom.push(p);
        }
    }

    //Add Images
    for (let img of document.getElementsByClassName(NEWS_FEED_NEWSMAKER_ELEMENTS.image_class)) {

        let left = img.childNodes[1].childNodes[0].childNodes;
        let source = img.childNodes[1].childNodes[1].childNodes[0].src;

        if (source.split('/').slice(3).join('/') === 'images/icons/plus.png') {
            source = "";
        }
        
        let img_json = {
            source: source,
            title: left[0].value ? left[0].value : "",
            link: left[2].value ? left[2].value : "",
            target: left[3].value ? left[3].value : ""
        };
        preview.images.push(img_json);
    }

    //Add Misc
    for (let misc of document.getElementsByClassName(NEWS_FEED_NEWSMAKER_ELEMENTS.misc_class)) {
        let misc_json = {
            text: misc.childNodes[1].childNodes[0].value ? misc.childNodes[1].childNodes[0].value : "",
            icon: misc.childNodes[1].childNodes[1].value ? misc.childNodes[1].childNodes[1].value : "",
            type: misc.childNodes[1].childNodes[3].childNodes[0].value ? misc.childNodes[1].childNodes[3].childNodes[0].value : ""
        };

        if (misc_json.type == "link") {
            misc_json.link = misc.childNodes[1].childNodes[3].childNodes[1].value ? misc.childNodes[1].childNodes[3].childNodes[1].value : "";
            misc_json.target = misc.childNodes[1].childNodes[3].childNodes[2].value ? misc.childNodes[1].childNodes[3].childNodes[2].value : "";
        } else if (misc_json.type == "color") {
            misc_json.type = misc.childNodes[1].childNodes[3].childNodes[1].value ? misc.childNodes[1].childNodes[3].childNodes[1].value : "";
        } else if (misc_json.type == "size") {
            misc_json.type = misc.childNodes[1].childNodes[3].childNodes[1].value ? misc.childNodes[1].childNodes[3].childNodes[1].value : "";
        }
        preview.misc.push(misc_json);
    }

    //Return Data
    return preview;
}
function NEWS_FEED_NEWSMAKER_fill(news) {
    if (!news) return;
    document.getElementById(NEWS_FEED_NEWSMAKER_ELEMENTS.title_id).value = news.title || '';
    let date = new Date(news.date || Date.now());

    let year = date.getFullYear();
    if (year < 10) year = "0" + year;

    let month = date.getMonth();
    if (month < 10) month = "0" + month;

    let dt = date.getDate();
    if (dt < 10) dt = "0" + dt;

    let min = date.getHours();
    if (min < 10) min = "0" + min;

    let sec = date.getMinutes();
    if (sec < 10) sec = "0" + sec;

    document.getElementById(NEWS_FEED_NEWSMAKER_ELEMENTS.data_id).value = year + "-" + month + "-" + dt + "T" + min + ":" + sec;
    document.getElementById(NEWS_FEED_NEWSMAKER_ELEMENTS.page_id).value = news.page || '';

    //Add Top Paragraphs
    let s = '';
    for (let p of (news.description || {}).top || []) {
        if (p instanceof Object) {
            s += '#' + p.text;
        } else {
            s += p;
        }
        s += '\n';
    }
    document.getElementById(NEWS_FEED_NEWSMAKER_ELEMENTS.top_id).value = s;

    //Add bottom Paragraphs
    s = '';
    for (let p of (news.description || {}).bottom || []) {
        if (p instanceof Object) {
            s += '#' + p.text;
        } else {
            s += p;
        }
        s += '\n';
    }
    document.getElementById(NEWS_FEED_NEWSMAKER_ELEMENTS.bottom_id).value = s;

    //Add Images
    for (let img of news.images || []) {
        NEWS_FEED_NEWSMAKER_ADD_IMAGE(img);
    }

    //Add Misc
    for (let misc of news.misc || []) {
        NEWS_FEED_NEWSMAKER_ADD_MISC(misc);
    }

    //Update Preview
    NEWS_FEED_NEWSMAKER_updatePreview();
}

function NEWS_FEED_NEWSMAKER_ADD_IMAGE(data = {}) {
    let s = '<center>' + (document.getElementsByClassName(NEWS_FEED_NEWSMAKER_ELEMENTS.image_class).length + 1) + '</center>';
    s += '<div class="Middle">';

    s += '<div>';
    s += '<input placeholder="Title here" value="' + (data.title || "") + '"/>';
    s += '<br />';
    s += '<input placeholder="Link here" value="' + (data.link || "") + '"/>';

    const types = ['_blank', '_self', '_parent', '_top'];
    s += '<select>';
    for (let typ of types) {
        s += '<option value="' + typ + '" ' + (data.target === typ ? 'selected' : '') + '>' + typ + '</option>';
    }

    s += '</select>';
    s += '</div>';
    
    s += '<div class="File">';
    s += '<img title="Select Image!" src="/images/icons/plus.png" onclick="NEWS_FEED_NEWSMAKER_ShowImageLibrary(' + "'" + data.source + "'" + ', this)" />';
    s += '<div></div>';
    s += '</div>';

    s += '</div>';

    let elt = document.createElement("div");
    elt.classList.add("Element");
    elt.classList.add(NEWS_FEED_NEWSMAKER_ELEMENTS.image_class);
    elt.id = 'Image_' + (document.getElementsByClassName(NEWS_FEED_NEWSMAKER_ELEMENTS.image_class).length + 1);
    elt.setAttribute("draggable", "true");
    elt.setAttribute("ondragover", "NEWS_FEED_NEWSMAKER_allowDrop(event)");
    elt.setAttribute("ondragstart", "NEWS_FEED_NEWSMAKER_drag(event)");
    elt.setAttribute("ondrop", "NEWS_FEED_NEWSMAKER_dropSwap(event)");
    elt.innerHTML = s;
    document.getElementById("Image_List").append(elt);
}
function NEWS_FEED_NEWSMAKER_ShowImageLibrary(selected, elt) {
    FILE_LIB_ELT = elt;
    elt.parentElement.childNodes[1].innerHTML = MISC_createFileLibrary(FILES, '/News/Custom/', 'Select News Image', 'images', selected === 'undefined' ? null : selected, null, null, '/api/News/files', 'NEWS_FEED_NEWSMAKER_FileLibChange');
}
function NEWS_FEED_NEWSMAKER_FileLibChange(file) {
    if (FILE_LIB_ELT.src.split('/').pop() === file) {
        FILE_LIB_ELT.src = '/images/icons/plus.png';
        FILE_LIB_ELT.title = 'Select Image!';
        file = '';
    } else {
        FILE_LIB_ELT.src = '/News/Custom/' + file;
        FILE_LIB_ELT.title = file;
    }

    FILE_LIB_ELT.setAttribute('onclick', 'NEWS_FEED_NEWSMAKER_ShowImageLibrary("' + file + '", this)');
    FILE_LIB_ELT.parentElement.childNodes[1].innerHTML = "";
    FILE_LIB_ELT = null;
}

function NEWS_FEED_NEWSMAKER_ADD_MISC(data = {}) {
    let s = '<center>' + (document.getElementsByClassName(NEWS_FEED_NEWSMAKER_ELEMENTS.misc_class).length + 1) + '</center>';
    s += '<div>';
    s += '<input placeholder="Text here" value="' + (data.text || "") + '"/>';
    s += '<input placeholder="Icon Source here" value="' + (data.icon || 'images/icons/paperclip-solid.svg') + '"/>';
    s += '<br />';
    s += '<div>';
    s += NEWS_FEED_NEWSMAKER_MISC_create_select(data.type);
    s += NEWS_FEED_NEWSMAKER_MISC_create_content(data.type, data);
    s += '</div>';
    s += '</div>';

    let elt = document.createElement("div");
    elt.classList.add("Element");
    elt.classList.add(NEWS_FEED_NEWSMAKER_ELEMENTS.misc_class);
    elt.id = 'Misc_' + (document.getElementsByClassName(NEWS_FEED_NEWSMAKER_ELEMENTS.misc_class).length + 1);
    elt.setAttribute("draggable", "true");
    elt.setAttribute("ondragover", "NEWS_FEED_NEWSMAKER_allowDrop(event)");
    elt.setAttribute("ondragstart", "NEWS_FEED_NEWSMAKER_drag(event)");
    elt.setAttribute("ondrop", "NEWS_FEED_NEWSMAKER_dropSwap(event)");
    elt.innerHTML = s;
    document.getElementById("Misc_List").append(elt);
}
function NEWS_FEED_NEWSMAKER_MISC_Change(x) {
    x.parentElement.innerHTML = NEWS_FEED_NEWSMAKER_MISC_create_select(x.value) + NEWS_FEED_NEWSMAKER_MISC_create_content(x.value);
}
function NEWS_FEED_NEWSMAKER_MISC_create_select(selected) {
    let s = "";
    const types = ['info', 'link', 'color', 'size'];
    s += '<select oninput="NEWS_FEED_NEWSMAKER_MISC_Change(this)">';
    for (let typ of types) {
        s += '<option value="' + typ + '" ' + (selected === typ ? 'selected' : '') + '>' + typ + '</option>';
    }
    s += '</select>';
    return s;
}
function NEWS_FEED_NEWSMAKER_MISC_create_content(type, data = {}) {
    let content = "";
    if (type == "link") {
        content = '<input type="text" placeholder="link in here" value="' + (data.link || '') + '"/>';

        const types = ['_blank', '_self', '_parent', '_top'];
        content += '<select>';
        for (let typ of types) {
            content += '<option value="' + typ + '" ' + (data.target === typ ? 'selected' : '') + '>' + typ + '</option>';
        }
        content += '</select>';
    } else if (type == "color") {
        content = '<input type="text" placeholder="color here!" />';
    } else if (type == "size") {
        content = '<input type="text" placeholder="size here! (px and em only)" />';
    }
    return content;
}

function NEWS_FEED_NEWSMAKER_save() {
    let options = getAuthHeader();
    options['method'] = GetURLSearchArray().length < 1 ? 'POST' : 'PUT';
    options['headers']['Content-Type'] = 'application/json';

    let body = {
        news_data: NEWS_FEED_NEWSMAKER_generateJSON()
    };

    //Check Query
    let query = GetURLSearchArray().find(elt => elt.name === 'page');
    if (query) body['old_page'] = query.value[0];

    options['body'] = JSON.stringify(body);

    fetch(NEWS_FEED_SETTINGS.ROOT_URL, options)
        .then(STANDARD_FETCH_RESPONSE_CHECKER)
        .then(json => {
            OUTPUT_showInfo("News Saved!");
            document.getElementById('SaveBTN').disabled = true;
        })
        .catch(err => {
            OUTPUT_showError("Saving failed!");
            console.log(err);
        });
}

function NEWS_FEED_NEWSMAKER_allowDrop(event) {
    event.preventDefault();
}
function NEWS_FEED_NEWSMAKER_drag(event) {
    event.dataTransfer.setData("text", event.target.id);
}
function NEWS_FEED_NEWSMAKER_dropTrash(event) {
    event.preventDefault();
    let elt = document.getElementById(event.dataTransfer.getData("text"));
    let elts = document.getElementsByClassName(elt.classList[1]);
    let i = 0;

    elt.remove();

    for (let elte of elts) {
        elte.id = elte.id.sub(0, elte.id.indexOf("_") + 1) + (++i);
        elte.childNodes[0].innerHTML = i;
    }
}
function NEWS_FEED_NEWSMAKER_dropSwap(event) {
    event.preventDefault();
    let elt1 = document.getElementById(event.dataTransfer.getData("text"));
    let elt2 = event.srcElement;

    if (!elt1 || !elt2) {
        return;
    }

    do {
        elt2 = elt2.parentElement;
    } while (!elt2.classList.contains("Element"));

    if (elt1.classList.value == elt2.classList.value && elt1 != elt2) {
        //Swap ID
        let temp = elt1.id;
        elt1.id = elt2.id;
        elt2.id = temp;

        //Save Values
        elt1 = elt1.childNodes[1];
        elt2 = elt2.childNodes[1];

        let values1 = [];
        let values2 = [];

        for (let v of elt1.childNodes) {
            values1.push(v.value);
        }
        for (let v of elt2.childNodes) {
            values2.push(v.value);
        }

        //SWAP
        temp = elt1.innerHTML;
        elt1.innerHTML = elt2.innerHTML;
        elt2.innerHTML = temp;

        for (let i = 0; i < elt2.childNodes.length && i < values1.length; i++) {
            if (values1[i]) {
                elt2.childNodes[i].value = values1[i];
            }
        }
        for (let i = 0; i < elt1.childNodes.length && i < values2.length; i++) {
            if (values2[i]) {
                elt1.childNodes[i].value = values2[i];
            }
        }
    }
}

function NEWS_FEED_NEWSMAKER_Title_Change(x) {
    document.getElementById('Editor_Input_Page').placeholder = toURLFriendlyText(x.value) || 'URL-Friendly Title here';
}
function toURLFriendlyText(text) {
    let friendly = "";
    const allowed = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z", "0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "-"];
    const conversions = {
        'ä': 'ae',
        'ü': 'ue',
        'ö': 'oe',
        ' ': '-'
    };

    for (let char of text.toLowerCase()) {
        if (conversions[char] !== undefined) friendly += conversions[char];
        if (allowed.find(elt => elt === char) !== undefined) friendly += char;
    }

    return friendly;
}

////////////////////////////////////
//              UTIL
////////////////////////////////////

function NEWS_FEED_getDateString(ISO_Integer) {
    let d = new Date(ISO_Integer);

    if (!(d.getTime() === d.getTime())) {
        return "--.--.----";
    }

    return d.getDate() + "." + (d.getMonth() + 1) + "." + d.getFullYear();
}
function NEWS_FEED_getFullDateString(ISO_Integer) {
    let d = new Date(ISO_Integer);
    let dateS = NEWS_FEED_getDateString(ISO_Integer)

    if (!(d.getTime() === d.getTime())) {
        return dateS + "  --:--";
    }

    let H = d.getHours();
    let M = d.getMinutes();

    if (H < 10) H = "0" + H;
    if (M < 10) M = "0" + M;

    return dateS + " " + H + ':' + M;
}