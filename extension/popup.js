const input = document.querySelector('#siteInput');
const message = document.querySelector('#message');

chrome.storage.sync.get({ sites: ['reddit.com', 'instagram.com'], resetAt: null }, data => {
  input.value = data.sites.join(', ');
  message.textContent = data.resetAt ? `Last reset: ${new Date(data.resetAt).toLocaleTimeString()}` : 'Blocker is ready.';
});

document.querySelector('#saveButton').addEventListener('click', () => {
  const sites = input.value.split(',').map(site => site.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0]).filter(site => site.includes('.'));
  if (!sites.length) {
    message.textContent = 'Enter at least one domain, such as youtube.com.';
    return;
  }
  chrome.storage.sync.set({ sites }, () => {
    if (chrome.runtime.lastError) {
      message.textContent = `Could not save: ${chrome.runtime.lastError.message}`;
      return;
    }
    message.textContent = `${sites.length} blocked site${sites.length === 1 ? '' : 's'} saved. Blocker is active.`;
  });
});
