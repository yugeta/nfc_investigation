# NFCタグ認識 R&D 事前準備（ブラウザ優先）

このワークスペースには、ブラウザ（JavaScript）とPHPを中心に、NFC検証を進めるための資料とPoC実装をまとめています。

## ドキュメント
- docs/README.md: フェイズ別ドキュメント目次
- docs/01-planning/rd-preparation-plan.md: 研究開発の全体準備計画
- docs/01-planning/platform-card-test-matrix.md: できること/できないこと、端末・カード別検証方針
- docs/02-design/android-nfc-system-design.md: システム構成と実装方針
- docs/03-poc/development-procedure.md: ブラウザ+PHP向けPoCの開発手順
- docs/03-poc/web-nfc-php-operation-guide.md: システム内容、使い方、注意点の運用ガイド
- docs/03-poc/poc-schedule-and-budget.md: PoCのスケジュール、体制、概算コストモデル
- docs/04-validation/validation-checklist.md: 受け入れおよび現地検証チェックリスト
- docs/05-issue/README.md: 課題管理ルールと記録テンプレート

## PoC実装
- public/index.html: Web NFCフロント（読取/書込UI）
- public/assets/app.js: Web NFC実装（読み取り、書き込み、ログ送信）
- public/api/log_scan.php: 検証ログ保存API（NDJSON）

## 推奨する次アクション
1. 顧客と対象ユースケースおよび運用制約を確認する。
2. このリポジトリのアーキテクチャ案を使って2〜4週間のPoCを開始する。
3. 実機・実タグ・実ネットワーク条件で小規模なパイロットを実施する。

## 現時点の前提
- Web NFCはAndroid版Chromeなど対応ブラウザで利用する。
- iOS Safariは本フェーズでは対象外（Web NFC未対応）として扱う。
- 検証に使用する媒体は、購入済みNFCタグ、マイナンバーカード、IC認証可能なカード式名刺。

## ローカル実行
1. nfc ルートでDocker起動する。
2. `docker compose up --build`
3. Android端末の対応ブラウザで `http://<PCのIP>:8000` を開く。
4. 終了時は `docker compose down` を実行する。

注記:
- HTTPSまたは localhost 条件が必要なため、実端末では環境に応じてHTTPS化を検討する。
