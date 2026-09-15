# クリップ履歴 (Clipboard History PWA)

iOS にはクリップボードの履歴機能がない。コピーしたテキストをワンタップで端末内に保存し、後から分類・検索して取り出せる PWA。

> **現在の状態: Phase 0（実機検証）**
> 実機でクリップボード API の挙動を確認し、設計に反映した。IndexedDB が数日後も残っているかは確認待ち。
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

実機検証で分かった制約と、それに合わせた設計変更は [Phase 0 の結果](#検証を受けて変えた設計) にまとめている。

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

検証環境: iPhone / iOS 26.6.1（2026-09-15 実施）。生ログは [docs/phase0](docs/phase0) に保存している。

| # | 検証項目 | Chrome for iOS タブ（[ログ 01](docs/phase0/01-chrome-ios-browser.md)） | Safari ホーム画面 PWA（[ログ 02](docs/phase0/02-safari-standalone.md)） |
|---|---|---|---|
| 1 | `readText()` が値を返すか | 例外にはならず、空文字列が返った（直前のクリップボードの状態は未記録） | 確認 UI で「ペースト」を押すと本文が返った（約1秒） |
| 2 | 確認 UI の出方 / 拒否時の挙動 | タップから `await` を挟むと、確認 UI を出さずに `NotAllowedError` | 同左 |
| 3 | 表示モードによる差 | `storage.persist()` → `false` | `storage.persist()` → `true`。クリップボードの挙動に差は見られない |
| 4 | 数日後の IndexedDB の残存 | 確認待ち | 確認待ち |

未検証の点:

- Safari のブラウザタブでの挙動（ブラウザタブは Chrome for iOS で代用した）
- 確認 UI を「ペースト」を押さずに閉じた場合、例外になるか空文字列になるか
- 自分で `writeText()` した直後の `readText()` で、確認 UI が省略されるか

### 検証を受けて変えた設計

| 分かったこと | Phase 1 以降の設計 |
|---|---|
| タップから `await` を挟むと読み取りが拒否される | 保存ボタンの処理では、最初に同期的に `readText()` を呼ぶ。IndexedDB を開く処理などは読み取りの後に行う |
| 空の結果が例外ではなく空文字列で返ることがある | 空文字列（空白のみを含む）は「空」または「貼り付けが許可されなかった」とまとめて扱い、保存せずにその旨を表示する。`NotAllowedError` は別のメッセージで表示する |
| 永続ストレージが許可されるのはホーム画面 PWA だけ | ホーム画面から起動したときに `storage.persist()` を要求する。ブラウザタブで開いたときは、履歴が消えうることとホーム画面への追加を案内する |
| `read()` は HTML も返すが、本アプリはテキストのみを扱う | `readText()` だけを使う |

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
