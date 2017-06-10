/** Class to store event callbacks*/
class Event {
    constructor(name) {
        this.name = name;
        this.callbacks = [];
    }

    /**
     * Adds a new callback
     * @param {function} callback The callback to add
     */
    registerCallback(callback) {
        this.callbacks.push(callback);
    }
}

/** Class to event registering, dispatching and eventListeners */
class Reactor {
    constructor() {
        this.events = {};
    }

    /**
     * Adds a new event
     * @param {string} eventName The new event to add
     */
    registerEvent(eventName) {
        this.events[eventName] = new Event(eventName);
    }

    /**
     * Triggers and event's callbacks
     * @param {string} eventName The event to trigger
     * @param {Object} eventArgs Arguments to be passed to the event callbacks
     */
    dispatchEvent(eventName, eventArgs) {
        for (var i = 0; i < this.events[eventName].callbacks.length; i++) {
            var callback = this.events[eventName].callbacks[i];
            callback(eventArgs);
        }
    }

    /**
     * Adds a new event callback to an event
     * @param {string}   eventName The event to add a callback to
     * @param {function} callback  The callback
     */
    addEventListener(eventName, callback) {
        this.events[eventName].registerCallback(callback);
    }
}

/** Provides useful tab functions */
class TabTools {
    /**
     * Opens a new tab
     * @param {string} url The url of the tab to open
     * @param {function} callback Function to be called when the tab is opened
     * @param {boolean} active Whether the new tab should be switched to and made the active tab
     */
    static new(url, callback, active) {
        chrome.tabs.create({
            active: active,
            url: url
        }, callback);
    }
    /**
     * Closes a tab
     * @param {object} tab The tab to close
     */
    static close(tab) {
        chrome.tabs.remove(tab.id);
    }

    /**
     * Executes callback function on the active tab in current window
     * @param {function} callback Function to call when the tab is found.
     *                            The tab is passed as an argument to this callback
     */
    static onActive(callback) {
        chrome.tabs.query({
            active: true,
            currentWindow: true
        }, (tabs) => {
            var activetab = tabs[0];
            callback(activetab);
        });
    }
    /**
     * Searches for a tab with the given url
     * @param {string} url
     * @param {function} callback
     * @param {boolean} [multiple=false]
     */
    static getByUrl(url, callback, multiple=false) {
        chrome.tabs.query({
                url: url
            },
            (tabs) => {
                if (multiple) {
                    callback(tabs);
                } else {
                    callback(tabs[0]);
                }
            }
        );
    }

    /**
     * Checks if a tabs url matches a given url pattern
     * @param {object}   tab         The tab to check
     * @param {string}   urlPattern  The url pattern
     * @param {function} callback    Function to be called when the query is complete.
     *                               Whether the tab matches or not is passed to this callback
     */
    static tabMatchesUrl(tab, urlPattern, callback) {
        TabTools.getByUrl(urlPattern, (query_tabs) => {
            var foundMatch = false;
            for (var i = 0; i < query_tabs.length; i++) {
                if (tab.id == query_tabs[i].id) {
                    callback(true);
                    foundMatch = true;
                    break;
                }
            }
            if (!foundMatch) {
                callback(false);
            }
        }, true);
    }
}

