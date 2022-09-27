const CHANGLOG_SETTINGS = {
    API_ENDPOINT: '/api/news/Changelog',
    ENABLE_FUNCTION_PARAMERS_CSS: true,
    FUNCTION_PARAMERS: ["String", "Integer", "Boolean", "Object", "Array", "TwitchAPI", "ExpressRouter"],
    FUNCTION_PARAMETER_CSS: "color: #ff9a57;",
    ENABLE_TYPE_CSS: true,
    ADDED_CSS: "color: green;",
    REMOVED_CSS: "color: red;",
    CHANGED_CSS: "color: #e6bf25;",
    COMMENT_CSS: "color: dimgray; font-style: italic; padding-left: 15px; font-size: 17px;",
    WARNING_CSS: "color: red; font-style: italic; "
};

const CHANGELOG_CUSTOMS = {
    MODULE: {
        MODULE: ["MODULE", "images/icons/hdd-regular.svg"],
        MODULEBASE: ["MODULE BASE", "images/icons/hdd-regular.svg"],
        SERVER: ["SERVER.js", "images/icons/server-solid.svg"],
        TWITCHAPI: ["TWITCH API", "images/icons/twitch_colored.png"],
        TWITCHIRC: ["TWITCH IRC", "images/icons/twitch_colored_alt.png"],
        WEBAPP: ["WEBAPP", "images/icons/wifi-solid.svg"],
        DATACOLLECTION: ["DATACOLLECTION", "images/icons/chart-bar.svg"]
    },
    PACKAGE: {
        PACKAGE: ["UNKOWN PACKAGE", "images/icons/FrikyBot.png"],
        PACKAGEBASE: ["PACKAGE BASE", "images/icons/FrikyBot.png"],
        COMMANDHANDLER: ["CommandHandler", "images/icons/command.svg"],
        NEWSFEED: ["NewsFeed", "images/icons/newspaper-solid.svg"],
        DOCS: ["Docs", "images/icons/pencil-ruler-solid.svg"],
        CHATMODERATION: ["ChatModeration", "images/icons/user-secret-solid.svg"],
        STATS: ["Stats", "images/icons/chart-bar.svg"],
        ALERTS: ["Alerts", "images/icons/bell-solid.svg"]
    },
    UTIL: {
        CONSTANTS: ["CONSTANTS", "images/icons/address-card-regular.svg"],
        CONFIGHANDLER: ["CONFIGHANDLER", "images/icons/clipboard-list-solid.svg"],
        LOGGER: ["LOGGER", "images/icons/pen-solid.svg"],
        FRIKYDB: ["FRIKYDB", "images/Profiles/blue_transparent.png"]
    },
    "ThirdParty": {
        "3rdParty": ["UNKOWN 3rdParty", "images/icons/external-link-alt-solid.svg"],
        "BTTV": ["BetterTTV", "images/icons/BTTV.png"],
        "FFZ": ["FrankerFaceZ", "images/icons/FFZ.png"]
    }
}

////////////////////////////////////
//          CHANGELOG
////////////////////////////////////

//API
async function fetchChangelog(query = "", full = false) {
    return fetch(CHANGLOG_SETTINGS.API_ENDPOINT + (full ? '/full' : '') + (query ? '?' + query : ''), getAuthHeader())
        .then(STANDARD_FETCH_RESPONSE_CHECKER)
        .then(json => {
            return Promise.resolve(json.data);
        })
        .catch(err => {
            return Promise.reject(err);
        });
}

//Create
function createChangelog(jsonData, prev = "") {
    if (!jsonData) return "";
    let s = '<div class="CHANGELOG" id="THISONE">';
    
    s += '<h1><a href="' + ROOT + 'News/Changelog/' + jsonData.page + '">' + (jsonData.title ? jsonData.title : 'FRIKYBOT-CHANGELOG - ' + getDateString(jsonData.date)) + '</a>';
    s += '<div ' + (jsonData.date > Date.now() ? 'scheduled' : '') + ' title="' + getFullDateString(jsonData.date) + '">' + getDateString(jsonData.date) + '</div>';

    let dtCount = 0;
    for (let chapt in jsonData.chapters) dtCount += searchDetailed(jsonData.chapters[chapt]);
    if (dtCount > 0) s += '<button onclick="toggleDetailed(this.parentElement.parentElement)">DETAILED (' + dtCount + ')</button>';

    s += "</h1>";

    for (let chapt in jsonData.chapters) {
        s += '<h2 id="' + MakeIDFriendly(chapt) + '">' + chapt + createIDRefLink(chapt) + '</h2>';
        for (let thing of jsonData.chapters[chapt]) s += createTHING(thing, chapt);
    }

    return s + "</div>";
}

