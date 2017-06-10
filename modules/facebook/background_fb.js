bot.popup.addButton({
    'title': 'Facebook',
    'icon': 'facebook-square',
    'iconColor': '#3b5998',
    'onClick': function () {
        console.log(fbme)
    }
});

class facebookUser {
    constructor(name, username, userid) {
        this.name = name;
        this.username = username;
        this.userid = userid;
    }
}

function getUseridOrUsername(url) {
    var userid = ''
    var username = ''
    if (url.split(/\/|\?/)[3] == 'profile.php') {
        userid = url.split(/\=|\&/)[1]
    } else {
        username = url.split(/\/|\?/)[3]
    }
    return {
        'userid': userid,
        'username': username
    }
}


chrome.contextMenus.create({
    title: 'fb context menu',
    contexts: ['link'],
    onclick: function (info, tab) {
        console.log(getUseridOrUsername(info.linkUrl))
        console.log('')
        console.log(info.linkUrl)

    },
    documentUrlPatterns: [
        "https://web.facebook.com/*",
        "https://free.facebook.com/*"
    ],
    targetUrlPatterns: [
        "https://web.facebook.com/*",
        "https://free.facebook.com/*"
    ]
});