/** Used to track tabs specified in the manifest. Sends events like onTabLoad and onTabUnload */
class TabTracker {
    /**
     * @param {string[]} options.urlPatterns The url patterns of the tabs to be tracked
     * @param {number[]} options.tabIds      The IDs of the tabs to be tracked
     */
    constructor(options) {
        this.tabs = {};

        this.urlPatterns = [];
        this.tabIds = [];

        if (typeof options.urlPatterns !== 'undefined') this.urlPatterns = options.urlPatterns;
        if (typeof options.tabIds !== 'undefined') this.tabIds = options.tabIds;

        // Event handler
        this.events = new Reactor();

        this.events.registerEvent('onTabLoad');
        this.events.registerEvent('onTabUnload');

        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            // Check if this is one of the tabs we should be tracking
            this._queryTrackTab(sender.tab, (isTrackTab) => {
                if (isTrackTab) {
                    if (request.from == 'contentScript' && request.type == 'loadEvent') {
                        if (request.loadState == 'load') {
                            this.addTab(sender.tab);
                        }
                        else if (request.loadState == 'unload') {
                            this.removeTab(sender.tab);
                        }
                    }
                }
            })
        });
    }

    /**
     * Used by _queryTrackTab to iteratively check if a tab matches the list of contentScript urls
     * @private
     */
    _queryTrackTabLoop(tab, index, isTrackTab, callback) {
        if (index < this.urlPatterns.length) {
            var url = this.urlPatterns[index];
            TabTools.tabMatchesUrl(tab, url, (matches) => {
                if (matches) {
                    callback(true);
                }
                else {
                    this._queryTrackTabLoop(tab, index+1, matches, callback);
                }
            });
        }
        else {
            callback(isTrackTab);
        }
    }

    /**
     * Checks if a tab is one that we wish to track
     * @private
     * @param {object}   tab      The tab to query
     * @param {function} callback Function called when query is complete.
     *                            Whether this is a tab we wish to track is passed to this callback as an argument
     */
    _queryTrackTab(tab, callback) {
        if (typeof tab !== 'undefined' && typeof tab.url !== 'undefined' && this.urlPatterns.length > 0) {
            this._queryTrackTabLoop(tab, 0, false, callback);
        }
        else if (typeof tab !== 'undefined' && typeof tab.id !== 'undefined' && this.tabIds.length > 0) {
            for (let id of this.tabIds) {
                if (tab.id == id) {
                    callback(true);
                    break;
                }
            }
            callback(false);
        }
        else {
            callback(false);
        }
    }

    /** Returns the number of tracks being tracked */
    get numTabs() {
        return Object.keys(this.tabs).length;
    }

    /**
     * Adds a new tab to track and fires the onTabLoad event
     * @param {object} tab The tab to track
     */
    addTab(tab) {
        this.tabs[tab.id] = tab;
        this.events.dispatchEvent('onTabLoad', this.tabs[tab.id]);
    }

    /**
     * Removes a tab being tracked and fires the onTabUnloadEvent
     * @param {object} tab The tab to remove
     */
    removeTab(tab) {
        delete this.tabs[tab.id];
        this.events.dispatchEvent('onTabUnload', tab.id);
    }
}

class Popup {
    constructor() {
        this.lastButtonId = 0;
        this.buttons = {};

        this.menus = {};

        this.defaultMenu = 'main';
        this.addMenu({'name' : this.defaultMenu});
    }

    /**
     * Adds a new popup menu
     * @param {object} options         The popup menu's options
     * @param {string} options.title   The name of the menu
     * @param {string} [options.parent] The menu's parent
     */
    addMenu(options) {
        if (options.name != this.defaultMenu) {
            if (typeof options.parent === 'undefined') options.parent = this.defaultMenu;
        }
        this.menus[options.name] = options;
        // Add a back button to go to parent menu
        if (this.menus[options.name].name != this.defaultMenu) {
            this.addButton({
                'menu': this.menus[options.name].name,
                'title': 'Back',
                'type': 'back',
                'onClick': '#'+this.menus[options.name].parent
            });
        }
    }

    /**
     * Returns the menu with the specified name
     * @param   {string} name The menu's name
     * @returns {object} The menu
     */
    getMenu(name) {
        return this.menus[name];
    }

    /**
     * Adds a new popup button to the extensions popup
     * @param {object}   options         The popup's options.
     * @param {string}   options.icon    A font-awesome icon string.
     *                                   For example, 'whatsapp', 'cog'.
     *                                   See the [font awesome cheatsheet](fontawesome.io/cheatsheet/) for a full list
     * @param {string}   options.title    The text to show on the popup
     * @param {string}   options.iconColor   The color of the popup's icon
     * @param {function} options.onClick The function to call when the popup is clicked
     */
    addButton(options) {
        var button = options;
        if (typeof button.clickType === 'undefined') {
            // button.clickType = typeof button.onClick;
            if (typeof button.onClick !== 'undefined') {
                if (typeof button.onClick === 'string') {
                    button.clickType = 'navigation';
                }
                else if (typeof button.onClick === 'function') {
                    button.clickType = 'function';
                }
            }
            else {
                button.clickType = 'undefined';
            }
        }
        if (typeof button.onClick === 'undefined') button.onClick = () => {};
        // If no menu is specified add it to the default menu
        if (typeof button.menu === 'undefined') button.menu = this.defaultMenu;
        // If the menu specified in button doesn't exist, add it
        if (!(button.menu in this.menus)) {
            this.addMenu({'name' : button.menu});
        }
        button.id = this.lastButtonId;
        this.buttons[this.lastButtonId] = button;
        this.lastButtonId += 1;
    }