function createTHING(thing, prev) {
    if (thing.type == "PLAIN") {
        return createChangelogPlain(thing, prev);
    } else if (thing.type == "DASHED_PLAIN") {
        return createChangelogDashedPlain(thing, prev);
    }else if (thing.type == "LIST") {
        return createChangelogList(thing, prev);
    } else if (thing.type == "CHANGES") {
        return createChangelogChanges(thing, prev);
    } else if (thing.type == "HEADER") {
        return createChangelogHeader(thing, prev);
    }

    return "";
}

function createChangelogHeader(headerData, prev) {
    return '<h3 id="' + MakeIDFriendly(prev + "_" + headerData.text) + '">' + headerData.text + createIDRefLink(prev + "_" + headerData.text) + '</h3>';
}
function createChangelogPlain(plainData, prev) {
    let s = "";

    for (let p of plainData.paragraphs) {
        if (p instanceof Object) {
            s += '<p' + (p.detailed ? ' class="detailed" hidden' : "")+ '>' + createText(p.text, p.type) + "</p>";
        } else {
            s += "<p>" + p + "</p>";
        }
    }

    return s;
}
function createChangelogDashedPlain(dPlainData, prev) {
    let s = "";

    for (let p of dPlainData.paragraphs) {
        if (p instanceof Object) {
            s += '<p' + (p.detailed ? ' class="detailed" hidden' : "")+ '>' + createText((p.type != "COMMENT" ? "- " : "") + p.text, p.type) + "</p>";
        } else {
            s += "<p>- " + p + "</p>";
        }
    }

    return s;
}
function createChangelogList(listData, prev) {
    let s = "<ul>";
    
    for (let li of listData.elements) {
        if (li instanceof Object) {
            let classes = "";
            if (li.detailed) {
                classes += "detailed ";
            }

            if (li.type == "COMMENT") {
                classes += " COMMENT ";
            }
            s += '<li' + (classes != "" ? ' class="' + classes + '" ' : "") + (li.detailed ? "hidden": "") + '>' + createText(li.text, li.type) + "</li>";
        } else {
            s += "<li>" + li + "</li>";
        }
    }
    
    return s + "</ul>";
}
function createChangelogChanges(changesData, prev) {
    let name = changesData.name;
    let display_type = changesData.display_type;
    let infos = CHANGELOG_CUSTOMS[display_type][name];
    if (!infos) {
        infos = CHANGELOG_CUSTOMS[display_type][display_type];
        infos[0] = name;
    }
    
    if (!infos) {
        return "";
    }

    let s = '<div class="PreChanges" id="' + MakeIDFriendly(prev + "_" + infos[0]) + '"><div class="CHANGES">';
    s += '<div class="Header ' + name + " " + display_type + '">';
    s += '<div class="IMG"><img src="' + ROOT +  infos[1] + '"/></div>';
    s += '<p>' + infos[0] + createIDRefLink(prev + "_" + infos[0]) +"</p>";

    let dtCount = searchDetailed(changesData.contents);
    if (dtCount > 0) {
        s += '<button onclick="toggleDetailed(this.parentElement.parentElement)">DETAILED (' + dtCount + ')</button>';
    }
    s += "</div>";
    
    s += '<div class="CONTENT">';

    for (let thing of changesData.contents) {
        s += createTHING(thing, prev);
    }

    s += "</div>";

    return s + "</div></div>";
}

