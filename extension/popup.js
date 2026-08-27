const input = document.querySelector('#siteInput');
const message = document.querySelector('#message');

chrome.storage.sync.get({ sites: ['reddit.com', 'instagram.com'] }, data => {
  input.value = data.sites.join(', ');
});

document.querySelector('#saveButton').addEventListener('click', () => {
  const sites = input.value.split(',').map(site => site.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0]).filter(site => site.includes('.'));
  chrome.storage.sync.set({ sites }, () => {
    message.textContent = `${sites.length} blocked site${sites.length === 1 ? '' : 's'} saved.`;
  });
});
