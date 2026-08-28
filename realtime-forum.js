import { initializeApp, getApps, getApp } from 'https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js';
import { getAuth, signInAnonymously } from 'https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js';
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy, serverTimestamp, updateDoc, doc, increment, arrayUnion } from 'https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js';

const firebaseConfig = {
  apiKey: 'AIzaSyBJI_B4_v90xm8PRlBw23-yAQn1rrZhusc',
  authDomain: 'overcum-c461e.firebaseapp.com',
  projectId: 'overcum-c461e',
  storageBucket: 'overcum-c461e.firebasestorage.app',
  messagingSenderId: '561108732700',
  appId: '1:561108732700:web:a65af1e4acf2d95e3d08d9'
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const postsRef = collection(db, 'forumPosts');

function escapeHtml(value = '') { return value.replace(/[&<>'"]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character])); }
function initials(name = 'A') { return name.trim().split(/\s+/).map(word => word[0]).join('').slice(0, 2).toUpperCase(); }
function currentUser() {
  try { return JSON.parse(localStorage.getItem('overcumState') || '{}').user || {}; } catch { return {}; }
}
function formatTime(timestamp) {
  if (!timestamp?.toDate) return 'Just now';
  const minutes = Math.max(1, Math.floor((Date.now() - timestamp.toDate().getTime()) / 60000));
  return minutes < 60 ? `${minutes} min ago` : `${Math.floor(minutes / 60)} hr ago`;
}
function renderAccountDetails(posts) {
  const state = currentUser();
  const days = state.streakStarted ? Math.max(0, Math.floor((Date.now() - new Date(state.streakStarted).getTime()) / 86400000)) : 0;
  const ownPosts = posts.filter(post => post.name === (state.name || 'Anonymous member'));
  const comments = posts.reduce((total, post) => total + (post.comments || []).filter(comment => comment.name === (state.name || 'Anonymous member')).length, 0);
  const mostLiked = ownPosts.sort((first, second) => (second.likes || 0) - (first.likes || 0))[0];
  const daysElement = document.querySelector('#accountDays'); if (daysElement) daysElement.textContent = days;
  const commentsElement = document.querySelector('#accountComments'); if (commentsElement) commentsElement.textContent = comments;
  const postElement = document.querySelector('#mostLikedPost'); if (postElement) postElement.textContent = mostLiked?.text || 'No posts yet';
  const likesElement = document.querySelector('#mostLikedCount'); if (likesElement) likesElement.textContent = `${mostLiked?.likes || 0} likes`;
  const nameElement = document.querySelector('#accountName'); if (nameElement) nameElement.textContent = state.name || 'Account';
  const emailElement = document.querySelector('#accountEmail'); if (emailElement) emailElement.textContent = state.email || '';
  const avatarElement = document.querySelector('#accountAvatar'); if (avatarElement) avatarElement.textContent = initials(state.name);
}
function compressImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('The image could not be read.'));
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => reject(new Error('The selected file is not a valid image.'));
      image.onload = () => {
        const scale = Math.min(1, 1200 / image.width, 1200 / image.height);
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(image.width * scale));
        canvas.height = Math.max(1, Math.round(image.height * scale));
        canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
        const qualities = [0.72, 0.55, 0.4, 0.3];
        const compressed = qualities.map(quality => canvas.toDataURL('image/jpeg', quality)).find(data => data.length <= 850000);
        if (!compressed) reject(new Error('This image is too large. Please choose a smaller image.'));
        else resolve(compressed);
      };
      image.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

function renderPosts(posts, compact) {
  const feed = document.querySelector('#forumFeed');
  if (!feed) return;
  const visiblePosts = compact ? posts.slice(0, 1) : posts;
  feed.innerHTML = visiblePosts.map(post => `<article class="forum-post"><header class="post-header"><span class="member-avatar post-avatar">${escapeHtml(post.avatar || initials(post.name))}</span><div><strong>${escapeHtml(post.name)}</strong><span>${formatTime(post.createdAt)}</span></div><button class="post-menu" aria-label="Post menu">•••</button></header><p class="post-text">${escapeHtml(post.text)}</p>${post.image ? `<img class="post-image" src="${post.image}" alt="Image shared by ${escapeHtml(post.name)}">` : ''}<div class="post-actions"><button class="post-action ${post.liked ? 'is-active' : ''}" data-action="like" data-id="${post.id}">♡ <span>${post.likes || 0}</span></button><button class="post-action ${post.saved ? 'is-active' : ''}" data-action="save" data-id="${post.id}">▱ <span>${post.saved ? 'Saved' : 'Save'}</span></button><span class="comment-count">${(post.comments || []).length} comments</span></div><div class="comments">${(post.comments || []).map(comment => `<div class="comment"><span class="member-avatar">${escapeHtml(initials(comment.name))}</span><p><strong>${escapeHtml(comment.name)}</strong>${escapeHtml(comment.text)}</p></div>`).join('')}<form class="comment-form" data-id="${post.id}"><input aria-label="Comment on ${escapeHtml(post.name)}'s post" placeholder="Add a comment..." required><button type="submit" aria-label="Send comment">↗</button></form></div></article>`).join('');
  feed.querySelectorAll('[data-action="like"]').forEach(button => button.addEventListener('click', () => updateDoc(doc(db, 'forumPosts', button.dataset.id), { likes: increment(button.classList.toggle('is-active') ? 1 : -1) })));
  feed.querySelectorAll('[data-action="save"]').forEach(button => button.addEventListener('click', () => updateDoc(doc(db, 'forumPosts', button.dataset.id), { saved: !button.classList.contains('is-active') })));
  feed.querySelectorAll('.comment-form').forEach(form => form.addEventListener('submit', async event => { event.preventDefault(); const user = currentUser(); const input = form.querySelector('input'); const text = input.value.trim(); if (!text) return; await updateDoc(doc(db, 'forumPosts', form.dataset.id), { comments: arrayUnion({ name: user.name || 'Anonymous member', text }) }); }));
}

async function startRealtimeForum() {
  const feed = document.querySelector('#forumFeed');
  if (!feed) return;
  const compact = Boolean(document.querySelector('.today-forum'));
  try {
    await signInAnonymously(auth);
    onSnapshot(query(postsRef, orderBy('createdAt', 'desc')), snapshot => { const posts = snapshot.docs.map(post => ({ id: post.id, ...post.data() })); renderPosts(posts, compact); renderAccountDetails(posts); }, error => { feed.innerHTML = `<p class="form-message">Forum connection failed: ${escapeHtml(error.message)}</p>`; });
    const form = document.querySelector('#postForm');
    if (form) form.addEventListener('submit', async event => {
      event.preventDefault();
      const user = currentUser();
      const text = document.querySelector('#postText').value.trim();
      const file = document.querySelector('#postImage').files[0];
      const message = document.querySelector('#postMessage');
      const button = form.querySelector('button[type="submit"]');
      const publish = async image => {
        button.disabled = true;
        button.textContent = 'Publishing...';
        try {
          await addDoc(postsRef, { name: user.name || 'Anonymous member', avatar: initials(user.name), text, image, likes: 0, saved: false, comments: [], createdAt: serverTimestamp() });
          form.reset();
          document.querySelector('#postComposer').hidden = true;
        } catch (error) {
          message.textContent = 'This post could not be saved. Try a smaller image or try again.';
        } finally {
          button.disabled = false;
          button.innerHTML = 'Publish <span>↗</span>';
        }
      };
      try {
        if (file) await publish(await compressImage(file));
        else await publish('');
      } catch (error) {
        message.textContent = error.message;
      }
    });
  } catch (error) { feed.innerHTML = `<p class="form-message">Forum connection failed. Enable Anonymous sign-in in Firebase Authentication, then reload.</p>`; }
}

startRealtimeForum();
