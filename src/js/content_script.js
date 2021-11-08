chrome.runtime.sendMessage(chrome.runtime.id, {
    reloaded: false,
    url: window.location.href
});

window.onbeforeunload = () => {
    chrome.runtime.sendMessage(chrome.runtime.id, {
        reloaded: true,
        url: window.location.href
    });
};