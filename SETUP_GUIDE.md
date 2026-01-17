# 楽天証券 ポートフォリオマネージャー v6.0.0
# API設定ガイド

## 📋 新機能
- **決算日自動取得**: Finnhub APIから米国株の決算日を自動取得

---

## 🔧 セットアップ手順

### Step 1: Finnhub APIキーを取得（無料）

1. https://finnhub.io/ にアクセス
2. 「Get free API key」をクリック
3. メールアドレスで登録（Googleログインも可）
4. ダッシュボードでAPIキーをコピー

**無料枠**: 60回/分、月間制限なし

---

### Step 2: ファイルをGitHubにアップロード

以下のファイル構成でリポジトリを更新:

```
rakuten-portfolio-manager/
├── api/
│   └── earnings.js    ← NEW!
├── app.html           ← 更新
├── vercel.json        ← NEW!
├── index.html
└── downloads/
```

---

### Step 3: Vercelで環境変数を設定

1. https://vercel.com にアクセス
2. プロジェクト「rakuten-portfolio-manager」を開く
3. 「Settings」タブをクリック
4. 左メニュー「Environment Variables」をクリック
5. 以下を追加:

| Name | Value |
|------|-------|
| `FINNHUB_API_KEY` | `あなたのAPIキー` |

6. 「Save」をクリック

---

### Step 4: 再デプロイ

1. 「Deployments」タブを開く
2. 最新のデプロイの「...」メニュー → 「Redeploy」

---

## ✅ 動作確認

1. https://rakuten-portfolio-manager.vercel.app/app.html にアクセス
2. CSVをドラッグ&ドロップ
3. 「決算」タブを開く
4. 「✅ X銘柄の決算日を取得しました」と表示されればOK！

---

## 🔍 トラブルシューティング

### 「API key not configured」エラー
→ Vercelの環境変数が設定されていません。Step 3を確認してください。

### 決算日が表示されない
→ Finnhubに登録されていない銘柄の可能性があります。主要銘柄はフォールバックで表示されます。

### 無料枠を超過した場合
→ 60回/分の制限に達した場合、一時的にエラーになります。数分待ってからリロードしてください。

---

## 📊 対応状況

| 項目 | 状況 |
|------|------|
| 米国株決算日 | ✅ 自動取得 |
| 日本株決算日 | ❌ 未対応（無料APIなし） |

日本株は決算発表日を無料で取得できるAPIがないため、現在は対象外です。
