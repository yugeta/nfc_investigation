# public 配下の実装（ブラウザのみ）

このディレクトリには、Web NFC検証用の最小PoCを配置しています。GitHub Pagesでそのまま公開可能です。

## ファイル構成
- index.html: 読取/書込UI
- assets/app.js: Web NFC処理とローカルログ保存
- css/style.css: import専用のスタイルエントリ
- css/*.css: 用途別に分割したスタイル群
- localStorage: 読取/書込イベントをブラウザ内に保存

## 公開手順（GitHub Pages）
1. `Settings > Pages` を開く
2. Sourceを `Deploy from a branch` に設定
3. Branchを `main`、Folderを `/public` に設定
4. 発行されたHTTPS URLへアクセス

## できること
- NDEFタグの読み取り
- NDEFテキスト書き込み
- 読取/書込イベントのブラウザ内ログ保存

## できないこと・制約
- iOS SafariでのWeb NFC利用
- 低レベルAPDUや機密領域アクセス
- すべてのICカードへの任意書き込み

## 注意
- マイナンバーカードなど機微情報を含む媒体は法令順守で扱う。
- 検証ログに個人情報を残さない。
- ログは端末のブラウザ保存領域にあるため、必要に応じてJSONエクスポートする。

## 詳細ドキュメント
- docs/03-poc/web-nfc-operation-guide.md
