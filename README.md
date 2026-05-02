# 甲溝炎衛教三消遊戲 MVP

React + TypeScript + Vite 製作的前端三消衛教遊戲。研究版 MVP 使用固定關卡版本與固定規則，資料目前都使用本地設定檔與 localStorage，尚未串接正式後端。

## 可遊玩網址

GitHub Pages 部署完成後可開啟：

```text
https://tankguarder.github.io/Paronychia-Crush/
```

## 啟動方式

```bash
npm install
npm run dev
```

瀏覽器開啟 Vite 顯示的本機網址，通常是 `http://localhost:5173`。

## LIFF 設定

LIFF ID 不要寫死在程式碼中。請在本機建立 `.env.local`：

```text
VITE_LIFF_ID=你的_LIFF_ID
```

部署到 GitHub Pages 時，請在 GitHub repository 的 `Settings > Secrets and variables > Actions > Variables` 新增：

```text
VITE_LIFF_ID
```

並在 `.github/workflows/deploy.yml` 的 build step 將它傳給 Vite。若沒有設定 `VITE_LIFF_ID`，遊戲會自動使用本地測試假資料。

LINE Developers Console 需要設定的 LIFF Endpoint URL：

```text
https://tankguarder.github.io/Paronychia-Crush/
```

## Windows 開啟方式

在 PowerShell 進入專案資料夾：

```powershell
cd "C:\Users\YIDE\Documents\Codex\2026-05-02\react-typescript-vite-ui-unity-mvp"
npm install
npm run dev
```

啟動後可在瀏覽器開啟：

```text
http://localhost:5173
```

也可以雙擊專案根目錄的 `開啟遊戲.url`。注意：這個連結只負責開瀏覽器，仍需先執行 `npm run dev`。

## 建置

```bash
npm run build
```

## 主要資料位置

- `src/data/tiles.ts`: 方塊中文名稱、圖示文字與衛教提示
- `src/data/rules.ts`: 固定遊戲規則
- `src/data/levels.ts`: 10 關固定研究版關卡與衛教影片文案
- `src/data/questions.ts`: 互動題題庫
- `src/utils/board.ts`: 關卡設定控制的三消棋盤，最大 5x5，含交換、消除與補牌邏輯
- `src/utils/leaderboard.ts`: localStorage 暫時排行榜

## MVP 規則預設

- 關卡版本固定為 `research-v1`。
- 所有玩家使用同一套 10 關固定關卡。
- 每關 60 秒。
- 一般三消每清除 1 個方塊加 1 分。
- 清除本關所有甲溝炎障礙後立即過關，並額外加 10 分。
- 發紅甲溝炎手指需由相鄰的藥膏、襪子、手套或乳液三消清除，棉棒不能清除。
- 有傷口的甲溝炎手指可由相鄰的任何主方塊三消清除。
- 第 10 關過關並看完衛教影片後進入結算頁。
- 時間到未過關時，可直接結算，或花費 5 分挑戰互動題。
- 互動題答對會回到原關卡，重新開始該關並增加 10 秒。
