# Android NFCシステム設計（参照）

## 1. ハイレベルアーキテクチャ
構成要素:
- Androidアプリ
- APIバックエンド
- データベース
- 鍵管理（署名・検証鍵）
- 監視・ログ基盤

処理フロー:
1. ユーザーがNFCタグをタップする。
2. アプリがNDEFペイロードとメタデータを読み取る。
3. アプリがローカルで基本検証（形式、時刻有効範囲）を行う。
4. アプリが署名付きリクエストをバックエンドへ送信する。
5. バックエンドがタグ署名とリプレイ制約を検証する。
6. バックエンドが業務アクションを認可し結果を返す。
7. アプリが結果表示と操作トレイル保存を行う。

## 2. タグペイロードモデル
推奨フィールド:
- tag_id: 安定した論理識別子
- version: ペイロードスキーマバージョン
- issued_at: 発行時刻
- expires_at: 有効期限
- nonce_seed: 任意のリプレイ対策シード
- signature: 正規化ペイロードに対する電子署名

留意点:
- 生のUIDを唯一の識別子として使わない。
- ペイロード正規化は決定的に保つ。

## 3. Android実装方針
推奨スタック:
- Kotlin
- minSdkは顧客端末群に合わせる（目安26以上）
- Jetpack ComposeまたはXML UI（チーム習熟度で選択）
- Coroutines + Flow
- Hilt（DI）
- Retrofit/OkHttp（API通信）

NFC読み取りモード:
- 業務アプリではReaderModeを利用する。
- 利用タグ技術（NfcA/NfcB/NfcF/NfcV/IsoDep）に合わせてフラグ調整する。

エラーハンドリング:
- 読み取り失敗、検証失敗、認証失敗、通信失敗を明確に区別する。
- オペレーターが復旧しやすいガイダンスを表示する。

## 4. バックエンド契約（最小）
POST /nfc/verify
リクエスト:
- device_id
- operator_id
- tag_payload
- app_timestamp
- request_nonce

レスポンス:
- accepted（bool）
- action_code
- reason
- server_timestamp
- audit_id

## 5. セキュリティ基準
必須要件:
- TLSおよび必要に応じた証明書ピンニング
- リクエスト署名または短命認証トークン
- nonce + TTLによるリプレイ防止
- 改ざん不能な監査ログ

推奨要件:
- 鍵ローテーション手順
- 端末侵害時の対応手順
- 異常スキャンパターンのアラート

## 6. データスキーマ（最小）
テーブル/コレクション:
- tags（tag_id, status, issued_at, expires_at, owner_group）
- scan_events（event_id, operator_id, device_id, tag_id, result, ts）
- action_events（action_id, event_id, action_code, result, ts）
- security_events（type, detail, ts）

## 7. テスト戦略
技術テスト:
- ペイロードパーサーとバリデータの単体テスト
- verify APIの結合テスト
- ピーク同時スキャンを想定した負荷試験

現地テスト:
- 複数の端末モデル
- タグ角度・距離のばらつき
- 低品質ネットワークと機内モード復帰
- 高速連続タップと重複防止
