var audio_row = $('td:contains("M4A")').parent('tr');
var download_size = audio_row.find('td:nth-child(3)');
var audio_download_button = audio_row.find('td:nth-child(4)').find('a[download]');

var audio_download = {
    name: audio_download_button.attr('download'),
    path: audio_download_button.attr('href'),
    size: download_size.text()
}

var error = false;
if (audio_download.name == undefined || audio_download.path==undefined) {
    error = true;
}

chrome.runtime.sendMessage({
    type: "download",
    error: error,
    download: audio_download
});
