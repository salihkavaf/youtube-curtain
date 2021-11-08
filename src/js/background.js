chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.sync.set({ enable: true });
});

const ytMainRgx = /^(http|https):\/\/(.*\.)*youtube.com\/*$/;
const ytVideoRgx = /^(http|https):\/\/(.*\.)*youtube.com\/watch\?v=(.*)$/;

let cache = {};

chrome.runtime.onMessage.addListener(request => {
    chrome.tabs.query(
        {currentWindow: true, active : true},
        async tabs => {
            const tab = tabs[0];
            if (!cache.hasOwnProperty(tab.id))
                return;

            if (!request.reloaded && cache[tab.id].lastUrl !== request.url) {
                if (!(ytMainRgx.test(request.url) || ytVideoRgx.test(request.url)) && cache[tab.id].inserted) {
                    await removeCurtain(tab.id);
                    cache[tab.id].configured = false;
                    cache[tab.id].lastUrl = request.url;
                }
            }
            else if (request.reloaded) {
                cache[tab.id].shouldDelete = true;
                cache[tab.id].inserted = false;
                cache[tab.id].configured = false;
            }
        }
    );
});

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    if (!cache.hasOwnProperty(tabId))
        cacheTab(tabId);

    if (cache[tabId].shouldDelete) {
        await removeCurtain(tabId);
        cache[tabId].shouldDelete = false;
    }

    if (changeInfo.status === "complete") {
        cache[tabId].lastUrl = tab.url;
    }

    if (cache[tabId].configured) {
        if (changeInfo.status === "complete")
            cache[tabId].configured = false;

        return;
    }
    cache[tabId].configured = true;

    chrome.storage.sync.get("enable", async ({ enable }) => {
        if (!enable) {
            if (cache[tabId].inserted)
                await removeCurtain(tabId);

            return;
        }

        if ((ytMainRgx.test(tab.url) || ytVideoRgx.test(tab.url)) && !cache[tabId].inserted)
            await initCurtain(tabId);
    });
});

function cacheTab(id) {
    cache[id] = {
        lastUrl: "",
        inserted: false,
        configured: false
    };
}

function initCurtain(tabId) {
    cache[tabId].inserted = true;

    return chrome.scripting.insertCSS({
        target: {
            tabId: tabId
        },
        files: ["/src/css/curtain.css"],
    });
}

function removeCurtain(tabId) {
    cache[tabId].inserted = false;

    return chrome.scripting.removeCSS({
        target: {
            tabId: tabId
        },
        files: ["/src/css/curtain.css"]
    });
}