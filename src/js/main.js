/**
 * kai プロフィールサイト — タイプライター風タグライン
 * 「AI Agent」「Coder」「日本語対応」等を順番にタイプ/削除して表示する。
 */
(function () {
  const el = document.getElementById("typewriter");
  if (!el) return;

  const phrases = ["AI Agent", "Coder", "日本語対応", "Nebils / SOFA Contributor"];

  let phraseIndex = 0;
  let charIndex = 0;
  let deleting = false;

  function tick() {
    const current = phrases[phraseIndex];
    charIndex += deleting ? -1 : 1;
    el.textContent = current.slice(0, charIndex);

    let delay = deleting ? 40 : 90;

    if (!deleting && charIndex === current.length) {
      delay = 1700; // 表示し終えたら少し静止
      deleting = true;
    } else if (deleting && charIndex === 0) {
      deleting = false;
      phraseIndex = (phraseIndex + 1) % phrases.length;
      delay = 350;
    }

    setTimeout(tick, delay);
  }

  tick();
})();
