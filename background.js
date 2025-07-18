// Optimized search engines object with Set for faster lookups
const searchEngineParams = new Map([
    ['google.com', new Set(['q'])],
    ['www.google.com', new Set(['q'])],
    ['bing.com', new Set(['q'])],
    ['www.bing.com', new Set(['q'])],
    ['duckduckgo.com', new Set(['q'])],
    ['www.duckduckgo.com', new Set(['q'])],
    ['yahoo.com', new Set(['p', 'q'])],
    ['search.yahoo.com', new Set(['p', 'q'])],
    ['yandex.com', new Set(['text'])],
    ['www.yandex.com', new Set(['text'])],
    ['baidu.com', new Set(['wd'])],
    ['www.baidu.com', new Set(['wd'])]
]);

const commonSearchParams = [
  'q', 'query', 'search', 'keyword', 'keywords', 'text',
  'wd', 'p', 's', 'term', 'searchTerm', 'k'
];

// Cache for URL parsing to avoid repeated parsing
const urlCache = new Map();
const MAX_CACHE_SIZE = 100;

function isSearchPage(url, currentDomain) {
    // Check cache first
    const cacheKey = `${url}:${currentDomain}`;
    if (urlCache.has(cacheKey)) {
        return urlCache.get(cacheKey);
    }

    let result = false;

    try {
        const urlObj = new URL(url);
        const domain = urlObj.hostname;

        if (
            domain === currentDomain &&
            commonSearchParams.some(param => urlObj.searchParams.has(param))
        ) {
            result = true;
        } else if (searchEngineParams.has(domain)) {
            const params = searchEngineParams.get(domain);
            result = Array.from(params).some(param => urlObj.searchParams.has(param));
        }
    } catch {
        result = false;
    }

    // Cache result (with size limit)
    if (urlCache.size >= MAX_CACHE_SIZE) {
        const firstKey = urlCache.keys().next().value;
        urlCache.delete(firstKey);
    }
    urlCache.set(cacheKey, result);

    return result;
}

// In-memory tab history map with performance optimizations
const tabHistory = {};
const MAX_HISTORY_SIZE = 12;
let lastProcessedUrl = ''; // Cache to avoid redundant processing
let lastProcessedTime = 0;

// Debounce rapid navigation events
function shouldProcessNavigation(url) {
    const now = Date.now();
    if (url === lastProcessedUrl && (now - lastProcessedTime) < 100) {
        return false; // Skip if same URL within 100ms
    }
    lastProcessedUrl = url;
    lastProcessedTime = now;
    return true;
}

// Fast URL validation - avoid creating URL objects unnecessarily
function isValidUrl(url) {
    return url && (url.startsWith('http://') || url.startsWith('https://'));
}

// Track navigations per tab - use onHistoryStateUpdated for SPA navigation
chrome.webNavigation.onHistoryStateUpdated.addListener((details) => {
    if (details.frameId !== 0) return; // Main frame only

    const { tabId, url } = details;

    // Quick validations first
    if (!isValidUrl(url) || !shouldProcessNavigation(url)) return;

    if (!tabHistory[tabId]) {
        tabHistory[tabId] = [];
    }

    const history = tabHistory[tabId];

    // Only avoid consecutive duplicates (not all duplicates)
    if (history.length === 0 || history[0] !== url) {
        // Add to front
        history.unshift(url);

        // Keep size bounded
        if (history.length > MAX_HISTORY_SIZE) {
            history.length = MAX_HISTORY_SIZE; // Faster than pop()
        }
    }
});

// Also track regular navigations (for non-SPA sites)
chrome.webNavigation.onCommitted.addListener((details) => {
    if (details.frameId !== 0) return; // Main frame only

    const { tabId, url } = details;

    // Quick validations first
    if (!isValidUrl(url) || !shouldProcessNavigation(url)) return;

    if (!tabHistory[tabId]) {
        tabHistory[tabId] = [];
    }

    const history = tabHistory[tabId];

    // Only avoid consecutive duplicates (not all duplicates)
    if (history.length === 0 || history[0] !== url) {
        // Add to front
        history.unshift(url);

        // Keep size bounded
        if (history.length > MAX_HISTORY_SIZE) {
            history.pop();
        }
    }
});

// Optimized cleanup with batch processing
const tabsToClean = new Set();

function scheduleCleanup(tabId) {
    tabsToClean.add(tabId);
    // Batch cleanup to avoid frequent operations
    if (tabsToClean.size === 1) {
        setTimeout(() => {
            for (const id of tabsToClean) {
                delete tabHistory[id];
            }
            tabsToClean.clear();
        }, 100);
    }
}

// Clear tab history when closed
chrome.tabs.onRemoved.addListener((tabId) => {
    scheduleCleanup(tabId);
});

// Handle tab replacement (prerendering)
chrome.tabs.onReplaced.addListener((addedTabId, removedTabId) => {
    scheduleCleanup(removedTabId);
});

// Periodic cleanup of large histories and cache
setInterval(() => {
    // Clean up oversized histories
    for (const [tabId, history] of Object.entries(tabHistory)) {
        if (history.length > MAX_HISTORY_SIZE) {
            history.length = MAX_HISTORY_SIZE;
        }
    }

    // Clear URL cache periodically
    if (urlCache.size > 50) {
        urlCache.clear();
    }
}, 30000); // Every 30 seconds

// Handle shortcut
chrome.commands.onCommand.addListener(async (command) => {
    if (command !== 'back-to-search') return;

    try {
        const [currentTab] = await chrome.tabs.query({ active: true, currentWindow: true });
        const currentDomain = new URL(currentTab.url).hostname;
        const history = tabHistory[currentTab.id] || [];

        // Step 1: Look back in same tab's history
        for (const url of history) {
            if (url === currentTab.url) continue; // Skip current URL
            if (isSearchPage(url, currentDomain)) {
                await chrome.tabs.update(currentTab.id, { url });
                return;
            }
        }

        // Step 2: Look in tabs to the left
        const allTabs = await chrome.tabs.query({ currentWindow: true });
        const currentIndex = allTabs.findIndex(tab => tab.id === currentTab.id);

        for (let i = currentIndex - 1; i >= 0; i--) {
            const tab = allTabs[i];
            if (isSearchPage(tab.url, currentDomain)) {
                await chrome.tabs.update(tab.id, { active: true });
                return;
            }
        }

        // Step 3: No match found
        await chrome.notifications.create({
            type: 'basic',
            iconUrl: 'icon48.png',
            title: 'Back to Search Results',
            message: 'No search result page found in current tab or nearby tabs.'
        });

    } catch (err) {
        console.error('Error in back-to-search:', err);
    }
});

chrome.runtime.onInstalled.addListener(() => {
    console.log('Back to Search Results extension installed');
});