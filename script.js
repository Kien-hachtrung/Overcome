const STORAGE_KEY = 'overcumState';
const FORUM_KEY = 'overcumForum';

const defaultState = {
  user: null,
  loggedIn: false,
  streak: 0,
  streakStarted: null,
  lastActive: null,
  sites: ['reddit.com', 'instagram.com'],
  quotes: [
    ['We do not rise to the level of our goals. We fall to the level of our systems.', 'James Clear'],
    ['The most important conversation is the one you have with yourself.', 'David Goggins'],
    ['You have power over your mind, not outside events.', 'Marcus Aurelius'],
    ['One day or day one. You decide.', 'Paulo Coelho']
  ],
  quoteIndex: 0
};

function getState() {
  try { return { ...defaultState, ...JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') }; }
  catch { return { ...defaultState }; }
}
function saveState(state) { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
function getForumPosts() {
  try { return JSON.parse(localStorage.getItem(FORUM_KEY) || 'null') || getDefaultForumPosts(); }
  catch { return getDefaultForumPosts(); }
}
function saveForumPosts(posts) { localStorage.setItem(FORUM_KEY, JSON.stringify(posts)); }
function getDefaultForumPosts() {
  return [
    { id: 'welcome', name: 'Maya R.', time: '12 min ago', avatar: 'MR', text: 'Day 18. The urge is temporary, but the person I am becoming is permanent.', image: '', likes: 24, liked: false, saved: false, comments: [{ name: 'Jordan K.', text: 'Keep going. One day at a time.' }] },
    { id: 'morning', name: 'Alex T.', time: '1 hr ago', avatar: 'AT', text: 'Went for a run before my phone could decide how my morning would feel. Small win.', image: 'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?auto=format&fit=crop&w=1000&q=80', likes: 41, liked: false, saved: false, comments: [] }
  ];
}
function initials(name = 'A') { return name.trim().split(/\s+/).map(word => word[0]).join('').slice(0, 2).toUpperCase(); }
function escapeHtml(value = '') { return value.replace(/[&<>'"]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character])); }
function dateLabel(value) { return value ? new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase() : 'TODAY'; }
function normalizeDomain(value) { return value.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0]; }
function requireLogin() { if (!getState().loggedIn) window.location.href = 'index.html'; }
function getStreakDays(state) {
  return state.streakStarted ? Math.max(0, Math.floor((Date.now() - new Date(state.streakStarted).getTime()) / 86400000)) : 0;
}
function setupLogo() {
  document.querySelectorAll('.brand-mark').forEach(mark => {
    if (mark.tagName === 'IMG') return;
    const logo = document.createElement('img');
    logo.className = 'brand-mark';
    logo.src = 'logo.svg';
    logo.alt = '';
    mark.replaceWith(logo);
  });
  let favicon = document.querySelector('link[rel="icon"]');
  if (!favicon) {
    favicon = document.createElement('link');
    favicon.rel = 'icon';
    document.head.appendChild(favicon);
  }
  favicon.href = 'logo.svg';
  favicon.type = 'image/svg+xml';
}
function closeBlockedTab() {
  const state = getState();
  const currentDomain = normalizeDomain(window.location.hostname);
  const isBlocked = state.sites.some(site => currentDomain === site || currentDomain.endsWith(`.${site}`));
  if (!currentDomain || !isBlocked) return false;
  state.streak = 0;
  state.streakStarted = null;
  state.lastActive = null;
  saveState(state);
  window.close();
  return true;
}

function setupAuth() {
  const state = getState();
  const loginForm = document.querySelector('#loginForm');
  const signupForm = document.querySelector('#signupForm');
  if (loginForm) loginForm.addEventListener('submit', event => {
    event.preventDefault();
    const email = document.querySelector('#loginEmail').value.trim().toLowerCase();
    const message = document.querySelector('#loginMessage');
    if (!state.user || state.user.email !== email) { message.textContent = 'No local account found. Create one first.'; return; }
    state.loggedIn = true; saveState(state); window.location.href = 'dashboard.html';
  });
  if (signupForm) signupForm.addEventListener('submit', event => {
    event.preventDefault();
    const name = document.querySelector('#signupName').value.trim();
    const email = document.querySelector('#signupEmail').value.trim().toLowerCase();
    const password = document.querySelector('#signupPassword').value;
    const message = document.querySelector('#signupMessage');
    if (password.length < 6) { message.textContent = 'Use at least 6 characters for your password.'; return; }
    state.user = { name, email, password, joined: new Date().toISOString() }; state.streak = 0; state.streakStarted = new Date().toISOString(); state.loggedIn = true; saveState(state); window.location.href = 'dashboard.html';
  });
}

function setupShared() {
  const state = getState();
  if (document.body.dataset.protected) requireLogin();
  const navigation = document.querySelector('.topbar nav');
  if (navigation && !navigation.querySelector('a[href="forum.html"]')) {
    const forumLink = document.createElement('a');
    forumLink.href = 'forum.html';
    forumLink.textContent = 'Forum';
    navigation.insertBefore(forumLink, navigation.querySelector('a[href="leaderboard.html"]'));
  }
  document.querySelectorAll('#logoutButton').forEach(button => button.addEventListener('click', () => { state.loggedIn = false; saveState(state); window.location.href = 'index.html'; }));
  const avatar = initials(state.user?.name);
  document.querySelectorAll('.avatar, #profileAvatar').forEach(element => element.textContent = avatar);
  const name = document.querySelector('#profileName'); if (name) name.textContent = state.user?.name || 'Account';
  const email = document.querySelector('#profileEmail'); if (email) email.textContent = state.user?.email || '';
  const joined = document.querySelector('#memberSince'); if (joined) joined.textContent = dateLabel(state.user?.joined);
}

function setupDashboard() {
  const count = document.querySelector('#streakCount'); if (!count) return;
  const state = getState();
  if (!state.streakStarted) { state.streakStarted = new Date().toISOString(); saveState(state); }
  const updateStreak = () => {
    const days = getStreakDays(state);
    state.streak = days;
    count.textContent = days;
    document.querySelector('#headerStreak').textContent = days;
    document.querySelector('#streakFill').style.width = `${Math.min((days / 90) * 100, 100)}%`;
  };
  updateStreak();
  const streakTimer = window.setInterval(updateStreak, 1000);
  document.querySelector('#startDate').textContent = dateLabel(state.streakStarted);
  const hour = new Date().getHours(); document.querySelector('#greeting').textContent = hour < 12 ? 'Good morning.' : hour < 18 ? 'Good afternoon.' : 'Good evening.';
  renderQuote(state);
  document.querySelector('#newQuote').addEventListener('click', () => { state.quoteIndex = (state.quoteIndex + 1) % state.quotes.length; saveState(state); renderQuote(state); });
  document.querySelector('#resetStreak').addEventListener('click', () => { window.clearInterval(streakTimer); state.streak = 0; state.streakStarted = new Date().toISOString(); saveState(state); setupDashboard(); });
}
function renderQuote(state) { const quote = state.quotes[state.quoteIndex]; document.querySelector('#quoteText').textContent = quote[0]; document.querySelector('#quoteAuthor').textContent = `— ${quote[1]}`; }

function setupSettings() {
  const form = document.querySelector('#siteForm'); if (!form) return;
  const state = getState(); renderSites(state);
  form.addEventListener('submit', event => { event.preventDefault(); const input = document.querySelector('#siteInput'); const domain = normalizeDomain(input.value); const message = document.querySelector('#siteMessage'); if (!domain.includes('.')) { message.textContent = 'Enter a domain like youtube.com.'; return; } if (!state.sites.includes(domain)) state.sites.push(domain); saveState(state); input.value = ''; message.textContent = `${domain} is now on your reset list.`; renderSites(state); });
}
function renderSites(state) { const list = document.querySelector('#siteList'); list.innerHTML = state.sites.map(site => `<div class="site-row"><span>${site}</span><button data-site="${site}" type="button">Remove</button></div>`).join(''); list.querySelectorAll('button').forEach(button => button.addEventListener('click', () => { state.sites = state.sites.filter(site => site !== button.dataset.site); saveState(state); renderSites(state); })); }

function setupLeaderboard() {
  const rows = document.querySelector('#rankingRows'); if (!rows) return;
  const state = getState(); const people = [{ name: 'Maya R.', streak: 187 }, { name: 'Jordan K.', streak: 124 }, { name: 'Alex T.', streak: 98 }, { name: state.user?.name || 'You', streak: getStreakDays(state), current: true }, { name: 'Sam D.', streak: 41 }, { name: 'Chris L.', streak: 28 }].sort((a, b) => b.streak - a.streak);
  document.querySelector('#podium').innerHTML = people.slice(0, 3).map((person, index) => `<div class="podium-card ${index === 0 ? 'first' : ''}"><div class="rank-medal">${['♛', '②', '③'][index]}</div><h2>${person.name}</h2><p>${person.current ? 'YOU' : 'MEMBER'}</p><strong>${person.streak} DAYS</strong></div>`).join('');
  rows.innerHTML = people.slice(3).map((person, index) => `<div class="rank-row"><span class="rank">#${index + 4}</span><span class="member"><span class="member-avatar">${initials(person.name)}</span>${person.name}${person.current ? ' (you)' : ''}</span><strong class="rank-value">${person.streak} days</strong></div>`).join('');
}

function setupForum() {
  const feed = document.querySelector('#forumFeed'); if (!feed) return;
  const state = getState(); let posts = getForumPosts();
  const render = () => {
    feed.innerHTML = posts.map(post => `<article class="forum-post"><header class="post-header"><span class="member-avatar post-avatar">${escapeHtml(post.avatar)}</span><div><strong>${escapeHtml(post.name)}</strong><span>${escapeHtml(post.time)}</span></div><button class="post-menu" aria-label="Post menu">•••</button></header><p class="post-text">${escapeHtml(post.text)}</p>${post.image ? `<img class="post-image" src="${post.image}" alt="Image shared by ${escapeHtml(post.name)}">` : ''}<div class="post-actions"><button class="post-action ${post.liked ? 'is-active' : ''}" data-action="like" data-id="${post.id}">♡ <span>${post.likes}</span></button><button class="post-action ${post.saved ? 'is-active' : ''}" data-action="save" data-id="${post.id}">▱ <span>${post.saved ? 'Saved' : 'Save'}</span></button><span class="comment-count">${post.comments.length} comments</span></div><div class="comments">${post.comments.map(comment => `<div class="comment"><span class="member-avatar">${escapeHtml(initials(comment.name))}</span><p><strong>${escapeHtml(comment.name)}</strong>${escapeHtml(comment.text)}</p></div>`).join('')}<form class="comment-form" data-id="${post.id}"><input aria-label="Comment on ${escapeHtml(post.name)}'s post" placeholder="Add a comment..." required><button type="submit" aria-label="Send comment">↗</button></form></div></article>`).join('');
    feed.querySelectorAll('[data-action]').forEach(button => button.addEventListener('click', () => { const post = posts.find(item => item.id === button.dataset.id); if (button.dataset.action === 'like') { post.liked = !post.liked; post.likes += post.liked ? 1 : -1; } else post.saved = !post.saved; saveForumPosts(posts); render(); }));
    feed.querySelectorAll('.comment-form').forEach(form => form.addEventListener('submit', event => { event.preventDefault(); const post = posts.find(item => item.id === form.dataset.id); post.comments.push({ name: state.user?.name || 'You', text: form.querySelector('input').value.trim() }); saveForumPosts(posts); render(); }));
  };
  render();
  const newPostButton = document.querySelector('#newPostButton');
  if (newPostButton) newPostButton.addEventListener('click', () => { const composer = document.querySelector('#postComposer'); composer.hidden = !composer.hidden; if (!composer.hidden) document.querySelector('#postText').focus(); });
  const postForm = document.querySelector('#postForm');
  if (postForm) postForm.addEventListener('submit', event => { event.preventDefault(); const text = document.querySelector('#postText').value.trim(); const file = document.querySelector('#postImage').files[0]; const addPost = image => { posts.unshift({ id: `post-${Date.now()}`, name: state.user?.name || 'You', time: 'Just now', avatar: initials(state.user?.name), text, image, likes: 0, liked: false, saved: false, comments: [] }); saveForumPosts(posts); event.target.reset(); document.querySelector('#postComposer').hidden = true; render(); }; if (file) { const reader = new FileReader(); reader.onload = () => addPost(reader.result); reader.readAsDataURL(file); } else addPost(''); });
}

setupLogo();
closeBlockedTab();
setupAuth(); setupShared(); setupDashboard(); setupSettings(); setupLeaderboard();
setupForum();
