import { initializeApp, getApps, getApp } from 'https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js';

export const firebaseConfig = {
  apiKey: 'AIzaSyBJI_B4_v90xm8PRlBw23-yAQn1rrZhusc',
  authDomain: 'overcum-c461e.firebaseapp.com',
  projectId: 'overcum-c461e',
  storageBucket: 'overcum-c461e.firebasestorage.app',
  messagingSenderId: '561108732700',
  appId: '1:561108732700:web:a65af1e4acf2d95e3d08d9',
  measurementId: 'G-X6XH3J8VCB'
};

export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
