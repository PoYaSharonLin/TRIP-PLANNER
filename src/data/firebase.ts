import { initializeApp } from 'firebase/app'
import {
  connectAuthEmulator,
  getAuth,
  signInAnonymously,
} from 'firebase/auth'
import {
  connectFirestoreEmulator,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from 'firebase/firestore'

// 設定值從環境變數讀取（見 .env.example）。
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

const useEmulator = import.meta.env.VITE_USE_EMULATOR === '1'

export const app = initializeApp(firebaseConfig)

// 持久化快取 → 離線可看可改；多分頁共用。
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager(),
  }),
  ignoreUndefinedProperties: true,
})

export const auth = getAuth(app)

if (useEmulator) {
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true })
  connectFirestoreEmulator(db, '127.0.0.1', 8080)
}

/** 載入時以匿名身分登入；使用者不用註冊。 */
export function ensureSignedIn(): Promise<void> {
  return signInAnonymously(auth).then(() => undefined)
}
