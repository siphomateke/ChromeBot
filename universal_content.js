chrome.runtime.sendMessage({
    from: 'contentScript',
    type: 'loadEvent',
    loadState: 'load'
});

$(window).on('unload', function () {
    chrome.runtime.sendMessage({
        from: 'contentScript',
        type: 'loadEvent',
        loadState: 'unload'
    })
});

function dispatchMouseEvent(target, var_args) {
    var e = document.createEvent("MouseEvents");
    // If you need clientX, clientY, etc., you can call
    // initMouseEvent instead of initEvent
    e.initEvent.apply(e, Array.prototype.slice.call(arguments, 1));
    target.dispatchEvent(e);
};
function dispatchKeyboardEvent(target, initKeyboradEvent_args) {
    var e = document.createEvent("KeyboardEvents");
    e.initKeyboardEvent.apply(e, Array.prototype.slice.call(arguments, 1));
    target.dispatchEvent(e);
};
function dispatchTextEvent(target, initTextEvent_args) {
    var e = document.createEvent("TextEvent");
    e.initTextEvent.apply(e, Array.prototype.slice.call(arguments, 1));
    target.dispatchEvent(e);
};
function dispatchDragEvent(target, type, canBubble, cancelable) {
    var e = document.createEvent("DragEvent");
    e.initEvent.apply(e, Array.prototype.slice.call(arguments, 1));
    target.dispatchEvent(e);
};
function dispatchSimpleEvent(target, type, canBubble, cancelable) {
    var e = document.createEvent("Event");
    e.initEvent.apply(e, Array.prototype.slice.call(arguments, 1));
    target.dispatchEvent(e);
};

function simulateClick(el) {
    /*el.trigger('mouseover');
    el.trigger('mousedown');
    el.trigger('click');
    el.trigger('mouseup');*/

    dispatchMouseEvent(el[0], 'mouseover', true, true);
    dispatchMouseEvent(el[0], 'mousedown', true, true);
    dispatchMouseEvent(el[0], 'click', true, true);
    dispatchMouseEvent(el[0], 'mouseup', true, true);
}
