require("dotenv").config();
const { rmSync } = require("fs");

module.exports = function (eleventyConfig) {
  // ビルド前に _site をクリア（削除された microCMS 記事の HTML が残らないようにする）
  eleventyConfig.on("eleventy.before", () => {
    rmSync("_site", { recursive: true, force: true });
  });

  // JS はそのままコピー（ビルド時に _site/js/ へ）
  eleventyConfig.addPassthroughCopy("src/js");

  // ==========================================
  // microCMS からブログ記事を取得（kai.microcms.io）
  // 環境変数が無い場合はスキップして空配列を返す（ビルドは成功する）
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
      console.log(`✅ microCMS から ${data.contents.length} 件の記事を取得しました。`);
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
