chrome.action.onClicked.addListener(() => {
  chrome.tabs.create({ url: "bookmarksManager.html" });
});