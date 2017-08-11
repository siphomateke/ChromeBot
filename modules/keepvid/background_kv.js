// TODO: Document KeepVidModule
class KeepVidModule extends Module{
    constructor() {
        super('KeepVidModule');
        this.tabTracker = new TabTracker({'urlPatterns' : chrome.runtime.getManifest().content_scripts[2].matches});
        this.downloadRequests = {};

        this.tabTracker.events.addEventListener('onTabLoad', (tab) => {
            console.log('KeepVid tab loaded');
            if (tab.id in this.downloadRequests) {
                console.log('Sending download request: ');
                console.log(this.downloadRequests[tab.id]);
                this.download(tab.id, this.downloadRequests[tab.id]);
            }
        });
    }

    download(tabId, downloadRequest) {
        var options = downloadRequest.options;
        if (typeof options.type === 'undefined') options.type = 'video';
        if (typeof options.quality === 'undefined') {
            if (options.type == 'video') {
                options.quality = '144p';
            }
            else if (options.type == 'audio') {
                options.quality = '128 kbps';
            }
        }
        this.sendTabMessage(tabId, {
            'type' : 'command',
            'command' : 'download',
            'options' : options
        }, (response) => {
            if (typeof downloadRequest.callback !== 'undefined') {
                downloadRequest.callback({'data': response.data, 'error': response.error});
            }
        });
    }

    requestDownload(tabId, options, callback) {
        this.downloadRequests[tabId] = {'options': options, 'callback': callback};
    }
}

var kv = new KeepVidModule();
