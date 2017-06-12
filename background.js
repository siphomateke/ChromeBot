/** This is easier than typing that chrome.whatever to open a new tab */
bot.ca.newTab = function (url, active, callback) {
    chrome.tabs.create({
        active: active,
        url: url
    }, function (tab) {
        if (typeof callback !== 'undefined') {
            callback(tab);
        }
    });
}

/**
 * Closes the specified tab
 * @param {object} tab The tab to close
 */
bot.ca.closeTab = function closeTab(tab) {
    chrome.tabs.remove(tab.id);
}

/**
 * Gets the active tab
 * @param {function} callback The function to call when the active tab is found
 */
bot.ca.onActiveTab = function (callback) {
    chrome.tabs.query({
        active: true,
        currentWindow: true
    }, function (tabs) {
        var activetab = tabs[0];
        callback(activetab);
    });
}

/**
 * Closes the active tab
 */
bot.ca.closeActiveTab = () => {bot.ca.onActiveTab(bot.ca.closeTab)};

/**
 * Peforms a google search
 * @param {string}   query    The search query
 * @param {object}  options    Search options
 * @param {boolean}  [options.lucky=false]    Whether to use 'I'm feeling lucky' when searching
 * @param {boolean}  [options.active]   Whether chrome should switch to the google result when it is opened
 * @param {function} callback The function called when the new google search tab is opened
 */
bot.ca.google = function (query, options = {}, callback) {
    if (typeof options.lucky === 'undefined') options.lucky = false;
    if (!options.lucky) {
        bot.ca.newTab("https://www.google.co.zm/search?q=" + query, options.active, callback);
    } else {
        bot.ca.newTab("https://www.google.co.zm/search?btnI=I&q=" + query, options.active, callback);
    }
};

bot.ca.wikipedia = function (query, options={}, callback) {
    options.lucky = true;
    bot.ca.google("site%3Aen.wikipedia.org+" + query, options, callback);
}

bot.ca.youtube = function (query, options={}, callback) {
    options.lucky = true;
    bot.ca.google("site%3Awww.youtube.com+" + query, options, callback);
}

bot.ca.keepvid = function (youtubeUrl, active=false, callback) {
    bot.ca.newTab("http://keepvid.com/?url=" + youtubeUrl, active, callback)
}

bot.ca.getYoutubeDownloadLink = function (query, options={'type': 'audio'}, callback=()=>{}) {
    bot.ca.youtube(query, {'active':false}, (tab) => {
        var tabTracker = new TabTracker({'tabIds': [tab.id]});
        tabTracker.events.addEventListener('onTabLoad', (tab) => {
            bot.ca.closeTab(tab);
            bot.ca.keepvid(tab.url, false, (keepvidTab) => {
                kv.requestDownload(keepvidTab.id, options, (response) => {
                    bot.ca.closeTab(keepvidTab);
                    callback(response);
                });
            });
        });
    });
}

bot.ca.downloadYoutube = function(query, options={}) {
    bot.ca.getYoutubeDownloadLink(query, {'type': 'audio'},(response) => {
        if (response.error == false) {
            var download = response.data;
            wam.confirmAction(" Are you sure you want to download '" + download.name + "'(" + download.size + ")?", (confirmed) => {
                if (confirmed) {
                    bot.notify("Downloading '" + download.name + "'(" + download.size + ")");
                    chrome.downloads.download({
                        url: download.path,
                        filename: download.name
                    }, function (downloadId) {
                        if (typeof downloadId === 'undefined') {
                            wam.send_whatsapp_msg("Error: Could not download youtube video.");
                            bot.notify("Could not download youtube video.", "error");
                        }
                    });
                }
            });
        } else {
            wam.send_whatsapp_msg("Error: Could not download youtube video.");
            bot.notify("Could not download youtube video.", "error");
        }
    })
}

// "Is that a girl or a little boy?" ~ Temba asking about Rihanna

let whatsappActions = {
    'google': bot.ca.google,
    '\u{274C}': bot.ca.closeActiveTab,
    'youtube': bot.ca.youtube,
    '\u{1F4D6}': bot.ca.wikipedia,
    'keepvid': bot.ca.keepvid,
    // TODO: Implement youtube video downloading
    //'\u{2B07}': getYouTubeURL,
    '\u{2B07}': bot.ca.downloadYoutube
};

wam.events.addEventListener('onMessage', (msg) => {
    console.log("New message: "+msg);
    var firstword = msg.split(/\s/, 1)[0].toLowerCase();
    var otherwords = msg.substring(firstword.length);
    if (firstword in whatsappActions) {
        whatsappActions[firstword](otherwords);
    }
});

bot.popup.init();

/*function toYodaSpeak(sentence) {
    $.ajax({
        url: 'https://yoda.p.mashape.com/yoda',
        method: 'GET',
        headers: {'X-Mashape-Key': 'rQXZXZFK6Emshnbw6BDqVR6kkcUKp1gJA9ljsn67K31a8X1Q4Y'},
        data: {'sentence': sentence},
        success: (response) => {
            console.log(response);
        }
    })
}

function parseSentence(sentence) {
    $.ajax({
        url: 'https://getpost-full-natural-language-parser-v1.p.mashape.com/parser',
        method: 'POST',
        headers: {'X-Mashape-Key': 'rQXZXZFK6Emshnbw6BDqVR6kkcUKp1gJA9ljsn67K31a8X1Q4Y'},
        contentType: 'application/json; charset=utf-8',
        data: JSON.stringify({'sentence' : sentence}),
        dataType: 'json',
        success: (response) => {
            console.log(response);
        }
    })
}

function duckDuckGo() {
    $.ajax({
        url: 'https://duckduckgo-duckduckgo-zero-click-info.p.mashape.com/',
        method: 'GET',
        headers: {'X-Mashape-Key': 'rQXZXZFK6Emshnbw6BDqVR6kkcUKp1gJA9ljsn67K31a8X1Q4Y'},
        data: {'q': 'Google', 'format': 'json', 'no_html': 1, 'no_redirect': 1, 'skip_disambig': 1},
        dataType: 'json',
        success: (response) => {
            console.log(response);
            console.log(response.AbstractText);
            parseSentence(response.AbstractText);
            toYodaSpeak(response.AbstractText);
        }
    })
}*/
