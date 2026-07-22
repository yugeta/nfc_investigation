# Web NFC PoC 運用ガイド

## 1. このシステムの概要
このPoCは、ブラウザのWeb NFC機能を使ってNFCタグの読み取り・書き込みを行い、結果をブラウザ内（localStorage）へ保存する構成です。

システム構成:
- フロントエンド: public/index.html, public/js/main.js, public/js/modules/*.js, public/css/style.css
- スタイル分割: public/css/variables.css, public/css/base.css, public/css/layout.css, public/css/components.css, public/css/states.css
- ログ保存先: localStorage（端末ブラウザ内）
- 公開基盤: GitHub Pages（静的ホスティング）

## 2. できること
- NDEFタグの読み取り
- NDEFテキスト書き込み
- NDEF URI書き込み
- NDEFテキスト + URIの同時書き込み（複数レコード）
- 読み取り/書き込みイベントのローカルログ保存
- Web NFC対応可否の画面表示

## 3. できないこと・制約
- iOS SafariでのWeb NFC利用
- 低レベルAPDU通信やセキュア領域アクセス
- すべてのICカードへの任意書き込み
- カード発行元が制限する領域へのアクセス

## 4. 前提条件
- Android端末でNFCが有効化されていること
- Web NFC対応ブラウザ（主にAndroid Chrome系）を使うこと
- GitHub Pagesの公開URLへアクセスできること

## 5. 公開手順
1. GitHubリポジトリの `Settings > Pages` を開く。
2. `Deploy from a branch` を選択し、`main` / `public` を設定する。
3. 公開URL（HTTPS）をAndroid端末ブラウザで開く。

## 6. 使い方

### 6.1 読み取り
1. 画面の「読み取り開始」を押す。
2. タグをかざす。
3. 結果欄に serialNumber、records、readAt が表示される。
4. 同時に read イベントがlocalStorageへ保存される。

### 6.2 書き込み
1. テキスト欄、URI欄のどちらか（または両方）に値を入力する。
2. 「書き込み実行」を押す。
3. 成功時に書き込み結果が表示され、続けて再読み取り確認が実行される。
4. 同時に write イベントがlocalStorageへ保存される。

補足:
- URL起動用タグを作成する場合は、URI欄に `https://...` を入力する。
- テキスト欄へURL文字列を書いただけでは、端末側でURL起動扱いにならない場合がある。

### 6.3 ログ確認
- 保存先: ブラウザのlocalStorage
- 画面の「ログをJSONで保存」で取得
- 主な項目: eventType, payload, clientTime

## 7. 媒体別の運用注意
- 購入済みNFCタグ:
  - 読取/書込の主対象。まずこの媒体で安定稼働を確認する。
- マイナンバーカード:
  - 取得情報を最小化し、機微情報は扱わない。
  - 法令・規約・ガイドライン順守を前提にする。
- ICカード式名刺:
  - 仕様依存のため、読取可否と書込可否を個別記録する。

## 8. セキュリティ・運用上の注意
- 個人情報やカード固有情報を不要にログへ残さない。
- 実証中のログはアクセス制御された場所で保管する。
- 本番運用を想定する場合はHTTPS配信を前提にする。
- ブラウザ許可ダイアログ拒否時の運用手順を決める。

## 9. よくあるつまずき
- Web NFC未対応ブラウザ:
  - 画面に「Web NFC API: NG」と表示される。
- セキュアコンテキスト要件:
  - Web NFCはHTTPSまたはlocalhost条件が必要（GitHub PagesはHTTPS）。
- 書き込み失敗:
  - タグが読み取り専用、容量不足、NDEF未対応の可能性。
- ログが残らない:
  - ブラウザのストレージ削除設定、プライベートモード利用有無を確認する。

## 10. 読み取り情報の粒度（Web NFCの制約）
Web NFCで取得できる主な情報:
- serialNumber（端末/ブラウザにより取得不可の場合あり）
- recordType、id、mediaType、encoding、lang
- レコードのバイト長、hexプレビュー、base64プレビュー
- テキスト化可能な値（text/url/mimeの一部）

Web NFCで取得しにくい情報:
- 低レベルのタグ技術詳細（専用アプリが表示する詳細情報の一部）
- セキュア領域情報やベンダー固有の管理情報
- APDUベースの詳細応答

注記:
- NFC Tools等の専用アプリは、Web NFCより低レベル層へアクセスできるため、取得粒度が高い場合がある。

## 11. 参考
- 開発手順: docs/03-poc/development-procedure.md
- 検証マトリクス: docs/01-planning/platform-card-test-matrix.md
- 検証チェック: docs/04-validation/validation-checklist.md
