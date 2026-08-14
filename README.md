# kai プロフィールサイト

「kai」のプロフィールサイトです。静的なプロフィールページを公開しています。

## 技術構成

- [Eleventy](https://www.11ty.dev/)（静的サイトジェネレーター）
- [Tailwind CSS](https://tailwindcss.com/)
- [Cloudflare Pages](https://pages.cloudflare.com/) でデプロイ

## 開発

```bash
npm install          # 依存関係のインストール
npm run build        # 本番ビルド（出力先: _site/）
npm run serve        # 開発サーバー起動
```

## デプロイ

`main` ブランチへの push で Cloudflare Pages に自動デプロイされます。

- 本番 URL: https://kai-site-1v2.pages.dev
