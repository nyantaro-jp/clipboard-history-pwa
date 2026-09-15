# クリップ履歴 (Clipboard History PWA)

iOS にはクリップボードの履歴機能がない。コピーしたテキストをワンタップで端末内に保存し、後から分類・検索して取り出せる PWA。

> **現在の状態: Phase 0（実機検証）**
> 本番機能の実装前に、iOS 実機でクリップボード API と IndexedDB の挙動を確かめている段階。
> 現在デプロイされているのは検証用ページのみ。

## 解決したい課題

- iPhone で複数の文字列を行き来してコピー＆ペーストすると、直前のコピー内容が上書きされて失われる
- Android や macOS のサードパーティ製アプリのような「クリップボード履歴」が iOS には標準で存在しない
- データを外部サーバーに送らず、端末内だけで完結させたい

## iOS の制約と設計方針

| 制約 | 設計への反映 |
|---|---|
| Web からクリップボードを自動監視できない（バックグラウンド取り込み不可） | 「アプリを開いて保存ボタンを1回タップ」を保存動線とする |
| `navigator.clipboard.readText()` はユーザー操作起点で、OS の貼り付け確認 UI が挟まる | 確認 UI は消せない前提で、保存ボタンを親指の届く画面下部に固定する |
| Clipboard API は Secure Context 必須 | HTTPS で配信される GitHub Pages を使う |

Phase 0 の検証結果によって、この表は更新する。

## Phase 0: 実機検証

### 検証項目

1. ボタンタップで `navigator.clipboard.readText()` が値を返すか
2. 確認 UI がどう出るか、拒否された場合に何が起きるか
3. ホーム画面に追加した PWA と Safari のタブとで挙動が違うか
4. 数日置いた後に IndexedDB のデータが残っているか

### 検証ページでできること

| ボタン | 目的 |
|---|---|
| `readText()` | 項目 1・2。成功時は文字数と先頭40文字、失敗時は `DOMException` の name/message と所要時間を記録 |
| `read()` | `ClipboardItem` 経由で読んだ場合との差を見る（空のクリップボードの扱いなど） |
| `1秒待ってから readText()` | ユーザー操作から非同期処理を挟むと拒否されるか。保存処理の前に `await` を置けるかの判断材料 |
| `writeText()` | 書き戻しが他アプリで貼り付けできるか。直後に `readText()` を押し、自分が書いた内容でも確認 UI が出るか |
| `現在時刻を記録` / 起動時の自動記録 | 項目 4。記録日時と表示モード（`standalone` / `browser`）を IndexedDB に残す |
| `storage.persist()` | 永続ストレージの許可が得られるか |
| `Markdown でコピー` | 環境情報と記録を表形式でコピーし、この README に転記する |

### 手順

1. iPhone の Safari で検証ページを開き、各ボタンを試す
2. 共有メニュー →「ホーム画面に追加」で追加し、ホーム画面から起動して同じボタンを試す
3. それぞれで `Markdown でコピー` を押して結果を保存する
4. 数日後に Safari タブ・ホーム画面 PWA の両方を開き、最古の記録が残っているかを確認する

### 結果

未実施。実機で確認後に記入する。

| # | 検証項目 | Safari タブ | ホーム画面 PWA |
|---|---|---|---|
| 1 | `readText()` が値を返すか | | |
| 2 | 確認 UI の出方 / 拒否時の挙動 | | |
| 3 | 表示モードによる差 | | |
| 4 | 数日後の IndexedDB の残存 | | |

検証環境: iPhone（機種） / iOS（バージョン）

## 技術構成

| 項目 | 採用 | 理由 |
|---|---|---|
| ビルド | Vite | 設定が少なく、PWA プラグインのエコシステムがある |
| UI | React + TypeScript | 型でデータモデルを固定し、状態を hooks だけで管理できる規模に収める |
| 状態管理 | React の state / hooks のみ | 1画面で完結し、共有する状態が少ないため外部ライブラリは不要 |
| 永続化 | IndexedDB | 1000 件規模のテキストとインデックス検索が必要で、localStorage では容量・同期 API の点で不向き |
| PWA | vite-plugin-pwa | Service Worker とマニフェスト、iOS 向け PNG アイコンの生成をまとめて扱える |
| 配信 | GitHub Pages + GitHub Actions | HTTPS が標準で、`main` への push で自動デプロイできる |

IndexedDB のラッパー（自作か `idb` か）は Phase 1 で決め、理由をコミットメッセージに残す。

## 開発

```bash
npm install
npm run dev      # http://localhost:5173/clipboard-history-pwa/
npm run build
npm run preview  # ビルド結果を Service Worker 込みで確認
```

`vite.config.ts` の `REPO_NAME` は GitHub のリポジトリ名と一致させる（GitHub Pages の配信パスになるため）。
