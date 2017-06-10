function onload() {
    function updateListeners() {
        $('.menu-item a').on('click', (ev) => {
            var link = $(ev.target).closest('a');
            if (link.hasClass('btn') && link.parent('.menu-item').length > 0) {
                var hash = link.attr('href');
                console.log(hash);
                if (typeof hash !== 'undefined' && hash.length > 0) {
                    var subMenu = $(hash);
                    if (subMenu.length == 1) {
                        $('.menu').removeClass('active');
                        subMenu.addClass('active');
                    }
                }
            }
        });
    }

    function generateHtmlButton(button) {
        var html = '<li class="menu-item';
        if (button.type == 'back') {
            html += ' back';
        }
        html += '"><a ';
        if (button.clickType == 'navigation') {
            html += 'href="'+button.onClick+'"';
        }
        else {
            html += 'href="#0"';
        }
        html += ' class="btn">';
        if (button.type != 'back') {
            if ('icon' in button) {
                html += '<i class="icon fa fa-'+button.icon+' fa-fw" aria-hidden="true" ';
                if ('iconColor' in button) {
                    html += 'style="color:'+button.iconColor+'"';
                }
                html += '></i>';
            }
        }
        else {
            html += '<i class="icon back fa fa-caret-left fa-fw" aria-hidden="true"></i>';
        }
        html += '<span class="text">'+button.title+'</span>';
        if (button.type != 'back' && button.clickType == 'navigation') {
            html += '<i class="icon more fa fa-caret-right fa-fw" aria-hidden="true"></i>';
        }
        html += '</a></li>';
        return $(html);
    }

    function addButton(parent, button) {
        let htmlButton = generateHtmlButton(button);

        // Add to menu
        parent.append(htmlButton);

        // Bind callback
        if (button.clickType == 'function') {
            htmlButton.on('click', (ev) => {
                console.log('clicked'+ button.id);
                chrome.runtime.sendMessage({
                    from: 'popup',
                    type: 'buttonOnClick',
                    buttonId: button.id
                });
            });
        }
    }

    function generatePage(data) {
        for (let i in data.menus) {
            let menu = data.menus[i];
            let menuElement = $('<ul id="'+menu.name+'" class="menu"></ul>');
            $('body').append(menuElement);
            if (menu.name == data.defaultMenu) {
                menuElement.addClass('active');
            }
            for (let j in data.buttons) {
                let button = data.buttons[j];
                if (button.menu == menu.name) {
                    addButton(menuElement, button);
                }
            }
        }
        updateListeners();
        $('#loader').hide();
    }

    chrome.runtime.sendMessage({
        from: 'popup',
        type: 'requestData'
    }, function (response) {
        if (response.from == 'chromebot' && response.type == 'popupData') {
            if (typeof response.data !== 'undefined') {
                if (typeof response.data.menus !== 'undefined' && typeof response.data.buttons !== 'undefined') {
                    generatePage(response.data);
                }
            }
        }
    });
}

$(document).ready(onload);
