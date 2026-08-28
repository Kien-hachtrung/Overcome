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
  quoteIndex: 0,
  emergencyReminder: '',
  emergencyVoice: '',
  nightGuard: false
};

function getState() {
  try { return { ...defaultState, ...JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') }; }
  catch { return { ...defaultState }; }
}
function saveState(state) { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
function resetFromExtension() {
  const resetAt = new URLSearchParams(window.location.search).get('overcumReset');
  if (!resetAt) return;
  const state = getState();
  state.streak = 0;
  state.streakStarted = new Date(resetAt).toISOString();
  state.lastActive = resetAt;
  saveState(state);
  window.history.replaceState({}, document.title, window.location.pathname);
}
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
function getStreakDuration(state) {
  const totalMinutes = state.streakStarted ? Math.max(0, Math.floor((Date.now() - new Date(state.streakStarted).getTime()) / 60000)) : 0;
  return `${Math.floor(totalMinutes / 1440)}d ${Math.floor((totalMinutes % 1440) / 60)}h ${totalMinutes % 60}m`;
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
  if (state.loggedIn && loginForm) { window.location.href = 'dashboard.html'; return; }
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
  const headerLogout = document.querySelector('.topbar #logoutButton');
  if (headerLogout) {
    const profileLink = document.createElement('a');
    profileLink.className = 'avatar'; profileLink.href = 'settings.html'; profileLink.setAttribute('aria-label', 'Open settings'); profileLink.textContent = headerLogout.textContent;
    headerLogout.replaceWith(profileLink);
  }
  const navigation = document.querySelector('.topbar nav');
  if (navigation && !navigation.querySelector('a[href="forum.html"]')) {
    const forumLink = document.createElement('a');
    forumLink.href = 'forum.html';
    forumLink.textContent = 'Forum';
    navigation.insertBefore(forumLink, navigation.querySelector('a[href="leaderboard.html"]'));
  }
  document.querySelectorAll('#logoutButton').forEach(button => button.addEventListener('click', () => { state.loggedIn = false; saveState(state); window.location.href = 'index.html'; }));
  const avatar = initials(state.user?.name);
  document.querySelectorAll('.avatar, #profileAvatar, #accountAvatar').forEach(element => {
    element.textContent = avatar;
    if (element.id !== 'logoutButton') element.addEventListener('click', () => { window.location.href = 'settings.html'; });
  });
  const name = document.querySelector('#profileName'); if (name) name.textContent = state.user?.name || 'Account';
  const email = document.querySelector('#profileEmail'); if (email) email.textContent = state.user?.email || '';
  const joined = document.querySelector('#memberSince'); if (joined) joined.textContent = dateLabel(state.user?.joined);
  const profilePanel = document.querySelector('.profile-panel');
  if (profilePanel && !document.querySelector('#logoutButton')) {
    const logout = document.createElement('button'); logout.id = 'logoutButton'; logout.className = 'button button-secondary settings-logout'; logout.type = 'button'; logout.innerHTML = 'Log out <span>↗</span>'; profilePanel.appendChild(logout);
  }
  document.querySelectorAll('#logoutButton').forEach(button => button.addEventListener('click', () => { state.loggedIn = false; saveState(state); window.location.href = 'index.html'; }));
}

function setupDashboard() {
  const count = document.querySelector('#streakCount'); if (!count) return;
  const state = getState();
  if (!state.streakStarted) { state.streakStarted = new Date().toISOString(); saveState(state); }
  let detailed = false;
  const updateStreak = () => {
    const days = getStreakDays(state);
    state.streak = days;
    count.textContent = detailed ? getStreakDuration(state) : days;
    document.querySelector('#streakCount + small').textContent = detailed ? '' : 'days';
    document.querySelector('#headerStreak').textContent = detailed ? getStreakDuration(state) : days;
    document.querySelector('#headerStreakUnit').textContent = detailed ? '' : 'day streak';
    document.querySelector('#streakFill').style.width = `${Math.min((days / 90) * 100, 100)}%`;
  };
  updateStreak();
  const streakTimer = window.setInterval(updateStreak, 1000);
  [count, document.querySelector('#headerStreak')].forEach(element => element?.addEventListener('click', () => { detailed = !detailed; updateStreak(); }));
  document.querySelector('#startDate').textContent = dateLabel(state.streakStarted);
  const hour = new Date().getHours(); document.querySelector('#greeting').textContent = hour < 12 ? 'Good morning.' : hour < 18 ? 'Good afternoon.' : 'Good evening.';
  renderQuote(state);
  document.querySelector('#newQuote').addEventListener('click', () => { state.quoteIndex = (state.quoteIndex + 1) % state.quotes.length; saveState(state); renderQuote(state); });
  document.querySelector('#resetStreak').addEventListener('click', () => { window.clearInterval(streakTimer); state.streak = 0; state.streakStarted = new Date().toISOString(); saveState(state); setupDashboard(); });
}
function setupEmergency() {
  const panicButton = document.querySelector('#panicButton');
  const overlay = document.querySelector('#emergencyOverlay');
  const activity = document.querySelector('#emergencyActivity');
  if (!panicButton || !overlay || !activity) return;
  const state = getState();
  let timer;
  let recorder;
  let audioChunks = [];
  const clearTimer = () => { if (timer) window.clearInterval(timer); timer = null; };
  const close = () => { clearTimer(); overlay.hidden = true; document.body.classList.remove('modal-open'); activity.hidden = true; activity.innerHTML = ''; };
  const showActivity = content => { clearTimer(); activity.innerHTML = content; activity.hidden = false; activity.scrollIntoView({ block: 'nearest' }); };
  const countdown = (seconds, onTick, onDone) => { let remaining = seconds; onTick(remaining); timer = window.setInterval(() => { remaining -= 1; onTick(remaining); if (remaining <= 0) { clearTimer(); onDone(); } }, 1000); };
  const renderReminder = () => {
    showActivity(`<div class="activity-heading"><span class="tool-icon">↺</span><div><h3>Why did you choose this?</h3><p>This is private and stays on this device.</p></div></div><textarea id="reminderText" maxlength="500" placeholder="Write a few honest words to your future self...">${escapeHtml(state.emergencyReminder || '')}</textarea><div class="activity-actions"><button id="saveReminder" class="button button-primary" type="button">Save reminder</button><button id="recordReminder" class="button button-secondary" type="button">${state.emergencyVoice ? 'Record again' : 'Record voice memo'}</button></div><audio id="reminderAudio" controls ${state.emergencyVoice ? `src="${state.emergencyVoice}"` : 'hidden'}></audio><p id="reminderStatus" class="form-message" role="status"></p>`);
    document.querySelector('#saveReminder').addEventListener('click', () => { state.emergencyReminder = document.querySelector('#reminderText').value.trim(); saveState(state); document.querySelector('#reminderStatus').textContent = 'Saved. Come back to these words whenever you need them.'; });
    document.querySelector('#recordReminder').addEventListener('click', async event => {
      const status = document.querySelector('#reminderStatus');
      if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) { status.textContent = 'Voice recording is not available in this browser. Your written reminder still works.'; return; }
      if (recorder?.state === 'recording') { recorder.stop(); event.target.textContent = 'Record voice memo'; return; }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioChunks = []; recorder = new MediaRecorder(stream);
        recorder.ondataavailable = recordingEvent => audioChunks.push(recordingEvent.data);
        recorder.onstop = () => { stream.getTracks().forEach(track => track.stop()); const reader = new FileReader(); reader.onloadend = () => { state.emergencyVoice = reader.result; saveState(state); renderReminder(); }; reader.readAsDataURL(new Blob(audioChunks, { type: recorder.mimeType || 'audio/webm' })); };
        recorder.start(); event.target.textContent = 'Stop recording'; status.textContent = 'Recording... tap stop when you are done.';
      } catch { status.textContent = 'Microphone access was not granted. You can still write a reminder.'; }
    });
  };
  const openTool = tool => {
    if (tool === 'breathing') showActivity(`<div class="activity-heading"><span class="breath-orb"></span><div><h3 id="activityTitle">Breathe in</h3><p id="activityHint">Follow the pace. There is nothing else to solve right now.</p></div></div><div class="activity-timer" id="activityTimer">4</div><div class="breath-progress"><span id="breathProgress"></span></div>`), countdown(19, remaining => { const cycle = remaining % 19; const phase = cycle > 11 ? ['Breathe out', 8] : cycle > 4 ? ['Hold', 7] : ['Breathe in', 4]; document.querySelector('#activityTitle').textContent = phase[0]; document.querySelector('#activityTimer').textContent = phase[1]; document.querySelector('#breathProgress').style.width = `${((19 - cycle) / 19) * 100}%`; }, () => { document.querySelector('#activityTitle').textContent = 'Nice work.'; document.querySelector('#activityHint').textContent = 'Your body has had a chance to settle. You can stay here or close this.'; document.querySelector('#activityTimer').textContent = '✓'; });
    if (tool === 'movement') showActivity(`<div class="activity-heading"><span class="tool-icon">↯</span><div><h3>Thirty seconds, your way</h3><p>Try pushups, a stretch, a brisk walk, or cold water on your hands.</p></div></div><div class="activity-timer" id="activityTimer">30</div><button id="startMovement" class="button button-primary" type="button">Start timer</button>`), document.querySelector('#startMovement').addEventListener('click', event => { event.disabled = true; event.textContent = 'Keep going'; countdown(30, remaining => { document.querySelector('#activityTimer').textContent = remaining; }, () => { document.querySelector('#activityTimer').textContent = 'Done'; event.textContent = 'That counts'; }); });
    if (tool === 'puzzle') { const first = Math.floor(Math.random() * 8) + 2; const second = Math.floor(Math.random() * 8) + 2; showActivity(`<div class="activity-heading"><span class="tool-icon">＋</span><div><h3>Give your mind a small job</h3><p>Solve three quick sums, one at a time.</p></div></div><p class="puzzle-question">${first} × ${second} = ?</p><form id="puzzleForm" class="puzzle-form"><input id="puzzleAnswer" type="number" inputmode="numeric" aria-label="Puzzle answer" required><button class="button button-primary" type="submit">Check</button></form><p id="puzzleStatus" class="form-message" role="status"></p>`); document.querySelector('#puzzleForm').addEventListener('submit', event => { event.preventDefault(); const status = document.querySelector('#puzzleStatus'); status.textContent = Number(document.querySelector('#puzzleAnswer').value) === first * second ? 'Correct. Take one slow breath before you decide what is next.' : 'Not quite. Try it once more, no pressure.'; }); }
    if (tool === 'reminder') renderReminder();
  };
  panicButton.addEventListener('click', () => { overlay.hidden = false; document.body.classList.add('modal-open'); document.querySelector('#closeEmergency').focus(); });
  document.querySelector('#closeEmergency').addEventListener('click', close);
  overlay.addEventListener('click', event => { if (event.target === overlay) close(); });
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && !overlay.hidden) close(); });
  document.querySelectorAll('[data-emergency-tool]').forEach(button => button.addEventListener('click', () => openTool(button.dataset.emergencyTool)));
  const guardToggle = document.querySelector('#nightGuardToggle'); guardToggle.checked = Boolean(state.nightGuard);
  const checkNightGuard = () => { const hour = new Date().getHours(); if (!state.nightGuard || !window.Notification || Notification.permission !== 'granted' || (hour >= 7 && hour < 22) || sessionStorage.getItem('overcumNightGuardNotice') === new Date().toDateString()) return; sessionStorage.setItem('overcumNightGuardNotice', new Date().toDateString()); new Notification('A gentle night guard reminder', { body: 'Your phone can wait. Choose one small thing that helps you wind down.' }); };
  checkNightGuard(); window.setInterval(checkNightGuard, 60000);
  guardToggle.addEventListener('change', async () => { state.nightGuard = guardToggle.checked; saveState(state); if (state.nightGuard && 'Notification' in window && Notification.permission === 'default') await Notification.requestPermission(); if (state.nightGuard && window.Notification?.permission === 'granted') new Notification('Smart night guard is on', { body: 'A gentle reminder will appear when it is time to put your phone down.' }); });
}
function setupHelpForm() {
  const form = document.querySelector('#helpForm'); if (!form || !window.emailjs) return;
  const state = getState();
  document.querySelector('#helpName').value = state.user?.name || 'overcum member';
  document.querySelector('#helpReply').value = state.user?.email || '';
  form.addEventListener('submit', async event => {
    event.preventDefault();
    const button = form.querySelector('button'); const message = document.querySelector('#helpMessage');
    button.disabled = true; button.innerHTML = 'Sending...'; message.textContent = '';
    try {
      await window.emailjs.sendForm('service_b17x3rz', 'template_l3r6avl', form);
      form.reset();
      document.querySelector('#helpName').value = state.user?.name || 'overcum member';
      document.querySelector('#helpReply').value = state.user?.email || '';
      message.textContent = 'Your message was sent. We will get back to you soon.';
    } catch (error) {
      message.textContent = 'Message could not be sent. Please try again.';
    } finally { button.disabled = false; button.innerHTML = 'Send help email <span>↗</span>'; }
  });
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
function setupPostComposer() {
  const button = document.querySelector('#newPostButton');
  const composer = document.querySelector('#postComposer');
  if (!button || !composer) return;
  button.addEventListener('click', () => {
    composer.hidden = !composer.hidden;
    if (!composer.hidden) document.querySelector('#postText')?.focus();
  });
}

setupLogo();
setupPostComposer();
resetFromExtension();
closeBlockedTab();
setupAuth(); setupShared(); setupDashboard(); setupSettings(); setupLeaderboard();
setupEmergency();
if (!document.querySelector('#forumFeed')) setupForum();
if (window.emailjs) window.emailjs.init({ publicKey: 'eDArlprS1yvQKj-uy' });
setupHelpForm();
