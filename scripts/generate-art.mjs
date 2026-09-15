import { mkdirSync, writeFileSync } from "node:fs";
import { INITIAL_PROPERTIES, CATEGORIES } from "../js/data.js";
mkdirSync("assets/properties", { recursive: true });
mkdirSync("assets/categories", { recursive: true });
const brand = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><circle cx="34" cy="24" r="17" fill="#edb653"/><path d="M7 54V32h13v22h5V23h13v31h5V37h14v17Z" fill="#123e3c"/><path d="M29 29h5m-5 8h5m-5 8h5M11 39h5m31 5h6" stroke="#fff9ec" stroke-width="3"/></svg>`;
writeFileSync("assets/solari-mark.svg", brand);
function scene(category, n) {
  const sky = ["#dbe6df", "#eadfcc", "#d6e4e6", "#e8dfd3"][n % 4],
    wall = ["#f7edda", "#e3c9a7", "#e9e2cf", "#f5dfba"][n % 4];
  const glass = ["#3e6867", "#477a83", "#54706c", "#4b7778"][n % 4];
  let art = "";
  const window = (x, y, w = 22, h = 28) =>
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${glass}"/><path d="M${x + w / 2} ${y}v${h}" stroke="#b8c9bc" stroke-width="2"/>`;
  const tree = (x, y, s = 1) =>
    `<g transform="translate(${x} ${y}) scale(${s})"><path d="M0 0V-63" stroke="#705b43" stroke-width="6"/><ellipse cy="-63" rx="23" ry="37" fill="#527467"/><ellipse cx="-9" cy="-70" rx="13" ry="24" fill="#6f8e73"/></g>`;
  if (category === "Terreni") {
    art = `<path d="M0 190Q90 ${90 + n * 9} 260 185T600 172V360H0Z" fill="#94ab7d"/><path d="M0 254 260 174 600 269V360H0Z" fill="#b6bd84"/><path d="m160 360 173-146 176 51-100 95" fill="#d3bc82"/><g stroke="#ebddb4" stroke-width="3">${[0, 1, 2, 3, 4].map((i) => `<path d="m${180 + i * 43} 360 ${143 - i * 6} -${130 - i * 8}"/>`).join("")}</g><path d="M0 275q190-95 292-10t308-34" fill="none" stroke="#eee3c5" stroke-width="14"/><path d="m${90 + n * 25} 230v-39h55v39" fill="${wall}"/><path d="m${78 + n * 25} 192 40-27 40 27Z" fill="#7a6651"/>${tree(475, 263, 1.15)}${tree(510, 277, 0.75)}`;
  } else if (category === "Appartamenti") {
    const x = 137 + n * 8,
      y = 77 + n * 13;
    art = `<path d="M${x + 236} ${y + 22} 427 ${y + 64}v209l-54-16Z" fill="#b5a38b"/><rect x="${x}" y="${y + 22}" width="236" height="${252 - y}" fill="${wall}"/><rect x="${x - 8}" y="${y + 13}" width="253" height="15" fill="#61736b"/>${[0, 1, 2].map((r) => [0, 1, 2, 3].map((c) => window(x + 21 + c * 54, y + 43 + r * 49, 29, 31)).join("")).join("")}<g stroke="#8b8c77" stroke-width="3">${[0, 1, 2].map((r) => `<path d="M${x + 12} ${y + 78 + r * 49}h210m-210 7h210"/>`).join("")}</g><rect x="${x + 98}" y="237" width="40" height="52" fill="#284c4a"/>${tree(ninety(n), 288, 1.1)}${tree(477, 287, 0.95)}`;
  } else if (category === "Negozi") {
    art = `<path d="m128 145 44-28h278l-36 28Z" fill="#71847a"/><path d="M412 145 450 117v153l-38 24Z" fill="#b5a38b"/><rect x="128" y="145" width="284" height="149" fill="${wall}"/><rect x="145" y="158" width="249" height="26" fill="#214e49"/><path d="M200 171h142" stroke="#e9d8af" stroke-width="4"/><rect x="145" y="211" width="168" height="68" fill="${glass}"/><path d="M229 211v68" stroke="#d1dfcf" stroke-width="4"/><rect x="329" y="211" width="48" height="83" fill="#315b58"/><path d="m138 187-12 25h282l-14-25Z" fill="#d99559"/>${[0, 1, 2, 3, 4, 5, 6].map((i) => `<path d="m${144 + i * 38} 187-6 25h18l3-25Z" fill="#f6e9ca"/>`).join("")}<rect x="86" y="257" width="28" height="39" rx="3" fill="#b9815b"/>${tree(485, 293, 1.1)}`;
  } else if (category === "Uffici") {
    const y = n === 2 ? 38 : 72 + n * 12;
    art = `<path d="m180 ${y} 53 24v247l-53-15Z" fill="#294c4b"/><rect x="233" y="${y + 24}" width="158" height="${267 - y}" fill="${glass}"/><path d="m180 ${y} 158-7 53 31H233Z" fill="#bbc6b7"/>${[0, 1, 2, 3, 4, 5].map((r) => `<path d="M239 ${y + 41 + r * 36}h145" stroke="#bfd1c2" stroke-width="6"/>`).join("")}<path d="M270 ${y + 24}v267m41-267v267m42-267v267" stroke="#cbd5c6" stroke-width="3"/><rect x="120" y="212" width="118" height="79" fill="${wall}"/>${window(138, 227, 77, 46)}${tree(452, 292, 0.95)}`;
  } else {
    art = `<path d="m128 174 132-83 134 83Z" fill="#68776a"/><path d="m150 170 110-67 110 67v119H150Z" fill="${wall}"/><rect x="332" y="204" width="111" height="85" fill="#cdb89a"/><path d="m321 206 65-47 72 47Z" fill="#6b7769"/>${window(184, 187, 44, 54)}${window(290, 187, 44, 54)}${window(354, 222, 67, 42)}<rect x="241" y="213" width="36" height="76" fill="#315750"/><path d="m231 292-34 55h120l-29-55Z" fill="#e7d8b9"/><ellipse cx="404" cy="324" rx="88" ry="19" fill="#8bb0ab"/><ellipse cx="404" cy="320" rx="88" ry="19" fill="#b2ceca"/>${tree(ninety(n) - 5, 287, 1.1)}${tree(490, 290, 0.85)}`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 360"><rect width="600" height="360" fill="${sky}"/><circle cx="${465 - n * 46}" cy="${72 + n * 8}" r="${33 + n * 4}" fill="#efc779"/><path d="M0 188h37v-38h25v38h28v-61h45v61h316v-27h41v27h29v-47h43v47h36v172H0Z" fill="#bacac0" opacity=".5"/><path d="M0 285h600v75H0Z" fill="#b0bfa7"/><ellipse cx="302" cy="300" rx="210" ry="24" fill="#809a88" opacity=".27"/>${art}<path d="M0 345h600" stroke="#f6f0df" stroke-width="3"/></svg>`;
}
function ninety(n) {
  return 87 + n * 7;
}
for (const p of INITIAL_PROPERTIES) {
  const n = INITIAL_PROPERTIES.filter(
    (x) => x.categoria === p.categoria,
  ).indexOf(p);
  writeFileSync(`assets/properties/${p.id}.svg`, scene(p.categoria, n));
}
CATEGORIES.forEach((c, i) =>
  writeFileSync(`assets/categories/${i}.svg`, scene(c, 1)),
);
console.log(
  "Generated 20 unique property illustrations, 5 category scenes and brand mark.",
);
