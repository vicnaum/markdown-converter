// Background service worker for handling downloads and storage
chrome.runtime.onInstalled.addListener(() => {
  console.log('Web Crawler extension installed');
});

// Handle download requests
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'downloadMarkdown') {
    chrome.downloads.download({
      url: request.url,
      filename: request.filename,
      saveAs: true
    });
  }
});