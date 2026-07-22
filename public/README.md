# public 配下の実装（ブラウザ + PHP）

このディレクトリには、Web NFC検証用の最小PoCを配置しています。

## ファイル構成
- index.html: 読取/書込UI
- assets/app.js: Web NFC処理とAPI送信
- assets/style.css: 画面スタイル
- api/log_scan.php: 読取/書込イベントのログ保存API
- storage/scan-events.ndjson: 実行時に自動生成されるログ

## 実行手順
1. nfcルートでサーバー起動
2. docker compose up --build
3. AndroidのWeb NFC対応ブラウザでアクセス
4. 読み取り開始または書き込み実行

補足（composeを使わない場合）:
- docker run --rm -it -p 8000:8000 -v "$PWD":/app -w /app php:8.3-cli php -S 0.0.0.0:8000 -t public

## できること
- NDEFタグの読み取り
- NDEFテキスト書き込み
- 読取/書込イベントのサーバーログ保存

## できないこと・制約
- iOS SafariでのWeb NFC利用
- 低レベルAPDUや機密領域アクセス
- すべてのICカードへの任意書き込み

## 注意
- マイナンバーカードなど機微情報を含む媒体は法令順守で扱う。
- 検証ログに個人情報を残さない。

## 詳細ドキュメント
- docs/03-poc/web-nfc-php-operation-guide.md
