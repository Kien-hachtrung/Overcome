const DEFAULT_SITES = ['reddit.com', 'instagram.com'];

function normalizeDomain(value) {
  return value.toLowerCase().replace(/^www\./, '').split('/')[0];
}

function isBlocked(url, sites) {
  try {
    const domain = normalizeDomain(new URL(url).hostname);
    return sites.some(site => domain === site || domain.endsWith(`.${site}`));
  } catch {
    return false;
  }
}

async function closeIfBlocked(tabId, url) {
  if (!url || url.startsWith('chrome://') || url.startsWith('edge://')) return;
  const stored = await chrome.storage.sync.get({ sites: DEFAULT_SITES });
  if (!isBlocked(url, stored.sites)) return;
  const resetAt = new Date().toISOString();
  await chrome.storage.sync.set({ resetAt });
  const allTabs = await chrome.tabs.query({});
  const appTabs = allTabs.filter(tab => tab.url && (
    tab.url.includes('.web.app/') ||
    tab.url.includes('.firebaseapp.com/') ||
    tab.url.includes('localhost/') ||
    tab.url.includes('127.0.0.1/') ||
    tab.url.includes('/Overcome/Public/')
  ));
  await Promise.all(appTabs.map(tab => {
    const separator = tab.url.includes('?') ? '&' : '?';
    return chrome.tabs.update(tab.id, { url: `${tab.url}${separator}overcumReset=${encodeURIComponent(resetAt)}` });
  }));
  await chrome.tabs.remove(tabId);
}

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete') closeIfBlocked(tabId, tab.url);
});

chrome.tabs.onCreated.addListener(tab => closeIfBlocked(tab.id, tab.pendingUrl || tab.url));
