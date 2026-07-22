# src 配下の実装について

このディレクトリには、Android NFC PoC向けの最小実装サンプルを配置しています。

## 含まれる内容
- `src/main/AndroidManifest.xml`
- `src/main/res/layout/activity_main.xml`
- `src/main/kotlin/jp/yugeta/nfcpoc/MainActivity.kt`
- `src/main/kotlin/jp/yugeta/nfcpoc/NfcSessionManager.kt`

## 実装できること
- NFCタグの検出
- NDEFテキストの読み取り
- NDEFテキストの書き込み（対応タグのみ）
- タグ技術一覧とタグIDの表示

## 使い方
1. Android Studioでアプリプロジェクトを作成する。
2. 上記ファイルを対応パスに配置する。
3. 実機でNFCを有効化してアプリを起動する。
4. READ/WRITEモードを切り替えてタグをタップする。

## 注意
- マイナンバーカードなど、媒体により書き込み不可または読み取り制限があります。
- 検証ログには個人情報を保存しない運用にしてください。