    /**
     * Initializes the popup adding all the buttons. Should only be called after all buttons are added
     */
    init() {
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            if (request.from == 'popup') {
                if (request.type == 'requestData') {
                    sendResponse({
                        from: 'chromebot',
                        type: 'popupData',
                        data: {
                            'menus' : this.menus,
                            'buttons' : this.buttons,
                            'defaultMenu' : this.defaultMenu
                        }
                    });
                }
                // Called when a button is pressed by the user
                else if (request.type == 'buttonOnClick' && request.buttonId != undefined) {
                    if (request.buttonId in this.buttons) {
                        this.buttons[request.buttonId].onClick();
                    }
                }
            }
        })
    }
}

/** Core extensions class. Handles popups, notifications and saving tabs */
class ChromeBot {
    constructor() {
        this.popup = new Popup();

        this.popup.addButton({'title': 'Options','icon': 'cog', 'onClick': chrome.runtime.openOptionsPage});
        this.popup.addButton({'title': 'Android settings','icon': 'android', 'onClick': '#android'});
            this.popup.addButton({'menu': 'android','title': 'Hello','icon': 'save'});
            this.popup.addButton({'menu': 'android','title': 'Turn of Wifi','icon': 'wifi','iconColor':'#04a235'});
            this.popup.addButton({'menu': 'android','title': 'Kill the lights','icon': 'desktop','iconColor':'#a20404', 'onClick': '#lights'});

            this.popup.addMenu({'name': 'lights', 'parent':'android'});
                this.popup.addButton({'menu': 'lights','title': 'Happy days','icon': 'cube'});

        this.savedTabs = {};

        /**
         * The core extension actions
         */
        this.coreActions = {};
    }

    /**
     * Sends a basic notification
     * @private
     * @param {object} data The notification data
     */
    _notify(data) {
        data.type = 'basic';
        data.iconUrl = chrome.runtime.getManifest().icons['128'];
        data.title = 'Chrome Bot';
        data.isClickable = false;
        chrome.notifications.create('', data);
    }

    /**
     * Creates a chrome notification
     * @param {string} msg  The notification message
     * @param {('error'|'normal')} [type=normal] The type of notification. Valid types are: error
     */
    notify(msg, type='normal') {
        if (type == 'error') {
            this._notify({'message': 'Error: ' + msg});
        } else {
            this._notify({'message': msg});
        }
    }

    /**
     * Stores a tab for future reference
     * @param {string} name  The name to give the saved tab
     * @param {number} tabId The ID of the tab to save
     */
    saveTab(name, tabId) {
        this.savedTabs[name] = tabId;
    }

    /**
     * Gets a previously saved tab
     * @param   {string} name The name of the tab to get
     * @returns {number} The ID of the saved tab
     */
    getSavedTab(name) {
        return this.savedTabs[name];
    }

    /**
     * Adds a core action
     * @param {string}   name   The name of the core action
     * @param {function} action The core action
     */
    /*addCoreAction(name, action) {
        this.coreActions[name] = action;
    }*/

    /**
     * Removes a core action
     * @param {string} name The name of the core action
     */
    /*removeCoreAction(name) {
        delete this.coreActions[name];
    }*/

    /**
     *  Runs a core action
     * @param {string} name    The name of the core action
     * @param {Array}  ...args The core action arguments
     */
    /*run(name, ...args) {
        this.coreActions[name](...args);
    }*/

    /**
     * An alias for ChromeBot.coreActions
     */
    get ca() {
        return this.coreActions;
    }
}

let bot = new ChromeBot();

/**
 * Base class for modules
 * A module is a class that handles a specific task. For example, sending and receiving WhatsApp messages
 */
class Module {
    constructor(name) {
        this.name = name;
    }

    /**
     * Sends a message to a tab and attaches which module it was from
     * @param {number} tabId The ID of the tab to send a message to
     * @param {object} data  The message data
     */
    sendTabMessage(tabId, data) {
        data.from = this.name;
        console.log("Sent message to tabId : "+tabId);
        console.log(data);
        chrome.tabs.sendMessage(tabId, data);
    }
}

/**
 * Checks if two emojis are equal using codePoints
 * @return {Boolean}
 */
function emojisEqual(emoji1, emoji2) {
    return emoji1.codePointAt(0) == emoji2.codePointAt(0)
}
