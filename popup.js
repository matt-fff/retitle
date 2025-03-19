// Copyright 2022 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     https://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// DOM elements
const prefixInput = document.getElementById('prefix');
const suffixInput = document.getElementById('suffix');
const saveButton = document.getElementById('save-btn');
const statusMessage = document.getElementById('status');

// Load saved settings when popup opens
function loadSettings() {
  chrome.storage.sync.get(['prefix', 'suffix'], (result) => {
    if (result.prefix !== undefined) {
      prefixInput.value = result.prefix;
    }
    if (result.suffix !== undefined) {
      suffixInput.value = result.suffix;
    }
  });
}

// Save settings to storage and apply to all tabs
function saveSettings() {
  const prefix = prefixInput.value;
  const suffix = suffixInput.value;
  
  chrome.storage.sync.set({ prefix, suffix }, () => {
    // Settings are automatically applied when storage changes
    // due to the listener in background.js
    showStatus('Settings saved and applied!', 'success');
  });
}

// Display status message
function showStatus(message, type) {
  statusMessage.textContent = message;
  statusMessage.className = 'status-message ' + type;
  
  // Clear the status message after 3 seconds
  setTimeout(() => {
    statusMessage.textContent = '';
    statusMessage.className = 'status-message';
  }, 3000);
}

// Event listeners
saveButton.addEventListener('click', saveSettings);

// Load settings when popup opens
document.addEventListener('DOMContentLoaded', loadSettings);
