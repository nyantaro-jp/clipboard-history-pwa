# Phase 0 検証ログ 01: Chrome for iOS（ブラウザタブ）

検証ページの「Markdown でコピー」出力をそのまま保存したもの。README の結果表はこのログから要約する。

- 実施日: 2026-09-15
- 端末: iPhone / iOS 26.6.1
- ブラウザ: Chrome for iOS 143（UA に `CriOS`）。iOS の他ブラウザと同じく WebKit ベース
- 注意: この回はクリップボードに何が入っていたか、確認 UI で「ペースト」を押したかを記録していない

| 項目 | 値 |
|---|---|
| ビルド | 2026-09-15T12:41:17.284Z |
| User-Agent | Mozilla/5.0 (iPhone; CPU iPhone OS 26_6_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/143.0.7499.92 Mobile/15E148 Safari/604.1 |
| 表示モード | browser |
| isSecureContext | true |
| clipboard.readText | true |
| clipboard.read | true |
| clipboard.writeText | true |
| indexedDB | true |
| storage.persisted() | false |
| storage 使用量/上限 | 232.7 KB / 39321.6 MB |

| 日時 | 表示モード | 種別 | 内容 |
|---|---|---|---|
| 2026/9/15 21:46:00 | browser | test | storage.persist(): false |
| 2026/9/15 21:45:59 | browser | manual | 手動記録 |
| 2026/9/15 21:45:58 | browser | test | writeText(): 成功 (37ms) "phase0 2026-09-15T12:45:58.123Z" |
| 2026/9/15 21:45:57 | browser | test | 1秒待ってから readText(): 失敗 (1005ms) NotAllowedError: The request is not allowed by the user agent or the platform in the current context, possibly because the user denied permission. |
| 2026/9/15 21:45:55 | browser | test | read(): 成功 (1096ms) items=0 |
| 2026/9/15 21:45:54 | browser | test | readText(): 成功 (1445ms) 空文字列 |
| 2026/9/15 21:45:41 | browser | launch | 起動 |

## この回で分かったこと

- **ユーザー操作から `await` を挟むと読み取りは拒否される。** 1秒待ってからの `readText()` は確認 UI を出さずに `NotAllowedError` になった。保存処理では `readText()` をタップの処理の最初に同期的に呼び、IndexedDB への書き込みはその後に行う必要がある。
- **`readText()` は空の結果を例外ではなく空文字列で返すことがある。** `read()` も `items=0` で成功した。「空なので保存しない」判定は、例外処理とは別に実装する必要がある。
- **`writeText()` は確認 UI なしで成功した**（37ms）。
- **`storage.persist()` はブラウザタブでは `false`。** 永続化は保証されない。

## 未確定（再検証が必要）

- 空文字列になったのは、クリップボードが空だったからか、確認 UI を閉じたからか
- 自分で `writeText()` した直後の `readText()` で、確認 UI が出るか
- Safari 本体、およびホーム画面から起動した場合との差
