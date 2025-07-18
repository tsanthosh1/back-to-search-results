# Back to Search Results Chrome Extension

A Chrome extension that allows you to quickly navigate back to search results using a keyboard shortcut.

## Features

- **Keyboard Shortcut**: Press `Alt + Shift + Left Arrow` on any page
- **Smart Navigation**: 
  1. First checks browser history for search pages on the same domain or common search engines
  2. If no history found, looks for search pages in tabs to the left
- **Multi-Search Engine Support**: Recognizes Google, Bing, DuckDuckGo, Yahoo, Yandex, and Baidu search pages
- **Domain-aware**: Works with same-domain search pages and popular search engines

## Installation

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" in the top right
3. Click "Load unpacked" and select this folder
4. The extension will be installed and ready to use

## Usage

1. Navigate to any website (e.g., Google search results, then click on a result)
2. Press `Alt + Shift + Left Arrow` to go back to the search results
3. The extension will automatically find the most recent search page in your history or tabs

## How it works

The extension:
- Listens for the `Alt + Shift + Left Arrow` keyboard combination
- Searches browser history for search pages on the same domain or common search engines
- Recognizes search parameters for Google (`q`), Bing (`q`), DuckDuckGo (`q`), Yahoo (`p`, `q`), Yandex (`text`), and Baidu (`wd`)
- If no history match is found, checks tabs to the left for similar search pages
- Navigates to the most recent search result found

## Files

- `manifest.json` - Extension configuration
- `content.js` - Handles keyboard shortcuts
- `background.js` - Navigation logic
- `popup.html` - Extension popup interface

## Permissions

- `tabs` - To switch between tabs
- `activeTab` - To access current tab information
- `history` - To search browser history
- `notifications` - To show status messages

## Version

1.0 - Initial release