function createText(text, type) {
    let copyPasta = text + "";

    if (CHANGLOG_SETTINGS.ENABLE_FUNCTION_PARAMERS_CSS) {
        for (let prm of CHANGLOG_SETTINGS.FUNCTION_PARAMERS) {
            const tag = ": " + prm;

            let i = -1;
            do {
                i = copyPasta.indexOf(tag);
                if (i < 0)
                    continue;
                let addIn = ': <span style="' + CHANGLOG_SETTINGS.FUNCTION_PARAMETER_CSS + '">' + prm + '</span>';
                copyPasta = copyPasta.substring(0, i) + addIn + copyPasta.substring(i + tag.length);
            } while (i >= 0);
        }
    }

    if (CHANGLOG_SETTINGS.ENABLE_TYPE_CSS) {
        if (type == "ADDED") {
            return '<span style="' + CHANGLOG_SETTINGS.ADDED_CSS + '">' + copyPasta + '</span>';
        } else if (type == "REMOVED") {
            return '<span style="' + CHANGLOG_SETTINGS.REMOVED_CSS + '">' + copyPasta + '</span>';
        } else if (type == "CHANGED") {
            return '<span style="' + CHANGLOG_SETTINGS.CHANGED_CSS + '">' + copyPasta + '</span>';
        } else if (type == "COMMENT") {
            return '<span style="' + CHANGLOG_SETTINGS.COMMENT_CSS + '">' + copyPasta + '</span>';
        } else if (type == "WARNING") {
            return '<span style="' + CHANGLOG_SETTINGS.WARNING_CSS + '">' + copyPasta + '</span>';
        }
    }
    
    return copyPasta;
}

function createIDRefLink(name) {
    //MAKE SURE PARENT IS position: relative and add a hover to display: inline it!
    return '<img class="REF_LINK_IMG" src="' + ROOT + 'images/icons/paperclip-solid.svg" onclick="document.location.hash = ' + "'" + MakeIDFriendly(name) + "'" + '; ScollToHash();" title="' + MakeIDFriendly(name) + '"/>';
}

//UTIL
function MakeIDFriendly(name) {
    let splitted = name.split(" ");
    let combinded = splitted[0];

    for (let i = 1; i < splitted.length; i++) {
        if (splitted[i] == "/")
            continue;

        combinded += "_" + splitted[i];
    }

    return combinded;
}
function toggleDetailed(issueElt) {
    for (let child of issueElt.childNodes) {
        if (child.classList) {

            let detailed = false;
            let visible = false;

            for (let className of child.classList) {
                if (className == "detailed") {
                    detailed = true;
                }

                if (className == "detailed_visible") {
                    visible = true;
                }

                if (detailed && visible) {
                    break;
                }
            }

            if (detailed) {
                if (visible) {
                    child.classList.remove("detailed_visible");
                    child.setAttribute('hidden', "true");
                } else {
                    child.classList.add("detailed_visible");
                    child.removeAttribute('hidden', "");
                }
            }

            toggleDetailed(child);
        }
    }
}
function searchDetailed(data) {
    let detailed = 0;
    for (let inner of data) {
        if (inner instanceof Object) {
            if (inner.detailed) {
                detailed++;
            }

            if (inner.elements) {
                detailed += searchDetailed(inner.elements);
            } else if (inner.paragraphs) {
                detailed += searchDetailed(inner.paragraphs);
            } else if (inner.contents) {
                detailed += searchDetailed(inner.contents);
            }
        }
    }

    return detailed;
}
function getDateString(ISO_Integer) {
    let d = new Date(ISO_Integer);

    if (!(d.getTime() === d.getTime())) {
        return "--.--.----";
    }

    return d.getDate() + "." + (d.getMonth() + 1) + "." + d.getFullYear();
}
function getFullDateString(ISO_Integer) {
    let d = new Date(ISO_Integer);
    let dateS = getDateString(ISO_Integer)

    if (!(d.getTime() === d.getTime())) {
        return dateS + "  --:--";
    }

    let H = d.getHours();
    let M = d.getMinutes();

    if (H < 10) H = "0" + H;
    if (M < 10) M = "0" + M;

    return dateS + " " + H + ':' + M;
}

////////////////////////////////////
//        CHANGELOGMAKER
////////////////////////////////////

