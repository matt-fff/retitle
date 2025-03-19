// Background script for Tab Retitle extension

// Default settings
let settings = {
  prefix: '',
  suffix: ''
};

// Track tabs where content script is ready
let readyTabs = new Set();

// Interval for periodic title check
let periodicCheckInterval = null;

// Load settings from storage when extension starts
chrome.storage.sync.get(['prefix', 'suffix'], (result) => {
  if (result.prefix !== undefined) settings.prefix = result.prefix;
  if (result.suffix !== undefined) settings.suffix = result.suffix;
  
  // Start periodic check if we have settings
  if (settings.prefix || settings.suffix) {
    startPeriodicCheck();
  }
});

// Listen for changes to storage
chrome.storage.onChanged.addListener((changes) => {
  if (changes.prefix) {
    settings.prefix = changes.prefix.newValue;
  }
  if (changes.suffix) {
    settings.suffix = changes.suffix.newValue;
  }
  
  // Apply changes to all tabs when settings change
  applyToAllTabs();
  
  // Start or stop periodic check based on settings
  if (settings.prefix || settings.suffix) {
    startPeriodicCheck();
  } else {
    stopPeriodicCheck();
  }
});

// Function to send update message to a content script
function updateTabTitle(tabId) {
  // Only send message if we know the content script is ready
  if (readyTabs.has(tabId)) {
    chrome.tabs.sendMessage(tabId, {
      action: 'updateTitle',
      prefix: settings.prefix,
      suffix: settings.suffix
    }).catch(error => {
      console.log(`Error sending message to tab ${tabId}: ${error}`);
      // If we get an error, the content script might not be there anymore
      readyTabs.delete(tabId);
    });
  }
}

// Inject content script into tab if needed
function injectContentScriptIfNeeded(tabId, url) {
  // Skip restricted URLs
  if (!url || url.startsWith('chrome://') || 
      url.startsWith('chrome-extension://') || 
      url.startsWith('vivaldi://') || 
      url.startsWith('edge://') || 
      url.startsWith('brave://')) {
    return;
  }
  
  // Check if content script is already injected
  chrome.tabs.sendMessage(tabId, { action: 'ping' })
    .then(response => {
      // Content script is already there
      if (response && response.pong) {
        readyTabs.add(tabId);
        updateTabTitle(tabId);
      }
    })
    .catch(() => {
      // Content script is not injected yet, try to inject it
      chrome.scripting.executeScript({
        target: { tabId: tabId },
        files: ['content.js']
      }).then(() => {
        // Wait a bit for the content script to initialize
        setTimeout(() => {
          updateTabTitle(tabId);
        }, 200);
      }).catch(error => {
        console.log(`Error injecting content script: ${error}`);
      });
    });
}

// Listen for tab updates
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // Only proceed if the tab has completed loading
  if (changeInfo.status === 'complete' && tab.url) {
    injectContentScriptIfNeeded(tabId, tab.url);
  }
});

// Listen for tab removal to clean up our tracking
chrome.tabs.onRemoved.addListener((tabId) => {
  readyTabs.delete(tabId);
});

// Function to apply title modifications to all tabs
function applyToAllTabs() {
  chrome.tabs.query({}, (tabs) => {
    for (const tab of tabs) {
      if (tab.url) {
        injectContentScriptIfNeeded(tab.id, tab.url);
      }
    }
  });
}

// Function to start periodic check of all tabs
function startPeriodicCheck() {
  // Clear any existing interval
  stopPeriodicCheck();
  
  // Check all tabs every 30 seconds
  periodicCheckInterval = setInterval(() => {
    // Only do this if we have settings to apply
    if (settings.prefix || settings.suffix) {
      console.log('Performing periodic title check on all tabs');
      applyToAllTabs();
    }
  }, 30000); // Check every 30 seconds
}

// Function to stop periodic check
function stopPeriodicCheck() {
  if (periodicCheckInterval) {
    clearInterval(periodicCheckInterval);
    periodicCheckInterval = null;
  }
}

// Listen for messages from popup and content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'applyNow') {
    applyToAllTabs();
    sendResponse({ success: true });
  } else if (message.action === 'contentScriptReady') {
    // Content script is ready, track this tab
    if (sender.tab && sender.tab.id) {
      readyTabs.add(sender.tab.id);
      sendResponse({ settings: settings });
    }
  } else if (message.action === 'ping') {
    // Simple ping to check if content script is there
    sendResponse({ pong: true });
  }
  return true; // Keep the message channel open for the async response
});
