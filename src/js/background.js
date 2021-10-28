chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.sync.set({ enable: true });
});

const ytMainRgx = /^(http|https):\/\/(.*\.)*youtube.com\/*$/;
const ytVideoRgx = /^(http|https):\/\/(.*\.)*youtube.com\/watch\?v=(.*)$/;

let lastUrl;
let inserted = false;
let loading = false;
let full = false;

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    console.log(changeInfo.status, tab.url);

    // if (lastUrl === tab.url)
    //     return;

    if (changeInfo.status === "complete")
        lastUrl = tab.url;

    if (loading) return;
    loading = true;

    chrome.storage.sync.get("enable", async ({ enable }) => {
        if (!enable) {
            if (inserted)
                await removeCurtain(tabId);
            return;
        }

        if (inserted && changeInfo.status === "loading")
            await removeCurtain(tabId);

        if (ytMainRgx.test(tab.url))
            full = true;

        else if (!ytVideoRgx.test(tab.url)) {
            loading = false;
            return;
        }
        else full = false;

        if (!inserted && changeInfo.status === "loading")
            await initCurtain(tabId);

        loading = false;
    });
});

const cssCode = () => {
    const id = full ? "#primary" : "#secondary";

    return `
        ${id} {
            position: relative;
        }

        ${id}::after {
            content: "";
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: #fff;
            z-index: 500;
        }

        @media (prefers-color-scheme: dark) {
            ${id}::after {
                background: #282828;
            }
        }
        `;
}

function initCurtain(tabId) {
    console.log(cssCode());

    inserted = true;

    return chrome.scripting.insertCSS({
        target: {
            tabId: tabId
        },
        css: cssCode(),
    });
}

function removeCurtain(tabId) {
    inserted = false;

    console.log(cssCode());

    return chrome.scripting.removeCSS({
        target: {
            tabId: tabId
        },
        css: cssCode()
    });
}