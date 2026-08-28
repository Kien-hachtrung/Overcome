import { GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut } from 'https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js';
import { doc, getDoc, serverTimestamp, setDoc } from 'https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js';
import { auth, db } from './firebase-config.js';

const STORAGE_KEY = 'overcumState';
const provider = new GoogleAuthProvider();
export const signOutCurrentUser = () => signOut(auth);
window.overcumSignOut = signOutCurrentUser;
const loginMessage = document.querySelector('#loginMessage');
const googleButton = document.querySelector('#googleSignIn');

function getLocalState() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); } catch { return {}; }
}
function saveGoogleUser(user) {
  const state = getLocalState();
  state.user = { ...(state.user || {}), uid: user.uid, email: user.email || '', name: user.displayName || user.email?.split('@')[0] || 'Member', displayName: user.displayName || '', photoURL: user.photoURL || '', joined: state.user?.joined || new Date().toISOString(), provider: 'google' };
  state.loggedIn = true;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
async function syncUserProfile(user) {
  const userRef = doc(db, 'users', user.uid);
  const snapshot = await getDoc(userRef);
  if (!snapshot.exists()) await setDoc(userRef, { uid: user.uid, email: user.email || '', displayName: user.displayName || '', photoURL: user.photoURL || '', createdAt: serverTimestamp() });
}
function showError(error) {
  const message = error?.code === 'auth/popup-closed-by-user' ? 'The sign-in window was closed. You can try again whenever you are ready.' : 'Google sign-in could not be completed. Please try again.';
  if (loginMessage) loginMessage.textContent = message;
}
if (googleButton) googleButton.addEventListener('click', async () => {
  googleButton.disabled = true;
  googleButton.innerHTML = 'Connecting to Google...';
  if (loginMessage) loginMessage.textContent = '';
  try {
    const result = await signInWithPopup(auth, provider);
    saveGoogleUser(result.user);
    await syncUserProfile(result.user);
    window.location.href = 'dashboard.html';
  } catch (error) {
    console.error('Google sign-in failed:', error);
    showError(error);
  } finally {
    googleButton.disabled = false;
    googleButton.innerHTML = 'Sign in with Google <span>↗</span>';
  }
});

onAuthStateChanged(auth, user => {
  if (user) {
    saveGoogleUser(user);
    if (window.location.pathname.endsWith('/index.html') || window.location.pathname === '/') window.location.href = 'dashboard.html';
  }
});

document.querySelectorAll('#logoutButton').forEach(button => button.addEventListener('click', async event => {
  event.preventDefault();
  try { await signOut(auth); } catch (error) { console.error('Sign-out failed:', error); }
  const state = getLocalState(); state.loggedIn = false; localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); window.location.href = 'index.html';
}));
