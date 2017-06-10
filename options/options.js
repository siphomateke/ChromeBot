// Saves options to chrome.storage.sync.
function save_options() {
    var whatsappGroup = document.getElementById('whatsappGroup').value;
    chrome.storage.sync.set({
        whatsappGroup: whatsappGroup
    }, function () {
        // Update status to let user know options were saved.
        if (typeof chrome.runtime.lastError !== 'undefined') {
            var status = document.getElementById('status');
            status.textContent = chrome.runtime.lastError.message;
        } else {
            window.close();
        }
    });
}

// Restores select box and checkbox state using the preferences
// stored in chrome.storage.
function restore_options() {
    chrome.storage.sync.get({
        whatsappGroup: ''
    }, function (items) {
        document.getElementById('whatsappGroup').value = items.whatsappGroup;
    });
}
document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('save').addEventListener('click', save_options);
