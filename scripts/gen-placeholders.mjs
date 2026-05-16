// Generates the 10 showcase placeholder renders as JPGs.
// Each is a stylised architectural scene rasterised from SVG via sharp.
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const OUT = join(ROOT, "public", "showcase");

const W = 1600;
const H = 900;

/**
 * @typedef {Object} Style
 * @property {string} file
 * @property {[string,string]} sky      gradient top/bottom
 * @property {string} ground
 * @property {string} terrain
 * @property {string} wall
 * @property {string} wall2
 * @property {string} roof
 * @property {string} glow
 * @property {"gable"|"flat"|"shed"|"hip"} roofType
 * @property {number} stories
 */

/** @type {Style[]} */
const styles = [
  { file: "showcase-modern-farmhouse.jpg", sky: ["#26211a", "#5a4129"], ground: "#171410", terrain: "#241d15", wall: "#2c2620", wall2: "#3a3128", roof: "#100e0b", glow: "#e8a878", roofType: "gable", stories: 1 },
  { file: "showcase-lake-home.jpg", sky: ["#1b2630", "#3c5566"], ground: "#13201f", terrain: "#1c2e30", wall: "#2a2f33", wall2: "#39424a", roof: "#11161a", glow: "#9fc7d6", roofType: "shed", stories: 2 },
  { file: "showcase-courtyard-modern.jpg", sky: ["#221d1a", "#544235"], ground: "#161310", terrain: "#221b15", wall: "#312a24", wall2: "#423931", roof: "#0f0d0b", glow: "#d9a071", roofType: "flat", stories: 2 },
  { file: "showcase-mountain-cabin.jpg", sky: ["#1d1f28", "#445063"], ground: "#15161a", terrain: "#23262f", wall: "#2c2620", wall2: "#382f26", roof: "#101013", glow: "#cdd6e6", roofType: "gable", stories: 1 },
  { file: "showcase-coastal-cottage.jpg", sky: ["#2a2620", "#6d5640"], ground: "#1a1712", terrain: "#2a2218", wall: "#363029", wall2: "#48402f", roof: "#13110d", glow: "#f0c089", roofType: "hip", stories: 1 },
  { file: "showcase-desert-contemporary.jpg", sky: ["#2c2018", "#7a4f33"], ground: "#211711", terrain: "#33241a", wall: "#3a2f26", wall2: "#4d3e30", roof: "#16100c", glow: "#f2a766", roofType: "flat", stories: 1 },
  { file: "showcase-craftsman-bungalow.jpg", sky: ["#241d18", "#4f3a28", ], ground: "#16110d", terrain: "#241a13", wall: "#312820", wall2: "#41342a", roof: "#100c09", glow: "#dfa06c", roofType: "gable", stories: 1 },
  { file: "showcase-prairie-ranch.jpg", sky: ["#221d18", "#5b4630"], ground: "#171310", terrain: "#241c14", wall: "#2e2820", wall2: "#3d342a", roof: "#0f0c09", glow: "#e6ad77", roofType: "shed", stories: 1 },
  { file: "showcase-hillside-villa.jpg", sky: ["#1f1c22", "#4a3c4a"], ground: "#15131a", terrain: "#221d26", wall: "#302a2c", wall2: "#403838", roof: "#100e10", glow: "#d6a9c0", roofType: "flat", stories: 3 },
  { file: "showcase-urban-infill.jpg", sky: ["#1c1c20", "#3d3d48"], ground: "#141416", terrain: "#202024", wall: "#2b2a2c", wall2: "#3a393c", roof: "#0f0f10", glow: "#bcbcc8", roofType: "flat", stories: 3 },
];

function roofPath(type, x, y, w, h) {
  switch (type) {
    case "gable":
      return `<polygon points="${x - 18},${y} ${x + w / 2},${y - h} ${x + w + 18},${y}" />`;
    case "shed":
      return `<polygon points="${x - 10},${y} ${x + w + 10},${y - h} ${x + w + 10},${y}" />`;
    case "hip":
      return `<polygon points="${x - 14},${y} ${x + w * 0.28},${y - h} ${x + w * 0.72},${y - h} ${x + w + 14},${y}" />`;
    default: // flat
      return `<rect x="${x - 12}" y="${y - 14}" width="${w + 24}" height="16" />`;
  }
}

function windows(x, y, w, wallH, glow) {
  const cols = 4;
  const cw = 70;
  const ch = wallH > 230 ? 150 : 110;
  const gap = (w - cols * cw) / (cols + 1);
  let out = "";
  for (let i = 0; i < cols; i++) {
    const wx = x + gap + i * (cw + gap);
    const wy = y + wallH - ch - 46;
    out += `<rect x="${wx}" y="${wy}" width="${cw}" height="${ch}" fill="${glow}" opacity="0.82" rx="3" />`;
  }
  return out;
}

function buildSvg(s) {
  const groundY = 620;
  const wallH = 120 + s.stories * 90;
  const houseW = 720;
  const hx = (W - houseW) / 2;
  const wallTop = groundY - wallH;
  const roofH = s.roofType === "flat" ? 0 : 150;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${s.sky[0]}"/>
      <stop offset="1" stop-color="${s.sky[1]}"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.74" cy="0.26" r="0.5">
      <stop offset="0" stop-color="${s.glow}" stop-opacity="0.55"/>
      <stop offset="1" stop-color="${s.glow}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#sky)"/>
  <rect width="${W}" height="${H}" fill="url(#glow)"/>
  <circle cx="${W * 0.74}" cy="${H * 0.26}" r="64" fill="${s.glow}" opacity="0.5"/>

  <path d="M0 ${groundY - 90} Q ${W * 0.3} ${groundY - 150} ${W * 0.6} ${groundY - 80} T ${W} ${groundY - 110} V ${H} H 0 Z" fill="${s.terrain}"/>
  <rect y="${groundY}" width="${W}" height="${H - groundY}" fill="${s.ground}"/>

  <g>
    <rect x="${hx}" y="${wallTop}" width="${houseW}" height="${wallH}" fill="${s.wall}"/>
    <rect x="${hx + houseW * 0.62}" y="${wallTop + 30}" width="${houseW * 0.38}" height="${wallH - 30}" fill="${s.wall2}"/>
    <g fill="${s.roof}">${roofPath(s.roofType, hx, wallTop, houseW, roofH)}</g>
    ${windows(hx, wallTop, houseW, wallH, s.glow)}
    <rect x="${hx + houseW / 2 - 42}" y="${groundY - 150}" width="84" height="150" fill="${s.roof}" rx="3"/>
    <rect x="${hx + houseW / 2 - 30}" y="${groundY - 130}" width="60" height="110" fill="${s.glow}" opacity="0.5" rx="2"/>
  </g>

  <ellipse cx="${hx - 120}" cy="${groundY}" rx="46" ry="170" fill="${s.roof}" opacity="0.55"/>
  <ellipse cx="${hx + houseW + 130}" cy="${groundY}" rx="40" ry="140" fill="${s.roof}" opacity="0.5"/>
  <rect width="${W}" height="${H}" fill="#0b0a09" opacity="0.12"/>
</svg>`;
}

await mkdir(OUT, { recursive: true });

for (const s of styles) {
  const svg = buildSvg(s);
  const buf = await sharp(Buffer.from(svg))
    .jpeg({ quality: 82, mozjpeg: true })
    .toBuffer();
  await writeFile(join(OUT, s.file), buf);
  console.log("wrote", s.file, `${(buf.length / 1024).toFixed(0)}kb`);
}

console.log("done — 10 placeholder renders generated");
