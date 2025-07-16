chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "formatJson",
    title: "View Formatted JSON",
    contexts: ["selection"],
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "formatJson") {
    chrome.tabs.sendMessage(tab.id, {
      action: "formatJson",
      selectedText: info.selectionText,
    });
  }
});
