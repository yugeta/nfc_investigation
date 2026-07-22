export class CompatibilityChecker {
  static instance;

  static getInstance() {
    if (!CompatibilityChecker.instance) {
      CompatibilityChecker.instance = new CompatibilityChecker();
    }
    return CompatibilityChecker.instance;
  }

  evaluate() {
    const hasNdefReader = "NDEFReader" in window;
    const isSecure = window.isSecureContext;

    if (!isSecure && !hasNdefReader) {
      return {
        ok: false,
        isSecure,
        hasNdefReader,
        message: "この環境はWeb NFC未対応です。HTTPS配信のAndroid対応ブラウザでアクセスしてください。"
      };
    }

    if (!isSecure) {
      return {
        ok: false,
        isSecure,
        hasNdefReader,
        message: "Secure Contextではありません。HTTPSまたはlocalhostでアクセスしてください。"
      };
    }

    if (!hasNdefReader) {
      return {
        ok: false,
        isSecure,
        hasNdefReader,
        message: "このブラウザはWeb NFCに未対応です。Androidの対応ブラウザを利用してください。"
      };
    }

    return {
      ok: true,
      isSecure,
      hasNdefReader,
      message: ""
    };
  }
}
