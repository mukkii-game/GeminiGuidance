# Gemini Guidance / ジェミニ誘導

自機へ突っ込むジェミニを、闘牛士のように誘導して敵へ通す縦スクロールSTG。通常弾は撃ちません。Canvas + TypeScript + Vite、60Hz固定更新。

距離を取る → 自機へ引きつける → 通り越す一撃を敵へ。長押しで捕獲して守り、離して投げる。近くに留まると球が小さく弱くなります。捕獲中は攻撃力ゼロで、弾消しと押し返しに特化。1球から最大2球、全4面とボス、エンディングを収録。

## 操作

| 操作 | PC | タッチ |
|---|---|---|
| 移動 | WASD | 1本指ドラッグ |
| 捕獲・回転 | 左クリック長押し | 2本指、または右下の捕獲ボタン |
| 投擲 | 押している操作を離す | 捕獲操作を離す |
| 壁反射 | 右クリック（初期OFF） | 画面下の壁ボタン |
| 一時停止 | 中クリック、フォーカスを外す | 別アプリ等へ移ると自動停止 |
| 再開 | 中クリック / 左クリック | タップ |
| 開始・面選択 | タイトルのボタンを左クリック | タイトルのボタン |
| 物理実験室 | T | LABボタン |

ジェミニは自機に当たっても安全。捕獲中の点線矢印が投げる方向です。白弾をジェミニで消せます。反射装甲やブロックは、壁反射OFFでも球を跳ね返します。

敵機体と地上施設の一部には [Kenney Pixel Shmup](https://kenney.nl/assets/pixel-shmup) の素材を使用しています（CC0、同梱の `public/assets/kenney-pixel-shmup/LICENSE.txt` 参照）。

通常ゲームでは共通の物理設定を使います。ホイール回転は未割り当てです。従来のキーボード操作も互換用に残してあります。LABでは1〜5で旧方式との比較、J/U/K/Y/Rでパラメータ、Oで球数、M/Vで自機移動の調整。Tでタイトルへ戻ります。

## 起動・検証

Node.js 22以降を使用。Windowsでは PLAY.cmd も利用できます。

```sh
npm ci
npm run dev
```

表示されたローカルURLを開きます。

```sh
npm test
npm run build
npx playwright install chromium
npm run test:browser
```

## 開発資料

- [現行物理仕様・調整値・検証結果](PHYSICS_HANDOVER.md)
- src/entities/GeminiOrb.ts: 誘導、捕獲、回転、投擲
- src/stages/StageData.ts: 全4面の時系列配置
- src/entities/Enemy.ts / Boss.ts: 予告、突進、攻撃周期
- src/core/Game.ts: 衝突、報酬、面進行
- src/graphics/Renderer.ts: HUD、予告線、ロゴ、エンディング

旧SPECIFICATION.mdは当初の企画資料です。現行動作はこのREADMEとPHYSICS_HANDOVERを参照してください。

[GitHub Pages公開先](https://mukkii-game.github.io/GeminiGuidance/) はmainへの反映後に自動更新されます。

## クレジット
(C) 2026 MUKKII ARCADE SYSTEM。既存ロゴ、レトロな地形、音楽素材を継承。BGM: 魔王魂 / 効果音: 効果音ラボ。各社商標は各権利者に帰属します。

曲名・公式配布元・利用条件・ボス曲の照合記録は [音声クレジット](AUDIO_CREDITS.md) を参照してください。
