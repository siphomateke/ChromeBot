////////////////////////                      ////////////////////////
////////////////////////                      ////////////////////////
//////////////////////// VARIABLE DEFINITIONS ////////////////////////
////////////////////////                      ////////////////////////
////////////////////////                      ////////////////////////

var get_youtube_url = false;

function emoji_equal(emoji1, emoji2) {
    return emoji1.codePointAt(0) == emoji2.codePointAt(0)
}

function WhatsAppBot() {
    this.listening = false;
    this.tabs_injected = [];
    this.whatsapp_tabs = [];
    this.last_msg = '';
    this._confirm_check = function () {};

    this.new_message = function (msg) {
        this.last_msg = msg;
        this._confirm_check(this.last_msg);
    }

    this.send_tab_message = function (data) {
        if (this.whatsapp_tabs.length == 1) {
            chrome.tabs.sendMessage(this.whatsapp_tabs[0], data);
        } else {
            console.log('Error: More than one tab found!');
        }
    }

    this.send_whatsapp_msg = function (msg, to) {
        this.send_tab_message({
            command: 'send_msg',
            msg: msg,
            to: to
        });
    }

    this.confirm_action = function (action, callback) {
        this.send_whatsapp_msg(action);

        // Called when new message is received
        this._confirm_check = function (msg_original) {
            var msg = msg_original.toLowerCase();
            var confirmed = false;
            if (msg == 'yes' || msg == 'y' || emoji_equal(msg, '\u{1F44D}')) {
                confirmed = true;
            }
            callback(confirmed);
            this._confirm_check = function () {};
        }
    }
}

var wab = new WhatsAppBot();

var saved_tab;

var dictionary_of_functions = {
    'google': GoogleThis,
    '\u{274C}': closeActiveTab,
    'youtube': YouTubeThis,
    '\u{1F4D6}': WikipediaThis,
    'keepvid': openKeepVid,
    '\u{2B07}': getYouTubeURL,
    'say': PLEASERENAMEMESOONTHANKS1
};

var dictionary_of_dumb_chat = {
    "Yes it is": "No it isn't",
    "No it isn't": "Yes it is",
    "You're stupid": "No I'm not",
    "What's nine plus ten?": "Twenty-one?",
    "What's 9 plus 10?": "21?",
    "What's the answer to life the universe and everything?":"42",
    "Shut up": "",
    "Goodnight": "Goodnight",
    "nyt": "nyt",
    "night": "night",
    "I'm going to bed now": "so?"
};

////////////////////////                      ////////////////////////
////////////////////////                      ////////////////////////
//////////////////////// FUNCTION DEFINITIONS ////////////////////////
////////////////////////                      ////////////////////////
////////////////////////                      ////////////////////////

//             //
// BASIC STUFF //
//             //

//When placed inside a function, this logs the name of the function to the console as "FUNCTION: [name of function here]"
function logf() {
    var tmp = arguments.callee.caller.toString();
    tmp = tmp.substr('function '.length);
    var functionname = tmp.substr(0, tmp.indexOf('('));
    console.log("FUNCTION: " + functionname);
}



//                //
// TAB MANAGEMENT //
//                //

//This is easier than typing that chrome.whatever to open a new tab
function newTab(url, savetab, active) {
    logf();
    chrome.tabs.create({
        active: active,
        url: url
    }, function (tab) {
        if (savetab == true) {
            saved_tab = tab;
        }
    });
}

//closes the specified tab
function closeTab(tab) {
    logf();
    chrome.tabs.remove(tab.id);
}

//executes callback function on the active tab
function onActiveTab(callback) {
    logf();
    chrome.tabs.query({
        active: true,
        currentWindow: true
    }, function (tabs) {
        var activetab = tabs[0];
        callback(activetab);
    });
}

//closes the active tab
function closeActiveTab() {
    logf();
    onActiveTab(closeTab)
}

function getTab(url, callback, multiple) {
    logf();
    chrome.tabs.query({
            currentWindow: true,
            url: url
        },
        function (tabs) {
            if (multiple != undefined && multiple) {
                callback(tabs);
            } else {
                callback(tabs[0]);
            }
        }
    );
    return false;
}





//           //
// UNGROUPED //
//           //

