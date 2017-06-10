// Wrapping in a function to not leak/modify variables if the script
// was already inserted before.
(function () {
    // Check if content was loaded already
    if (window.hasRun)
        return true; // Will ultimately be passed back to executeScript
    window.hasRun = true;

    ////////////////////////                      ////////////////////////
    ////////////////////////                      ////////////////////////
    //////////////////////// VARIABLE DEFINITIONS ////////////////////////
    ////////////////////////                      ////////////////////////
    ////////////////////////                      ////////////////////////


    /* TODO: allow main contact name to be changed from backgruond_wa */
    var mainContactName = '3d113d46-605a-4e4c-b372-8';
    chrome.storage.sync.get({
        whatsappGroup: ''
    }, function (items) {
        mainContactName = items.whatsappGroup;
    });
    var prevMessage = '';
    var prevTime = '';
    var messageObserver = false;
    var whatsAppLoadedObserver = false;


    ////////////////////////                      ////////////////////////
    ////////////////////////                      ////////////////////////
    //////////////////////// FUNCTION DEFINITIONS ////////////////////////
    ////////////////////////                      ////////////////////////
    ////////////////////////                      ////////////////////////

    //When placed inside a function, this logs the name of the function to the console as 'FUNCTION: [name of function here]'
    function logf() {
        var tmp = arguments.callee.caller.toString();
        tmp = tmp.substr('function '.length);
        var functionname = tmp.substr(0, tmp.indexOf('('));
        console.log('FUNCTION: ' + functionname);
    }

    function getChatBody(contactName) {
        return $('.chatlist .infinite-list-item .chat-title [title=' + contactName + ']').closest('.chat-body');
    }

    function onWhatsAppLoaded() {
        console.log('Whatsapp Loaded');

        var observeElement = getChatBody(mainContactName);
        MutationObserver = window.MutationObserver || window.WebKitMutationObserver;

        messageObserver = new MutationObserver(function (mutations, observer) {
            mutations.forEach(function (mutation) {
                var el = $(mutation.target)
                // If this is not a '[name] is typing...' message
                var chatBody = getChatBody(mainContactName);
                if (!chatBody.find('.chat-status').hasClass('typing')) {
                    // If this is a child of .chat-status or is .chat-secondary
                    if ((el.closest('.chat-status').length != 0 || el.hasClass('chat-secondary'))) {
                        var newMessage = getMessage();
                        var newTime = getMessageTime();
                        // Check if this is a new message
                        if ((newMessage == prevMessage && newTime != prevTime) || newMessage != prevMessage) {
                            console.log('New message: ' + newMessage);

                            chrome.runtime.sendMessage({
                                from: 'whatsAppContent',
                                type: 'whatsAppMessage',
                                whatsapp_message: newMessage
                            });
                        }
                        prevMessage = newMessage;
                        prevTime = newTime;
                    }
                }
            });
        });

        // define what element should be observed by the observer
        // and what types of mutations trigger the callback
        messageObserver.observe(observeElement[0], {
            subtree: true,
            attributes: true,
            childList: true,
            characterData: true
        });
    }

    function whatsAppLoaded() {
        var appWrapperElement = $(document).find('.app-wrapper-main');
        if (appWrapperElement.length > 0) {
            if (appWrapperElement.find('.app.two').length > 0 && appWrapperElement.find('#startup').length == 0) {
                return true;
            }
        }
        return false;
    }

    function listenForChange() {
        if (!whatsAppLoaded()) {
            MutationObserver = window.MutationObserver || window.WebKitMutationObserver;

            whatsAppLoadedObserver = new MutationObserver(function (mutations, observer) {
                if (mutations.length > 0) {
                    if (whatsAppLoaded()) {
                        onWhatsAppLoaded();
                        whatsAppLoadedObserver.disconnect();
                    }
                }
            });

            // define what element should be observed by the observer
            // and what types of mutations trigger the callback
            whatsAppLoadedObserver.observe($(document)[0], {
                subtree: true,
                attributes: true,
                childList: true,
                characterData: true
            });
        } else {
            onWhatsAppLoaded();
        }
    }

    function stopListen() {
        if (messageObserver) {
            messageObserver.disconnect();
        } else if (whatsAppLoadedObserver) {
            whatsAppLoadedObserver.disconnect();
        }
        prevMessage = '';
        prevTime = '';
    }

    function getMessage() {
        var messageElement = getChatBody(mainContactName).find('.chat-status .emojitext.ellipsify');

        // Handle inner html elements within text such as emojis
        var htmlString = messageElement.html();
        var htmlRegex = new RegExp(/<.+?>/gi);
        var textArray = htmlString.split(htmlRegex);
        var htmlArray = htmlString.match(htmlRegex);
        var fullMessage = '';
        for (var i = 0; i < textArray.length; i++) {
            fullMessage += textArray[i];

            if (i in htmlArray) {
                var htmlElement = $(htmlArray[i]);
                if (htmlElement.is('img') && htmlElement.hasClass('emoji')) {
                    fullMessage += htmlElement.attr('alt')
                }
            } //here WACHOUTmes
        }
        return fullMessage;
    }

    function getMessageTime() {
        var chatBody = getChatBody(mainContactName);
        return chatBody.find('.chat-time').text();
    }

    function openChat(contactName, callback) {
        var chat = getChatBody(contactName).closest('.chat');
        if (!chat.hasClass('active')) {
            console.log('Chat is not active');
            simulateClick(chat);
            setTimeout(callback, 200);
        }
        else {
            console.log('Chat is active');
            callback();
        }
    }

    function sendWhatsAppMessage(contactName, msg) {
        function run() {
            console.log('Sending whatsapp message: ' +msg+ ' to: '+contactName);
            var composeBlock = $('.block-compose');
            simulateClick(composeBlock.find('.compose-btn-emoji'));

            composeBlock.find('.input[contenteditable="true"]').text(msg);

            // \u{1F916}
            simulateClick($('span.e1979.c0.emojik[tabindex="-1"][data-emoji-index="85"]'));

            simulateClick(composeBlock.find('.compose-btn-emoji'));
            simulateClick(composeBlock.find('.compose-btn-send'));
        }
        if (whatsAppLoaded()) {
            console.log('Send message is whatsapp loaded');
            openChat(contactName, run);
        }
    }

    function upload(contactName, file) {
        openChat(contactName, () => {
            /*simulateClick($('.icon.icon-clip[title="Attach"]'));
            simulateClick($('.icon-xl.icon-document').closest('button'));
            simulateClick($('.icon-xl.icon-document').closest('.menu-item.menu-shortcut').find('input[type="file"]'));*/
        });
    }

    //           //
    // UNGROUPED //
    //           //

    ////////////////////////                     ////////////////////////
    ////////////////////////                     ////////////////////////
    //////////////////////// FUNCTION EXECUTIONS ////////////////////////
    ////////////////////////                     ////////////////////////
    ////////////////////////                     ////////////////////////

    chrome.runtime.onMessage.addListener(
        function (request, sender, sendResponse) {
            console.log(request);
            if (request.from == 'WhatsAppModule') {
                if (request.type == 'command') {
                    if (request.command == 'listen') {
                        listenForChange();
                    } else if (request.command == 'stopListen') {
                        stopListen();
                    } else if (request.command == 'sendMsg') {
                        var contactName = mainContactName;
                        if ('to' in request) {
                            contactName = request.to;
                        }
                        sendWhatsAppMessage(contactName, request.msg);
                    }
                    else if (request.command == 'upload') {
                        var contactName = mainContactName;
                        if ('to' in request) {
                            contactName = request.to;
                        }
                        upload(contactName, request.file);
                    }
                }
            }
        }
    );
})();
