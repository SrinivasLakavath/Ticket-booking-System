import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  sendPasswordResetEmail,
  updateProfile,
  signOut,
} from 'firebase/auth';
import { auth, googleProvider } from '../storageService/firebase';

function splitDisplayName(displayName = '') {
  const parts = displayName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstname: 'CineSeat', lastname: 'User' };
  if (parts.length === 1) return { firstname: parts[0], lastname: '' };
  return {
    firstname: parts[0],
    lastname: parts.slice(1).join(' '),
  };
}

async function toAuthPayload(user, fallbackNames = {}) {
  const idToken = await user.getIdToken(true);
  const fromProfile = splitDisplayName(user.displayName || '');
  return {
    idToken,
    email: user.email,
    firebaseUid: user.uid,
    firstname: fallbackNames.firstname || fromProfile.firstname,
    lastname: fallbackNames.lastname || fromProfile.lastname,
  };
}

/** Email/password signup on Firebase Auth (free) */
export async function firebaseSignUp({ email, password, firstname, lastname }) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  const displayName = [firstname, lastname].filter(Boolean).join(' ').trim();
  if (displayName) {
    await updateProfile(cred.user, { displayName });
  }
  return toAuthPayload(cred.user, { firstname, lastname });
}

/** Email/password sign-in on Firebase Auth (free) */
export async function firebaseSignIn({ email, password }) {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return toAuthPayload(cred.user);
}

/** Google popup sign-in (free; enable Google provider in Firebase Console) */
export async function firebaseGoogleSignIn() {
  const cred = await signInWithPopup(auth, googleProvider);
  return toAuthPayload(cred.user);
}

/** Password reset email (free) */
export async function firebaseResetPassword(email) {
  await sendPasswordResetEmail(auth, email);
}

export async function firebaseSignOut() {
  await signOut(auth);
}

export function mapFirebaseAuthError(error) {
  const code = error?.code || '';
  const map = {
    'auth/email-already-in-use': 'An account with this email already exists.',
    'auth/invalid-email': 'Please enter a valid email address.',
    'auth/weak-password': 'Password should be at least 6 characters.',
    'auth/user-not-found': 'No account found with this email.',
    'auth/wrong-password': 'Incorrect password.',
    'auth/invalid-credential': 'Invalid email or password.',
    'auth/popup-closed-by-user': 'Google sign-in was cancelled.',
    'auth/popup-blocked': 'Popup blocked. Allow popups and try again.',
    'auth/operation-not-allowed':
      'This sign-in method is disabled in Firebase Console → Authentication → Sign-in method.',
    'auth/unauthorized-domain':
      'Add this domain under Firebase Console → Authentication → Settings → Authorized domains.',
  };
  return map[code] || error?.message || 'Authentication failed.';
}