//Data
function CHANGELOGMAKER_updatePreview() {
    let json = CHANGELOGMAKER_generateJSON();
    if (json.page === 'URL-Friendly Title here' || Object.getOwnPropertyNames(json.chapters).length == 0) {
        document.getElementById('SaveBTN').disabled = true;
        return;
    }
    document.getElementById('SaveBTN').disabled = false;
    document.getElementById('CHANGELOG_PREVIEW').innerHTML = createChangelog(json);
}
function CHANGELOGMAKER_generateJSON() {
    let json = {
        date: new Date(document.getElementById('Editor_Input_Date').value).getTime(),
        title: document.getElementById('Editor_Input_Title').value,
        page: document.getElementById('Editor_Input_Page').value || document.getElementById('Editor_Input_Page').placeholder,
        chapters: {

        }
    };

    //Chapters
    for (let chapt of document.getElementsByClassName('Chapter')) {
        if (!chapt.childNodes[1].childNodes[0].value) continue;
        json.chapters[chapt.childNodes[1].childNodes[0].value] = CHANGELOGMAKER_generateListJSON(chapt.childNodes[1].childNodes[1].childNodes[3].childNodes);
    }

    return json;
}
function CHANGELOGMAKER_generateListJSON(list = []) {
    let out = [];

    for (let thng of list) {
        let thing_data = {
            type: thng.dataset.type
        };
        let childs = thng.childNodes[1].childNodes;

        if (thng.dataset.type === 'HEADER') {
            thing_data['text'] = childs[1].value;
        } else if (thng.dataset.type === 'PLAIN') {
            thing_data['paragraphs'] = CHANGELOGMAKER_ANALYSE_INPUTTEXT(childs[1].value);
        } else if (thng.dataset.type === 'DASHED_PLAIN') {
            thing_data['paragraphs'] = CHANGELOGMAKER_ANALYSE_INPUTTEXT(childs[1].value);
        } else if (thng.dataset.type === 'LIST') {
            thing_data['elements'] = CHANGELOGMAKER_ANALYSE_INPUTTEXT(childs[1].value);
        } else if (thng.dataset.type === 'CHANGES') {
            let inner_childs = childs[1].childNodes;

            let op = inner_childs[0].options[inner_childs[0].selectedIndex];
            let optgroup = op.parentNode.dataset.value;

            thing_data.display_type = optgroup;
            thing_data.name = op.value;

            thing_data['contents'] = CHANGELOGMAKER_generateListJSON(inner_childs[1].childNodes[3].childNodes);
        }

        out.push(thing_data);
    }

    return out;
}

function CHANGELOGMAKER_fill(json = {}) {
    document.getElementById('Editor_Input_Title').value = json.title || '';
    let date = new Date(json.date || Date.now());

    let year = date.getFullYear();
    if (year < 10) year = "0" + year;

    let month = date.getMonth() + 1;
    if (month < 10) month = "0" + month;

    let dt = date.getDate();
    if (dt < 10) dt = "0" + dt;

    let min = date.getHours();
    if (min < 10) min = "0" + min;

    let sec = date.getMinutes();
    if (sec < 10) sec = "0" + sec;

    document.getElementById('Editor_Input_Date').value = year + "-" + month + "-" + dt + "T" + min + ":" + sec;
    document.getElementById('Editor_Input_Page').value = json.page || '';

    for (let chapter in json.chapters || {}) {
        CHANGELOGMAKER_Chapter_add(chapter, json.chapters[chapter]);
    }

    //Update Preview
    CHANGELOGMAKER_updatePreview();
}
function CHANGELOGMAKER_save() {
    let options = getAuthHeader();
    options['method'] = GetURLSearchArray().length < 1 ? 'POST' : 'PUT';
    options['headers']['Content-Type'] = 'application/json';

    let body = {
        changelog_data: CHANGELOGMAKER_generateJSON()
    };

    //Check Query
    let query = GetURLSearchArray().find(elt => elt.name === 'page');
    if (query) body['old_page'] = query.value[0];

    options['body'] = JSON.stringify(body);

    fetch(CHANGLOG_SETTINGS.API_ENDPOINT, options)
        .then(STANDARD_FETCH_RESPONSE_CHECKER)
        .then(json => {
            document.getElementById('SaveBTN').disabled = true;
            OUTPUT_showInfo("Changelog Saved!");
        })
        .catch(err => {
            OUTPUT_showError("Saving failed!");
            console.log(err);
        });
}

//Main
function CHANGELOGMAKER_PageTitle() {
    let s = 'URL-Friendly Title here';

    if (document.getElementById('Editor_Input_Title').value) s = toURLFriendlyText(document.getElementById('Editor_Input_Title').value);
    if (document.getElementById('Editor_Input_Date').value) s = toURLFriendlyText(NEWS_FEED_getFullDateString(document.getElementById('Editor_Input_Date').value));

    document.getElementById('Editor_Input_Page').placeholder = s;
}

