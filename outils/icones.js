// Génère les icônes PNG de l'appli à partir d'un SVG : node outils/icones.js (besoin de Playwright).
const { chromium } = require("playwright");
const path = require("path");
const svg = (pad) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#6A0F31"/><stop offset=".48" stop-color="#A3164D"/><stop offset="1" stop-color="#E0307A"/></linearGradient></defs>
  <rect width="512" height="512" fill="url(#g)"/>
  <g transform="translate(256 256) scale(${pad}) translate(-12 -12)" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round">
    <path d="M4 10v4M8 7v10M12 4v16M16 8v8M20 11v2"/>
  </g></svg>`;
(async () => {
  const b = await chromium.launch(); const p = await b.newPage();
  const out = (n) => path.join(__dirname, "..", "icons", n);
  for (const [n, size, pad] of [["icon-180.png", 180, 11], ["icon-192.png", 192, 11], ["icon-512.png", 512, 11], ["icon-512-maskable.png", 512, 8.5]]) {
    await p.setViewportSize({ width: size, height: size });
    await p.setContent(`<style>html,body{margin:0}svg{width:${size}px;height:${size}px;display:block}</style>${svg(pad)}`);
    await p.screenshot({ path: out(n) });
  }
  await b.close();
})();
