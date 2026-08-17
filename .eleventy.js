require("dotenv").config();
const fs = require("fs");
const { rmSync } = fs;
const Image = require("@11ty/eleventy-img");

module.exports = function (eleventyConfig) {
  // ビルド前に _site をクリア（削除された microCMS 記事の HTML が残らないようにする）
  eleventyConfig.on("eleventy.before", () => {
    rmSync("_site", { recursive: true, force: true });
    // Cloudflare Pages 対策: ビルド前に画像出力ディレクトリを作成
    fs.mkdirSync("./_site/img/", { recursive: true });
  });

  // JS はそのままコピー（ビルド時に _site/js/ へ）
  eleventyConfig.addPassthroughCopy("src/js");

  // ==========================================
  // 💡 [画像ローカル化] 外部URLの画像をダウンロードしてWebPに変換する関数
  // ==========================================
  async function processImage(srcUrl) {
    if (!srcUrl) return null;
    return await Image(srcUrl, {
      widths: ["auto"],
      formats: ["webp"],
      outputDir: "./_site/img/",
      urlPath: "/img/",
      cacheOptions: {
        duration: "1d",
        directory: ".cache",
        removeUrlQueryParams: false,
      },
    });
  }

  // ==========================================
  // 💡 本文の中の外部画像をダウンロードして置換する関数
  // ==========================================
  async function downloadAndReplaceImages(htmlContent) {
    if (!htmlContent) return "";

    const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/g;
    let match;
    const replacements = [];

    while ((match = imgRegex.exec(htmlContent)) !== null) {
      const originalTag = match[0];
      const remoteSrc = match[1];

      if (replacements.some((r) => r.remoteSrc === remoteSrc)) continue;

      try {
        console.log(`📸 画像を発見しました: ${remoteSrc}`);
        let metadata = await processImage(remoteSrc);

        const imageHtml = Image.generateHTML(metadata, {
          alt: "ブログ本文の画像",
          loading: "lazy",
          decoding: "async",
        });

        replacements.push({ originalTag, imageHtml, remoteSrc });
      } catch (error) {
        console.error(`❌ 画像のダウンロードに失敗しました (${remoteSrc}):`, error);
      }
    }

    let updatedHtml = htmlContent;
    for (const item of replacements) {
      updatedHtml = updatedHtml.split(item.originalTag).join(item.imageHtml);
    }

    return updatedHtml;
  }

  // ==========================================
  // microCMS からブログ記事を取得（kai.microcms.io）
  // 環境変数が無い場合はスキップして空配列を返す（ビルドは成功する）
  // 画像ローカル化付き（本文 + アイキャッチ）
  // ==========================================
  eleventyConfig.addGlobalData("blogs", async () => {
    const apiDomain = process.env.MICROCMS_DOMAIN;
    const apiKey = process.env.MICROCMS_API_KEY;

    if (!apiDomain || !apiKey) {
      console.log("⚠️ microCMS の環境変数が見つからないため、記事取得をスキップします。");
      return [];
    }

    try {
      const response = await fetch(
        `https://${apiDomain}.microcms.io/api/v1/blogs?orders=-publishedAt`,
        { headers: { "X-MICROCMS-API-KEY": apiKey } }
      );
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();

      for (let blog of data.contents) {
        // 1. 本文内の画像をローカル化
        if (blog.content) {
          blog.content = await downloadAndReplaceImages(blog.content);
        }

        // 2. アイキャッチ画像をローカル化
        if (blog.eyecatch && blog.eyecatch.url) {
          try {
            console.log(`🖼️ アイキャッチ画像を発見しました: ${blog.eyecatch.url}`);
            let eyecatchMetadata = await processImage(blog.eyecatch.url);
            blog.eyecatch.url = eyecatchMetadata.webp[0].url;
          } catch (error) {
            console.error(`❌ アイキャッチ画像のダウンロードに失敗しました (${blog.eyecatch.url}):`, error);
          }
        }
      }

      console.log(`✅ microCMS から ${data.contents.length} 件の記事を取得し、画像ローカル化を完了しました！`);
      return data.contents;
    } catch (error) {
      console.error("❌ microCMS からのデータ取得に失敗しました:", error);
      return [];
    }
  });

  // 日付を YYYY.MM.DD 形式に整形（例: 2026.08.16）
  eleventyConfig.addFilter("formatDate", (value) => {
    if (!value) return "";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return String(value);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}.${m}.${day}`;
  });

  // HTML タグを除去して冒頭 N 文字を返す（ブログ本文の抜粋用）
  eleventyConfig.addFilter("excerpt", (html, length = 100) => {
    if (!html) return "";
    const text = String(html)
      // ブロック要素の終了タグや <br> は単語が連結されないよう空白に置換
      .replace(/<\/(p|h[1-6]|li|blockquote|pre|td|div|ul|ol)>|<br[^>]*>/gi, " ")
      .replace(/<[^>]*>/g, "")
      .replace(/\s+/g, " ")
      .trim();
    return text.length > length ? `${text.slice(0, length)}…` : text;
  });

  return {
    dir: {
      input: "src",
      output: "_site",
      includes: "_includes",
    },
    templateFormats: ["njk", "md", "html"],
  };
};