//Chapter
function CHANGELOGMAKER_Chapter_add(name, things) {
    let elt = document.createElement("div");
    elt.classList.add("Element");
    elt.classList.add('Chapter');
    elt.id = CHANGELOGMAKER_generateID();
    elt.setAttribute('draggable', 'true');
    elt.setAttribute('ondragstart', 'CHANGELOGMAKER_drag(this, event);');
    elt.innerHTML = CHANGELOGMAKER_Chapter_create(name, things);
    document.getElementById("Chapter_List_Content").append(elt);
}
function CHANGELOGMAKER_Chapter_create(name, things = []) {
    let s = "";

    s += '<div><span>' + (document.getElementsByClassName('Chapter').length + 1) + '</span></div>';

    s += '<div class="Element_Content">';
    s += '<input placeholder="Chapter Title here" oninput="CHANGELOGMAKER_updatePreview();" value="' + (name || '') + '"/>';

    //Thing List Start
    s += '<div class="List" draggable="false">';
    s += '<h4>Things</h4>';
    s += '<img src="../images/icons/trash-alt-solid.svg" ondragover="CHANGELOGMAKER_allowTrashwDrop(event);" ondrop="CHANGELOGMAKER_dropTrash(event, \'Thing\');"/>';
    s += '<button title="Add Thing" onclick="CHANGELOGMAKER_Thing_add(this.parentElement)">+</button>';
    s += '<div class="List_Content Things_List" draggable="false">'

    for (let i = 0; i < things.length; i++) {
        s += CHANGELOGMAKER_Thing_add(null, i, things[i]);
    }

    s += '</div>';
    s += '</div>';
    //Thing List End

    s += '</div>';
    s += '<img draggable="false" src="../images/icons/arrows-alt-solid.svg" ondragover="CHANGELOGMAKER_allowChapterDrop(event);" ondrop="CHANGELOGMAKER_dropChapter(event);"/>';

    return s;
}

//Thing
function CHANGELOGMAKER_Thing_add(elt, index, data) {
    if (elt) {
        let location = findLocation('Things_List', elt);
        let div = document.createElement("div");
        div.classList.add("Element");
        div.classList.add('Thing');
        div.id = CHANGELOGMAKER_generateID();
        div.dataset.type = "HEADER";
        div.setAttribute('draggable', 'true');
        div.setAttribute('ondragstart', 'CHANGELOGMAKER_drag(this, event);');
        div.innerHTML = CHANGELOGMAKER_Thing_create(location);
        location.append(div);
    } else {
        let s = '<div class="Element Thing" data-type="' + (data.type || 'HEADER') + '" id="' + CHANGELOGMAKER_generateID() + '" draggable="true" ondragstart="CHANGELOGMAKER_drag(this, event);" >';
        s += CHANGELOGMAKER_Thing_create(index, data);
        s += '</div>';
        return s;
    }
}
function CHANGELOGMAKER_Thing_create(at, data) {
    let index = (at instanceof Element ? at.childNodes.length + 1 : at);

    let s = '<div><span>' + index + '</span></div>';

    s += '<div class="Element_Content">';
    s += CHANGELOGMAKER_Thing_createContent(data);
    s += '</div>';

    s += '<img draggable="false" src="../images/icons/arrows-alt-solid.svg" ondragover="CHANGELOGMAKER_allowThingDrop(event);" ondrop="CHANGELOGMAKER_dropThing(event);" />';
    return s;
}
function CHANGELOGMAKER_Thing_createContent(thing) {
    const types = ['HEADER', 'PLAIN', 'DASHED_PLAIN', 'LIST', 'CHANGES'];
    if (!thing) thing = { type: types[0] }

    let s = '';
    s += '<select onchange="CHANGELOGMAKER_Thing_Change(this)">';
    for (let typ of types) {
        s += '<option value="' + typ + '" ' + (thing.type == typ ? 'selected' : '') + '>' + typ + '</option>';
    }
    s += '</select>';
    s += CHANGELOGMAKER_Thing_createType(thing);

    return s;
}
function CHANGELOGMAKER_Thing_createType(thing = {}) {
    let s = "";

    if (thing.type == "PLAIN") {
        s = '<textarea placeholder="Enter Paragraphs here (Line seperated | [d]: detailed | [c]: comment [a]: added [r]: removed [ch]: changed [w]: warning)" oninput="CHANGELOGMAKER_updatePreview();">' + CHANGELOGMAKER_ANALYSE_INVERSETEXT(thing.paragraphs) + '</textarea>';
    } else if (thing.type == "DASHED_PLAIN") {
        s = '<textarea placeholder="Enter Paragraphs here (Line seperated | [d]: detailed | [c]: comment [a]: added [r]: removed [ch]: changed [w]: warning)" oninput="CHANGELOGMAKER_updatePreview();">' + CHANGELOGMAKER_ANALYSE_INVERSETEXT(thing.paragraphs) + '</textarea>';
    } else if (thing.type == "LIST") {
        s = '<textarea placeholder="Enter Paragraphs here (Line seperated | [d]: detailed | [c]: comment [a]: added [r]: removed [ch]: changed [w]: warning)" oninput="CHANGELOGMAKER_updatePreview();">' + CHANGELOGMAKER_ANALYSE_INVERSETEXT(thing.elements) + '</textarea>';
    } else if (thing.type == "HEADER") {
        s = '<input value="' + (thing.text || '') + '" placeholder="Enter Title here" oninput="CHANGELOGMAKER_updatePreview();" />';
    } else if (thing.type == "CHANGES") {
        s = '<div class="CHANGELOGMAKER_CHANGES">';

        s += '<select onchange="CHANGELOGMAKER_updatePreview()">';
        for (let typ in CHANGELOG_CUSTOMS) {
            s += '<optgroup data-value="' + typ + '" label="' + typ + '">';
            for (let mdl in CHANGELOG_CUSTOMS[typ]) {
                s += '<option value="' + mdl + '" ' + (mdl === thing.name ? 'selected' : '') + '>' + mdl + '</option>';
            }
            s += '</optgroup>';
        }
        s += '</select>';

        //Thing List
        s += '<div class="List">';
        s += '<h4>Things</h4>';
        s += '<img src="../images/icons/trash-alt-solid.svg" ondragover="CHANGELOGMAKER_allowTrashwDrop(event);" ondrop="CHANGELOGMAKER_dropTrash(event, \'Thing\');"/>';
        s += '<button title="Add Thing" onclick="CHANGELOGMAKER_Thing_add(this.parentElement)">+</button>';
        s += '<div class="List_Content Things_List">'

        for (let i = 0; i < (thing.contents || []).length; i++) {
            s += CHANGELOGMAKER_Thing_add(null, i, thing.contents[i]);
        }

        s += '</div>';
        s += '</div>';
        //Thing List

        s += '</div>';
    }

    return s;
}
function CHANGELOGMAKER_Thing_Change(elt) {
    elt.parentElement.parentElement.dataset.type = elt.value;
    elt.parentElement.innerHTML = CHANGELOGMAKER_Thing_createContent({ type: elt.value });
}

