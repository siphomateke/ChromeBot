function getDownload(row) {
    var download_size = row.find('td:nth-child(3)');
    var download_button = row.find('td:nth-child(4)').find('a[download]');

    download = {
        name: download_button.attr('download'),
        path: download_button.attr('href'),
        size: download_size.text()
    }
    return download;
}

function download(options, sendResponse) {
    var download;
    if (options.type == 'audio') {
        var row = $('td:contains("'+options.quality+'")').parent('tr');
        download = getDownload(row);
    }
    else if (options.type == 'video') {
        // TODO: Add checks to make sure item is video
        var row = $('td:contains("'+options.quality+'")').parent('tr');
        download = getDownload(row);
    }

    var error = false;
    if (download.name == undefined || download.path==undefined) {
        error = true;
    }

    console.log(download);

    sendResponse({
        from: 'keepVidContent',
        type: 'downloadData',
        data: download,
        error: error
    });
}

chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {
        console.log(request);
        if (request.from == 'KeepVidModule') {
            if (request.type == 'command' && request.command == 'download') {
                download(request.options, sendResponse);
            }
        }
    }
)
