import { EmailAuthProvider, GoogleAuthProvider, linkWithCredential, onAuthStateChanged, signInWithPopup, signOut } from 'https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js';
import { doc, getDoc, serverTimestamp, setDoc } from 'https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js';
import { auth, db } from './firebase-config.js';

const STORAGE_KEY = 'overcumState';
const provider = new GoogleAuthProvider();
export const signOutCurrentUser = () => signOut(auth);
window.overcumSignOut = signOutCurrentUser;
const loginMessage = document.querySelector('#loginMessage');
const googleButton = document.querySelector('#googleSignIn');
const isOnboardingPage = window.location.pathname.endsWith('/complete-profile.html');
const isLoginPage = window.location.pathname.endsWith('/index.html') || window.location.pathname.endsWith('/');
const isProtectedPage = document.body?.dataset.protected === '' || document.body?.hasAttribute('data-protected');

function getLocalState() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); } catch { return {}; }
}
export function saveGoogleUser(user, profile = {}) {
  const state = getLocalState();
  state.user = { ...(state.user || {}), uid: user.uid, email: user.email || '', name: profile.username || user.displayName || user.email?.split('@')[0] || 'Member', displayName: user.displayName || '', photoURL: user.photoURL || '', joined: state.user?.joined || new Date().toISOString(), provider: 'google', isProfileComplete: profile.isProfileComplete === true };
  state.loggedIn = true;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
export async function getUserProfile(user) {
  const snapshot = await getDoc(doc(db, 'users', user.uid));
  return snapshot.exists() ? snapshot.data() : null;
}
async function routeFirebaseUser(user) {
  const profile = await getUserProfile(user);
  saveGoogleUser(user, profile || {});
  if (isOnboardingPage) {
    if (profile?.isProfileComplete) window.location.href = 'dashboard.html';
    else document.querySelector('#onboardingEmail').textContent = user.email || '';
    return;
  }
  if (isLoginPage) { window.location.href = profile?.isProfileComplete ? 'dashboard.html' : 'complete-profile.html'; return; }
  if (isProtectedPage && !profile?.isProfileComplete) window.location.href = 'complete-profile.html';
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
    await routeFirebaseUser(result.user);
  } catch (error) {
    console.error('Google sign-in failed:', error);
    showError(error);
  } finally {
    googleButton.disabled = false;
    googleButton.innerHTML = 'Sign in with Google <span>↗</span>';
  }
});

onAuthStateChanged(auth, user => {
  if (user) routeFirebaseUser(user).catch(error => { console.error('Profile check failed:', error); if (loginMessage) loginMessage.textContent = 'We could not check your profile. Please try again.'; });
  else if (isOnboardingPage || isProtectedPage) window.location.href = 'index.html';
});

const onboardingForm = document.querySelector('#completeProfileForm');
if (onboardingForm) onboardingForm.addEventListener('submit', async event => {
  event.preventDefault();
  const username = document.querySelector('#onboardingUsername').value.trim();
  const password = document.querySelector('#onboardingPassword').value;
  const confirmation = document.querySelector('#onboardingPasswordConfirm').value;
  const message = document.querySelector('#onboardingMessage');
  const button = onboardingForm.querySelector('button[type="submit"]');
  if (username.length < 3) { message.textContent = 'Choose a username with at least 3 characters.'; return; }
  if (password.length < 6) { message.textContent = 'Use at least 6 characters for your password.'; return; }
  if (password !== confirmation) { message.textContent = 'The passwords do not match.'; return; }
  if (!auth.currentUser) { window.location.href = 'index.html'; return; }
  button.disabled = true; button.textContent = 'Saving...'; message.textContent = '';
  try {
    const user = auth.currentUser;
    if (!user.providerData.some(providerData => providerData.providerId === 'password')) await linkWithCredential(user, EmailAuthProvider.credential(user.email, password));
    const profile = { uid: user.uid, email: user.email || '', displayName: user.displayName || '', photoURL: user.photoURL || '', username, isProfileComplete: true, createdAt: serverTimestamp(), completedAt: serverTimestamp() };
    await setDoc(doc(db, 'users', user.uid), profile, { merge: true });
    saveGoogleUser(user, profile);
    window.location.href = 'dashboard.html';
  } catch (error) {
    console.error('Profile completion failed:', error);
    message.textContent = error.code === 'auth/email-already-in-use' ? 'This account already has a password. Try signing in again.' : 'Your profile could not be saved. Please try again.';
    button.disabled = false; button.textContent = 'Complete my profile ↗';
  }
});

document.querySelectorAll('#logoutButton').forEach(button => button.addEventListener('click', async event => {
  event.preventDefault();
  try { await signOut(auth); } catch (error) { console.error('Sign-out failed:', error); }
  const state = getLocalState(); state.loggedIn = false; localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); window.location.href = 'index.html';
}));