//Dragging
function CHANGELOGMAKER_drag(elt, e) {
    if (e.dataTransfer.getData("id")) return;
    if (e.layerX < elt.clientWidth - 20) e.preventDefault();
    e.dataTransfer.setData('type', elt.classList.contains('Chapter') ? 'Chapter' : 'Thing');
    e.dataTransfer.setData("id", elt.id);
    DROPMODE = elt.classList.contains('Chapter') ? 'Chapter' : 'Thing';
    DROP_SRC_PARENT = elt.parentElement.parentElement;
}

function CHANGELOGMAKER_allowTrashwDrop(e) {
    if (DROPMODE === 'Chapter' && e.path[3].classList.contains('Editor')) e.preventDefault();
    else if (DROPMODE === 'Thing' && !e.path[3].classList.contains('Editor')) {

        //Parent
        if (e.target.parentElement !== DROP_SRC_PARENT) return;
        e.preventDefault();
    }
}
function CHANGELOGMAKER_dropTrash(e, type) {
    DROPMODE = null;
    if (type !== e.dataTransfer.getData('type')) return;

    //Parent
    if (document.getElementById(e.dataTransfer.getData('id')).parentElement.parentElement !== e.target.parentElement) return;

    document.getElementById(e.dataTransfer.getData('id')).remove();
    CHANGELOGMAKER_updatePreview();
}

