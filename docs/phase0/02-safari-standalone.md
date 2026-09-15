# Phase 0 検証ログ 02: Safari（ホーム画面から起動）

検証ページの「Markdown でコピー」出力をそのまま保存したもの。

- 実施日: 2026-09-15
- 端末: iPhone / iOS 26.6.1
- 起動方法: Safari の「ホーム画面に追加」から起動（`standalone`）
- User-Agent の `iPhone OS 18_7` は Safari 26 が OS バージョンを固定して送っている値で、実際の iOS バージョンは `Version/26.6.1` のほう
- 操作: 読み取りでは確認 UI の「ペースト」を押した

| 項目 | 値 |
|---|---|
| ビルド | 2026-09-15T12:41:17.284Z |
| User-Agent | Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.6.1 Mobile/15E148 Safari/604.1 |
| 表示モード | standalone |
| isSecureContext | true |
| clipboard.readText | true |
| clipboard.read | true |
| clipboard.writeText | true |
| indexedDB | true |
| storage.persisted() | true |
| storage 使用量/上限 | 337.5 KB / 39321.6 MB |

| 日時 | 表示モード | 種別 | 内容 |
|---|---|---|---|
| 2026/9/15 22:13:44 | standalone | test | storage.persist(): true |
| 2026/9/15 22:13:40 | standalone | manual | 手動記録 |
| 2026/9/15 22:13:38 | standalone | test | writeText(): 成功 (14ms) "phase0 2026-09-15T13:13:38.826Z" |
| 2026/9/15 22:13:24 | standalone | test | writeText(): 成功 (22ms) "phase0 2026-09-15T13:13:24.805Z" |
| 2026/9/15 22:13:20 | standalone | test | 1秒待ってから readText(): 失敗 (1002ms) NotAllowedError: The request is not allowed by the user agent or the platform in the current context, possibly because the user denied permission. |
| 2026/9/15 22:13:17 | standalone | test | 1秒待ってから readText(): 失敗 (1008ms) NotAllowedError: The request is not allowed by the user agent or the platform in the current context, possibly because the user denied permission. |
| 2026/9/15 22:13:13 | standalone | test | read(): 成功 (1253ms) items=1 [text/plain, text/html] length=8 "特に知りたいのは" |
| 2026/9/15 22:13:10 | standalone | test | readText(): 成功 (1012ms) length=8 "特に知りたいのは" |

## この回で分かったこと

- **確認 UI で「ペースト」を押すと本文を取得できる。** 所要時間の約1秒は、確認 UI の表示からタップまでの時間。
- **ユーザー操作から `await` を挟むと拒否されるのは、ホーム画面 PWA でも同じ**（ログ 01 の Chrome と一致）。
- **`read()` では `text/html` も取れた。** ただし本アプリはテキストのみを扱うので、`readText()` で足りる。
- **ホーム画面 PWA では `storage.persist()` が `true` になった。** ブラウザタブ（ログ 01）では `false` だった。
