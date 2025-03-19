# Tab Retitle Extension

This Chrome/Chromium extension allows you to add custom prefixes and suffixes to all your tab titles. It works across any Chromium-based browser including Chrome, Vivaldi, Edge, and Brave.

## Features

- Add a custom prefix to all tab titles
- Add a custom suffix to all tab titles
- Settings are saved and persisted across browser sessions
- Apply changes immediately to all open tabs
- Works with dynamically changing tab titles

## Installation

1. Clone or download this repository
2. Open your Chromium-based browser (Chrome, Vivaldi, Edge, Brave, etc.)
3. Navigate to the extensions page:
   - In Chrome/Vivaldi: `chrome://extensions/`
   - In Edge: `edge://extensions/`
   - In Brave: `brave://extensions/`
4. Enable "Developer mode" (usually a toggle in the top-right corner)
5. Click "Load unpacked" and select the directory containing this extension

## Usage

1. Click on the extension icon in your browser toolbar
2. Enter your desired prefix in the "Prefix:" field (e.g., "[Work] ")
3. Enter your desired suffix in the "Suffix:" field (e.g., " - Important")
4. Click "Save Settings" to store your preferences
5. Click "Apply Now" to immediately apply the changes to all open tabs

## How It Works

The extension uses content scripts to modify the document title of each page. It also sets up a MutationObserver to maintain your prefix/suffix even when websites dynamically change their titles.

## Permissions

This extension requires the following permissions:

- `tabs`: To access and modify tab information
- `storage`: To save your prefix/suffix settings
- `scripting`: To inject scripts that modify tab titles
- `host_permissions` for all URLs: To modify titles on any website

## Notes

- The extension cannot modify titles of browser internal pages (chrome://, vivaldi://, etc.)
- Some websites with complex title management might override the extension's changes
