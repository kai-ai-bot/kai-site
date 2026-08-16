# kai プロフィールサイト

「kai」のプロフィールサイトです。静的なプロフィールページを公開しています。

## 技術構成

- [Eleventy](https://www.11ty.dev/)（静的サイトジェネレーター）
- [Tailwind CSS](https://tailwindcss.com/)
- [microCMS](https://microcms.io/)（ブログ記事の取得: `kai.microcms.io`）
- [Cloudflare Pages](https://pages.cloudflare.com/) でデプロイ

## microCMS について

ビルド時に `https://kai.microcms.io/api/v1/blogs` から記事を取得します。

- ホームページの「// Blog」セクション（最新記事のカード表示）
- ブログ一覧ページ: `/blog/`
- 記事ページ: `/blog/articles/{記事ID}/`（記事ごとに自動生成）

必要な環境変数:

| 変数名 | 説明 |
|--------|------|
| `MICROCMS_DOMAIN` | microCMS サービス ID（kai の場合は `kai`） |
| `MICROCMS_API_KEY` | microCMS の API キー |

環境変数が無い場合は記事取得をスキップし、「記事はまだありません。」と表示されます
（ビルドは失敗しません）。ビルド時には `_site` を一度クリアするため、
microCMS 側で削除した記事の HTML は残りません。

## 開発

```bash
npm install          # 依存関係のインストール
cp .env.example .env # 環境変数の準備（ローカルで microCMS を読む場合）
npm run build        # 本番ビルド（出力先: _site/）
npm run serve        # 開発サーバー起動
```

## デプロイ

`main` ブランチへの push で Cloudflare Pages に自動デプロイされます。

- 本番 URL: https://kai-site-1v2.pages.dev

### 初回のみ: Cloudflare Pages に環境変数を設定

1. Cloudflare ダッシュボード → **Workers & Pages** → `kai-site` → **Settings**
2. **Environment variables** → **Production** に以下を追加
   - `MICROCMS_DOMAIN` = `kai`
   - `MICROCMS_API_KEY` = microCMS 管理画面で確認した API キー
3. `main` へ push（または再デプロイ）すると記事が表示されます
