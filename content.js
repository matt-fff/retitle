// Content script for Tab Retitle extension

// This script runs in the context of web pages
// It will receive messages from the background script to modify the page title

// Global variables to store state
let state = {
  prefix: '',
  suffix: '',
  originalTitle: null,  // Will be set on first run
  actualOriginalTitle: null, // The true original title without any modifications
  observer: null,
  titleCheckInterval: null
};

// Function to capture the original title (only called once)
function captureOriginalTitle() {
  if (state.actualOriginalTitle === null) {
    state.actualOriginalTitle = document.title;
    state.originalTitle = document.title;
    console.log('Captured original title:', state.actualOriginalTitle);
  }
}

// Function to get the clean title without any prefix/suffix
function getCleanTitle() {
  // Always start with the actual original title
  return state.actualOriginalTitle || document.title;
}

// Function to apply prefix and suffix to the title
function updateTitle() {
  // Make sure we have captured the original title
  captureOriginalTitle();
  
  // Get the clean title (without any modifications)
  let cleanTitle = getCleanTitle();
  
  // Check if the title already starts with the prefix
  let titleToUse = cleanTitle;
  let prefix = state.prefix || '';
  let suffix = state.suffix || '';
  
  // Apply the prefix and suffix only if they're not already present
  let newTitle = '';
  
  // Add prefix if it's not already at the beginning of the title
  if (prefix && !titleToUse.startsWith(prefix)) {
    newTitle += prefix;
  }
  
  // Add the main title content
  newTitle += titleToUse;
  
  // Add suffix if it's not already at the end of the title
  if (suffix && !titleToUse.endsWith(suffix)) {
    newTitle += suffix;
  }
  
  // Only update if necessary
  if (document.title !== newTitle) {
    document.title = newTitle;
  }
  
  // Update our current original title (for the observer to use)
  state.originalTitle = cleanTitle;
}

// Listen for messages from the background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'updateTitle') {
    // Capture original title if not already done
    captureOriginalTitle();
    
    // Update our state with new prefix/suffix
    state.prefix = message.prefix || '';
    state.suffix = message.suffix || '';
    
    // Update the title immediately
    updateTitle();
    
    // Set up the observer if not already done
    if (!state.observer) {
      setupObserver();
    }
    
    sendResponse({ success: true });
  } else if (message.action === 'ping') {
    // Respond to ping messages
    sendResponse({ pong: true });
  }
  return true; // Keep the message channel open for the async response
});

// Set up a MutationObserver to maintain our title if the page changes it
function setupObserver() {
  if (state.observer) {
    // If we already have an observer, disconnect it first
    state.observer.disconnect();
  }
  
  state.observer = new MutationObserver(() => {
    // If the title has changed, we need to check what happened
    const expectedTitle = (state.prefix || '') + state.originalTitle + (state.suffix || '');
    
    if (document.title !== expectedTitle) {
      // The page might have changed the title to something new
      // Check if it's the original title without our modifications
      if (document.title === state.actualOriginalTitle) {
        // The page reset to the original title, just reapply our modifications
        updateTitle();
      } else if (!document.title.startsWith(state.prefix) && !document.title.endsWith(state.suffix)) {
        // This is a completely new title set by the page
        // Update our actual original title reference
        state.actualOriginalTitle = document.title;
        state.originalTitle = document.title;
        
        // Apply our modifications to this new title
        updateTitle();
      }
      // If it already has our prefix/suffix, leave it alone
    }
  });
  
  // Start observing the document title
  const titleElement = document.querySelector('title');
  if (titleElement) {
    state.observer.observe(titleElement, { 
      subtree: true, 
      childList: true, 
      characterData: true 
    });
  } else {
    // If there's no title element, observe the head for changes
    state.observer.observe(document.querySelector('head') || document.documentElement, { 
      subtree: true, 
      childList: true 
    });
  }
  
  // Set up a periodic check to ensure title remains consistent
  setupTitleCheckInterval();
}

// Set up a periodic check to ensure title remains consistent even if site changes it in ways
// that bypass the MutationObserver
function setupTitleCheckInterval() {
  // Clear any existing interval
  if (state.titleCheckInterval) {
    clearInterval(state.titleCheckInterval);
  }
  
  // Check every 2 seconds if the title is as expected
  state.titleCheckInterval = setInterval(() => {
    if (state.prefix || state.suffix) { // Only check if we have modifications to apply
      const expectedTitle = (state.prefix || '') + state.originalTitle + (state.suffix || '');
      
      if (document.title !== expectedTitle) {
        // Title has been changed by the site, reapply our modifications
        if (document.title === state.actualOriginalTitle) {
          // Site reset to original title
          updateTitle();
        } else if (!document.title.startsWith(state.prefix) && !document.title.endsWith(state.suffix)) {
          // Site changed to a completely new title
          state.actualOriginalTitle = document.title;
          state.originalTitle = document.title;
          updateTitle();
        }
      }
    }
  }, 2000); // Check every 2 seconds
}

// When the content script loads, notify the background script that we're ready
chrome.runtime.sendMessage({ action: 'contentScriptReady', url: window.location.href }, (response) => {
  if (response && response.settings) {
    // Capture the original title before applying any modifications
    captureOriginalTitle();
    
    // Update our state with settings from background
    state.prefix = response.settings.prefix || '';
    state.suffix = response.settings.suffix || '';
    
    // If we have settings, apply them immediately
    if (state.prefix || state.suffix) {
      updateTitle();
      setupObserver();
    }
  }
});

// Clean up when the page is unloaded
window.addEventListener('unload', () => {
  if (state.titleCheckInterval) {
    clearInterval(state.titleCheckInterval);
  }
  if (state.observer) {
    state.observer.disconnect();
  }
});
