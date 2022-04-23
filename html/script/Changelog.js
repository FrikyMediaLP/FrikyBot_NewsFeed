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
        LOGGER: ["LOGGER", "images/icons/pen-solid.svg"]
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
async function fetchChangelog(query = "") {
    return fetch(CHANGLOG_SETTINGS.API_ENDPOINT + (query ? '?' + query : ''), getAuthHeader())
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