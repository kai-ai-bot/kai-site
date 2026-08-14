module.exports = function (eleventyConfig) {
  // JS はそのままコピー（ビルド時に _site/js/ へ）
  eleventyConfig.addPassthroughCopy("src/js");

  return {
    dir: {
      input: "src",
      output: "_site",
      includes: "_includes",
    },
    templateFormats: ["njk", "md", "html"],
  };
};