function GoogleThis(arg, lucky, savetab, active) {
    logf();
    logf();
    if (lucky == undefined || lucky == false) {
        newTab("https://www.google.co.zm/search?q=" + arg, savetab, active);
    } else if (lucky) {
        newTab("https://www.google.co.zm/search?btnI=I&q=" + arg, savetab, active);
    }
}

function WikipediaThis(arg) {
    logf();
    GoogleThis("site%3Aen.wikipedia.org+" + arg, true);
}

function YouTubeThis(arg, savetab) {
    logf();
    logf();
    GoogleThis("site%3Awww.youtube.com+" + arg, true, savetab);
}

function getYouTubeURL(arg) {
    logf();
    YouTubeThis(arg, true);
    get_youtube_url = true;

}

function openKeepVid(YouTube_url, savetab) {
    logf();
    newTab("http://keepvid.com/?url=" + YouTube_url, savetab)
}

function browserActionColor(arg) {
    logf();
    chrome.browserAction.setIcon({
        path: "images/bot_icon_" + arg + ".png"
    });
}

function PLEASERENAMEMESOONTHANKS1(arg) {
    wab.send_whatsapp_msg(arg)
}

function dumbChat(msg) {
    if (msg in dictionary_of_dumb_chat) {
        wab.send_whatsapp_msg(" "+dictionary_of_dumb_chat[msg])
    }
}





function URLBeginsWith(url, txt) {
    return url.indexOf(txt) > -1;
}

function update_whatsapp_bot_status() {
    logf();
    console.log("WhatsApp tabs: " + wab.whatsapp_tabs.length);
    if (wab.whatsapp_tabs.length > 0) {
        if (!wab.listening) {
            browserActionColor("bw"); // red
        } else {
            browserActionColor("green");
        }
    } else {
        browserActionColor("bw");
        wab.listening = false;
    }
}

function add_whatsapp_tab(id) {
    logf();
    wab.whatsapp_tabs.push(id);
    update_whatsapp_bot_status();
}

function remove_whatsapp_tab(id) {
    logf();
    var idx = wab.whatsapp_tabs.indexOf(id);
    if (idx > -1) {
        wab.whatsapp_tabs.splice(idx, 1);
        update_whatsapp_bot_status();
    }
}

function add_injected_tab(id) {
    logf();
    wab.tabs_injected.push(id);
}

function remove_injected_tab(id) {
    logf();
    var idx = wab.tabs_injected.indexOf(id);
    if (idx > -1) {
        wab.tabs_injected.splice(idx, 1);
    }
}

// Sends a chrome notification
function notify(msg, type, progress) {
    logf();
    if (type == "error") {
        chrome.notifications.create("", {
            type: "basic",
            iconUrl: chrome.runtime.getManifest().icons["128"],
            title: "WhatsApp Bot",
            message: "Error: " + msg,
            isClickable: false
        });
    } else {
        chrome.notifications.create("", {
            type: "basic",
            iconUrl: chrome.runtime.getManifest().icons["128"],
            title: "WhatsApp Bot",
            message: msg,
            isClickable: false
        });
    }
}

////////////////////////                     ////////////////////////
////////////////////////                     ////////////////////////
//////////////////////// FUNCTION EXECUTIONS ////////////////////////
////////////////////////                     ////////////////////////
////////////////////////                     ////////////////////////

//                   //
// NOT CONTEXT MENUS //
//                   //

chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {

        if ("type" in request) {
            if (URLBeginsWith(sender.url, "https://web.whatsapp.com/") && request.type == "loadstate") {
                var loadstate = request.loadstate;
                console.log(loadstate);
                if (loadstate == "loaded") {
                    add_whatsapp_tab(sender.tab.id);
                } else if (loadstate == "unloaded") {
                    remove_whatsapp_tab(sender.tab.id);
                }
            } else if (get_youtube_url == true) {
                //do you want to save a youtube video?
                if (URLBeginsWith(sender.url, "https://www.youtube.com") && request.type == "loadstate" && request.loadstate == "loaded") {
                    //Has that tab just loaded? (rather than just closed)
                    //Is it a youtube tab? (sometimes the tab isn't a youtube tab - for some random reason)
                    if (saved_tab.id == sender.tab.id) {
                        //Is the youtube tab that has just loaded the same as the one that you told to open?
                        closeTab(saved_tab);
                        console.log("Open Keep vid!");
                        openKeepVid(sender.url, true);
                    }
                }
                if (URLBeginsWith(sender.url, "http://keepvid.com") && request.type == "download") {
                    if (request.error == false) {
                        var audio_download = request.download;
                        if (saved_tab.id == sender.tab.id) {
                            closeTab(saved_tab);
                            wab.confirm_action(" Are you sure you want to download '" + audio_download.name + "'(" + audio_download.size + ")?", function (confirmed) {
                                if (confirmed) {
                                    notify("Downloading '" + audio_download.name + "'(" + audio_download.size + ")");
                                    chrome.downloads.download({
                                        url: audio_download.path,
                                        filename: audio_download.name
                                    }, function (downloadId) {
                                        if (undefined) {
                                            wab.send_whatsapp_msg("Error: Could not download youtube video.");
                                            notify("Could not download youtube video.", "error");
                                        }
                                    });
                                }
                                get_youtube_url = false;
                            });
                        }
                    } else {
                        wab.send_whatsapp_msg("Error: Could not download youtube video.");
                        notify("Could not download youtube video.", "error");
                    }
                }
            }
            if (request.type == "whatsapp_message") {
                var msg = request.whatsapp_message;
                // If this is not a bot message
                if (!emoji_equal(msg, '\u{1F916}')) {
                    wab.new_message(msg);
                    var firstword = msg.split(/\s/, 1)[0].toLowerCase();
                    var otherwords = msg.substring(firstword.length);
                    if (firstword in dictionary_of_functions) {
                        dictionary_of_functions[firstword](otherwords);
                    }
                    /***********lol**************/
                    dumbChat(msg)
                }
            }
        }
    }
);

//when you click that thing in the corner
chrome.browserAction.onClicked.addListener(function (tab) {
    console.log("**CLICKED**: browserAction");
    getTab("https://web.whatsapp.com/", function (tabs) {
        if (tabs != undefined && tabs.length == 1) {
            var tab = tabs[0];
            if (tab != undefined) {
                console.log("Found whatsapp tab: " + tab.id);
                if (wab.listening == false) {
                    chrome.tabs.sendMessage(tab.id, {
                        command: "listen"
                    });
                } else if (wab.listening == true) {
                    chrome.tabs.sendMessage(tab.id, {
                        command: "stop_listen"
                    });
                }
                wab.listening = !wab.listening;
                update_whatsapp_bot_status();
            }
        } else if (tabs.length > 1) {
            notify("Only one WhatsApp tab should be open. Please close all other WhatsApp tabs but one.", "error");
        } else {
            notify("No WhatsApp tabs open.", "error");
        }
    }, true); //HERE ME ME ME
});

function inject_code(tab) {
    logf();
    if (tab != undefined && tab.url != undefined && URLBeginsWith(tab.url, "https://web.whatsapp.com/")) {
        // Make sure we don't inject code twice
        if (wab.tabs_injected.indexOf(tab.id) == -1) {
            var js_scripts = chrome.runtime.getManifest().content_scripts[0].js;
            for (var i = 0; i < js_scripts.length; i++) {
                chrome.tabs.executeScript(tab.id, {
                    file: js_scripts[i]
                });
            }
            add_injected_tab(tab.id);
        }
    }
}

/***** Content.js Injection ******/
getTab("https://web.whatsapp.com/", inject_code);
chrome.tabs.onCreated.addListener(inject_code);
chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
    /*console.log(changeInfo.status);
    if (changeInfo.status == "complete") {
        if (get_youtube_url == true) {
            if ((URLBeginsWith(changeInfo.url,"https://www.youtube.com")) {
                //Has that tab just loaded? (rather than just closed)
                //Is it a youtube tab? (sometimes the tab isn't a youtube tab - for some random reason)
                if (saved_tab.id == sender.tab.id) {
                    //Is the youtube tab that has just loaded the same as the one that you told to open?
                    closeTab(saved_tab);
                    console.log("Open Keep vid!");
                    openKeepVid(sender.url, true);
                }

        }
    }*/
    inject_code(tab)
});
