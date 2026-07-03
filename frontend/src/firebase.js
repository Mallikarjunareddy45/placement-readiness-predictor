import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider, GithubAuthProvider, signInWithPopup } from 'firebase/auth'

// Standard mock configurations to prevent startup crashes when keys are unset
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyMockKeyForDevTestingOnly12345",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "placement-readiness-predictor.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "placement-readiness-predictor",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "placement-readiness-predictor.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:123456789:web:abcdef123456"
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const googleProvider = new GoogleAuthProvider()
export const githubProvider = new GithubAuthProvider()
export { signInWithPopup }
