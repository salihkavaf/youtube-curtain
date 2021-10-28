chrome.storage.sync.get("enable", ({ enable }) => {
    cbx.checked = enable;
});

cbx.addEventListener("click", () => {
    chrome.storage.sync.set({ "enable": cbx.checked });
    window.location.reload();
});