class WhatsAppModule extends Module {
    constructor() {
        super('WhatsAppModule');
        this.listening = false;
        this.was_listening = false;
        this.tabTracker = new TabTracker({'urlPatterns' : chrome.runtime.getManifest().content_scripts[0].matches});
        this.last_msg = '';
        this.confirmationStrings = {
            'confirm' : ['yes', 'yeah', 'yea', 'k', 'ok', 'okey-dokey', 'by all means', 'affirmative', 'aye aye', 'roger', 'uh-huh', 'uh huh', 'yup', 'yep', 'very well', 'righto', 'yuppers', 'right on', 'sure'],
            'cancel':  ['no', 'uh-uh', 'uh uh', 'nope', 'nay', 'nah', 'no way', 'negative']
        };
        this._confirmCheck = function () {};

        this.events = new Reactor();
        this.events.registerEvent('onMessage');
        this.events.registerEvent('onListen');
        this.events.registerEvent('onStopListen');

        this.tabTracker.events.addEventListener('onTabLoad', (tab) => {
            this.refreshListening();
        });

        this.tabTracker.events.addEventListener('onTabUnload', (tab) => {
            this.stopListening();
        });

        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            if (request.from == 'whatsAppContent') {
                if (request.type == 'whatsAppMessage') {
                    var msg = request.whatsapp_message;
                    // If this is not a bot message
                    if (!emojisEqual(msg, '\u{1F916}')) {
                        wam.newMessage(msg);
                    }
                }
            }
        });
    }

    /** Checks if the listen state has changed and sends messages to tabs accordingly */
    updateListenStatus() {
        // If there is a change
        if (this.was_listening != this.listening) {
            var tab = this.getWhatsAppTab();
            if (tab != undefined) {
                if (wam.listening == true) {
                    this.sendTabMessage({'type':'command', 'command': 'listen'});
                } else {
                    this.sendTabMessage({'type':'command', 'command': 'stopListen'});
                }
            }
            else {
                bot.notify('No WhatsApp tabs open or WhatsApp tab not loaded.', 'error');
            }
            this.was_listening = this.listening;
        }
    }

    /** Checks if there are too many WhatsApp tabs */
    refreshListening() {
        if (this.tabTracker.numTabs > 1) {
            this.listening = false;
            bot.notify('Only one WhatsApp tab should be open. Please close all other WhatsApp tabs but one.', 'error');
        }
        this.updateListenStatus();
    }

    /**
     * Attempts to change listen state to listening.
     * If too many or no WhatsApp tabs are open, sends an error as a notification.
     * Fires event onListen
     */
    startListening() {
        // this.upload();
        if (this.tabTracker.numTabs == 1) {
            if (!this.listening) {
                this.listening = true;
                this.events.dispatchEvent('onListen');
            }
            else {
                bot.notify('Already listening to WhatsApp.', 'error');
            }
        } else if (this.tabTracker.numTabs > 1) {
            this.listening = false;
            bot.notify('Only one WhatsApp tab should be open. Please close all other WhatsApp tabs but one.', 'error');
        } else {
            this.listening = false;
            if (this.listening) {
                bot.notify('No WhatsApp tabs open.', 'error');
            }
        }
        this.updateListenStatus();
    }

    /**
     * Changes listen state to not listening.
     * Fires event onStopListen
     */
    stopListening() {
        this.listening = false;
        this.events.dispatchEvent('onStopListen');
        this.updateListenStatus();
    }

    /**
     * Fired when a new WhatsApp message is received.
     * Fires onMessage event
     * @param {string} msg The new message
     */
    newMessage(msg) {
        /*var firstword = msg.split(/\s/, 1)[0].toLowerCase();
        var otherwords = msg.substring(firstword.length);
        if (firstword in dictionary_of_functions) {
            dictionary_of_functions[firstword](otherwords);
        }*/

        this.last_msg = msg;
        this._confirmCheck(this.last_msg);

        this.events.dispatchEvent('onMessage', msg);
    }

    /** Gets a single WhatsApp from the list of injected tabs */
    getWhatsAppTab() {
        if (this.tabTracker.numTabs == 1) {
            return this.tabTracker.tabs[Object.keys(this.tabTracker.tabs)[0]];
        }
        else {
            return false;
        }
    }

    /**
     * Sends a chrome message to all WhatsApp tabs
     * @param {object} data The message data
     */
    sendTabMessage(data) {
        if (this.tabTracker.numTabs == 1) {
            // Calls the default module sendTabMessage
            super.sendTabMessage(this.getWhatsAppTab().id, data);
        } else if (this.tabTracker.numTabs > 1) {
            console.log('Error: More than one WhatsApp tab found!');
            for (var key in this.tabTracker.tabs) {
                let tab = this.tabTracker.tabs[key];
                super.sendTabMessage(tab.id, data);
            }
        }
        else {
            console.log('Error: No WhatsApp tabs found!');
        }
    }

    /**
     * Sends a WhatsApp message
     * @param {string} msg The message to send
     * @param {string} to  The contact to send the message to
     */
    sendWhatsAppMessage(msg, to) {
        this.sendTabMessage({
            type: 'command',
            command: 'sendMsg',
            msg: msg,
            to: to
        });
    }

    /**
     * @callback WhatsAppModule~confirmActionCallback
     * @param {boolean} confirmed Whether the user confirmed the action
     */

    /**
     * Sends a message to the WhatsApp user asking them to confirm an action
     * @param {string}                               action   The action description
     * @param {WhatsAppModule~confirmActionCallback} callback Function called when the user responds.
     */
    confirmAction(action, callback) {
        this.sendWhatsAppMessage(action);

        // Called when new message is received
        this._confirmCheck = function (msg_original) {
            var msg = msg_original.toLowerCase();
            var confirmed = false;
            if (this.confirmationStrings.confirm.includes(msg)|| emojisEqual(msg, '\u{1F44D}')) {
                confirmed = true;
            }
            callback(confirmed);
            this._confirmCheck = function () {};
        }
    }

    upload(file) {
        this.sendTabMessage({'type' : 'command', 'command' : 'upload', 'file': file});
    }
}

var wam = new WhatsAppModule();

bot.popup.addButton({
    'title': 'WhatsApp Listen',
    'icon': 'whatsapp',
    'onClick': function () {wam.startListening()}
});
