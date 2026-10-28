import { LocalStorageRepo } from './localStorageRepo'
import { MemoryRepo } from './memoryRepo'
import type { Repo } from './repo'

/**
 * 用環境變數選擇實作：
 *   VITE_DATA=local（預設）→ localStorage 版，單人單裝置、免後端、重整不掉。
 *   VITE_DATA=memory       → 記憶體版（附範例資料），僅示範／測試用，重整會清空。
 *   VITE_DATA=firestore    → Firestore 版，多人即時共編、跨裝置；需要 .env 設定。
 *
 * Firestore 版用動態 import，避免其他模式下仍載入 Firebase SDK 並觸發初始化。
 */
export async function createRepo(): Promise<Repo> {
  const mode = import.meta.env.VITE_DATA ?? 'local'

  if (mode === 'firestore') {
    const [{ FirestoreRepo }, { ensureSignedIn }] = await Promise.all([
      import('./firestoreRepo'),
      import('./firebase'),
    ])
    await ensureSignedIn()
    return new FirestoreRepo()
  }

  if (mode === 'memory') {
    return new MemoryRepo()
  }

  return new LocalStorageRepo()
}