function CHANGELOGMAKER_allowChapterDrop(e) {
    if (DROPMODE === 'Chapter') e.preventDefault();
}
function CHANGELOGMAKER_dropChapter(e) {
    if (DROPMODE !== 'Chapter') return;
    DROPMODE = null;
    let src = document.getElementById(e.dataTransfer.getData('id'));
    let target = e.target;

    while (!target.classList.contains('Chapter') && target.tagName !== 'BODY') {
        target = target.parentElement;
    }
    if (target.tagName == 'BODY') return;
    if (target == src) return;

    //Target
    //[old content] [move] [id]
    target.appendChild(target.childNodes[0]);
    //[old content] [move] [id] [new content]
    target.appendChild(src.childNodes[1]);
    //[old content] [id] [new content] [move]
    target.appendChild(target.childNodes[1]);

    //Src
    //[move] [id]
    src.appendChild(src.childNodes[0]);
    //[move] [id] [new content]
    src.appendChild(target.childNodes[0]);
    //[id] [new content] [move]
    src.appendChild(src.childNodes[0]);

    CHANGELOGMAKER_updatePreview();
}

function CHANGELOGMAKER_allowThingDrop(e) {
    if (DROPMODE === 'Thing') e.preventDefault();
}
function CHANGELOGMAKER_dropThing(e) {
    if (DROPMODE !== 'Thing') return;
    DROPMODE = null;
    let src = document.getElementById(e.dataTransfer.getData('id'));
    let target = e.target;

    while (!target.classList.contains('Thing') && target.tagName !== 'BODY') {
        target = target.parentElement;
    }
    if (target.tagName == 'BODY') return;
    if (target == src) return;

    let temp_type = target.dataset.type;

    //Target
    //[old content] [move] [id]
    target.appendChild(target.childNodes[0]);
    //[old content] [move] [id] [new content]
    target.appendChild(src.childNodes[1]);
    //[old content] [id] [new content] [move]
    target.appendChild(target.childNodes[1]);

    target.dataset.type = src.dataset.type;

    //Src
    //[move] [id]
    src.appendChild(src.childNodes[0]);
    //[move] [id] [new content]
    src.appendChild(target.childNodes[0]);
    //[id] [new content] [move]
    src.appendChild(src.childNodes[0]);

    src.dataset.type = temp_type;

    CHANGELOGMAKER_updatePreview();
}

//Util
function CHANGELOGMAKER_ANALYSE_INVERSETEXT(paragraphs = []) {
    let s = "";

    for (let p of paragraphs) {
        if (s) s += '\n';
        if (p instanceof Object) {
            if (p.detailed) s += '[d]';

            for (let keyword in INPUT_TEXT_KEYWORDS) {
                if (p.type !== INPUT_TEXT_KEYWORDS[keyword]) continue;
                s += '[' + keyword + ']' + p.text;
            }
        } else {
            s += p;
        }
    }
    return s;
}
function CHANGELOGMAKER_ANALYSE_INPUTTEXT(text) {
    let paragraphs = [];

    for (let p of text.split('\n')) {
        let count = paragraphs.length;
        for (let keyword in INPUT_TEXT_KEYWORDS) {
            if (p.indexOf('[' + keyword + ']') < 0) continue;

            let data = { type: INPUT_TEXT_KEYWORDS[keyword], text: p.substring(Math.max(p.indexOf('[' + keyword + ']') + 2 + keyword.length, p.indexOf('[d]') + 4)) };
            if (p.indexOf('[d]') > -1) data.detailed = true;

            paragraphs.push(data);
            break;
        }

        if (paragraphs.length === count && p.indexOf('[d]') > -1) paragraphs.push({ text: p.substring(4), detailed: true });
        else if (paragraphs.length === count) paragraphs.push(p);
    }

    return paragraphs;
}
function findLocation(className, wrapper_elt) {
    for (let elt of wrapper_elt.childNodes) {
        if (elt.classList.contains(className)) return elt;
    }

    return null;
}
function toURLFriendlyText(text) {
    let friendly = "";
    const allowed = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z", "0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "-"];
    const conversions = {
        'ä': 'ae',
        'ü': 'ue',
        'ö': 'oe',
        ' ': '-',
        '.': '_'
    };

    for (let char of text.toLowerCase()) {
        if (conversions[char] !== undefined) friendly += conversions[char];
        if (allowed.find(elt => elt === char) !== undefined) friendly += char;
    }

    return friendly;
}
function CHANGELOGMAKER_generateID() {
    let id = "";
    const MAX_LENGTH = 5;
    const allowed = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z", "0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];

    do {
        id = "RNG_";
        for (let i = 0; i < MAX_LENGTH; i++) {
            id += allowed[Math.floor(Math.random() * allowed.length)];
        }
    } while (document.getElementById(id));
    return id;
}