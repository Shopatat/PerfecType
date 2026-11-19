// Génère les icônes PNG de l'appli à partir d'un SVG : node outils/icones.js (besoin de Playwright).
// Icône « L'onde chromée » : cinq barres en métal poli sur le dégradé violet de l'appli, avec deux éclats.
const { chromium } = require("playwright");
const path = require("path");
const BARRES = [[105, 96], [175, 220], [241, 330], [307, 190], [377, 84]];
const ECLATS = [[404, 132, 5.2], [446, 196, 2.2]];
const svg = (echelle) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#4C1487"/><stop offset=".48" stop-color="#7422B8"/><stop offset="1" stop-color="#C043E6"/></linearGradient>
    <linearGradient id="metal" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFFFFF"/><stop offset=".42" stop-color="#E6E0EE"/><stop offset=".5" stop-color="#B2A6C4"/><stop offset=".62" stop-color="#F4F0F8"/><stop offset="1" stop-color="#CABFD8"/></linearGradient>
  </defs>
  <rect width="512" height="512" fill="url(#g)"/>
  <g transform="translate(256 256) scale(${echelle}) translate(-256 -256)">
    ${BARRES.map(([x, h]) => `<rect x="${x}" y="${256 - h / 2}" width="32" height="${h}" rx="16" fill="url(#metal)"/>`).join("")}
    ${ECLATS.map(([x, y, s]) => `<path transform="translate(${x} ${y}) scale(${s})" d="M0-10C1-3 3-1 10 0C3 1 1 3 0 10C-1 3-3 1-10 0C-3-1-1-3 0-10Z" fill="#fff"/>`).join("")}
  </g></svg>`;
(async () => {
  const b = await chromium.launch(); const p = await b.newPage();
  const dossier = process.argv[2] || path.join(__dirname, "..", "icons");
  for (const [n, size, ech] of [["icon-180.png", 180, 1], ["icon-192.png", 192, 1], ["icon-512.png", 512, 1], ["icon-512-maskable.png", 512, .8]]) {
    await p.setViewportSize({ width: size, height: size });
    await p.setContent(`<style>html,body{margin:0}svg{width:${size}px;height:${size}px;display:block}</style>${svg(ech)}`);
    await p.screenshot({ path: path.join(dossier, n) });
  }
  await b.close();
})();
