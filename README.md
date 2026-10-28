# 旅行行程共編

在手機上看行程、拖曳排序、點一下劃掉。同行的人用同一個連結即時共編，不用註冊。

本專案依 `trip-planner-plan.md` 規劃實作。目前完成 **M0–M3**（可跑的本機版）：
完整畫面、拖曳排序、全部 domain 純邏輯與測試，使用記憶體版 repo，**不需要 Firebase 即可啟動**。Firebase 即時同步（M4–M6）的程式碼與安全規則已寫好留接口，待設定後即可啟用。

## 快速開始

```bash
npm install
npm run dev
```

打開 http://localhost:5173 → 按「打開範例行程」就能試：新增、編輯、刪除（可復原）、
打勾、劃掉、長按拖曳排序（同一天／跨天／待排清單之間）。

手機測試：`npm run dev -- --host`，手機連同一個 Wi-Fi 打開畫面上的 Network 網址。

## 指令

| 指令 | 說明 |
|---|---|
| `npm run dev` | 開發伺服器 |
| `npm run build` | 型別檢查 + production build |
| `npm run test` | 單元＋元件測試（Vitest） |
| `npm run coverage` | 測試覆蓋率（`src/domain` ≥ 90%） |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript 型別檢查 |

## 架構

- `src/domain/` — 純邏輯，不依賴 React／Firebase（排序鍵、日期、時間推算、地圖連結、網址驗證、狀態）
- `src/data/` — `Repo` 介面；`memoryRepo`（本機示範）與 `firestoreRepo`（Firebase）兩種實作
- `src/ui/` — 畫面元件

用環境變數選實作（見 `.env`）：
- `VITE_DATA=memory` → 記憶體版（附範例資料），預設。
- `VITE_DATA=firestore` → Firestore 版，需要下方 Firebase 設定。

## 之後啟用 Firebase（M4–M6）

1. 安裝 CLI 與 Java（Emulator 需要）：`npm i -g firebase-tools`
2. 建立 Firebase 專案 → 啟用 **匿名登入** → 建立 Firestore（區域如 `asia-east1`）
3. 複製 `.env.example` 為 `.env`，填入 Firebase 設定，並設 `VITE_DATA=firestore`
4. 部署安全規則：`firebase deploy --only firestore:rules`
5. 部署前端：`npm run build && firebase deploy --only hosting`

安全規則草稿在 `firestore.rules`，Hosting／Emulator 設定在 `firebase.json`。
