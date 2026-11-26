/* Kaax en pixel art nadando por una franja de agua fija al fondo de la pantalla.
   Su posición horizontal sigue al scroll: arriba de la página está a la izquierda,
   al final llega a la derecha. Se dibuja en un canvas de baja resolución (22 px de alto)
   que el CSS amplía con image-rendering: pixelated. */

const canvas = document.getElementById("water");
const strip = canvas.parentElement;
const ctx = canvas.getContext("2d");
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

const H = 22;        // alto del canvas en pixeles "de juego"
const SURFACE = 15;  // fila de la superficie del agua

// Sprite de Kaax visto de lado, mirando a la derecha: caja negra con correas azules,
// cubierta blanca con el logo y el flotador blanco (las últimas filas quedan bajo el agua).
const r = (s, n) => s.repeat(n);
const SPRITE = [
  r(".", 14) + "kkkkkk" + r(".", 14),
  r(".", 14) + "k....k" + r(".", 14),
  r(".", 8) + r("K", 20) + r(".", 6),
  r(".", 8) + "Kkkkk" + "B" + r("k", 9) + "B" + "kkkK" + r(".", 6),
  r(".", 8) + "KKKKK" + "B" + r("K", 9) + "B" + "KKKK" + r(".", 6),
  r(".", 8) + "KKKKK" + "B" + r("K", 9) + "B" + "KKKK" + r(".", 6),
  r(".", 8) + "KKKKK" + "B" + r("K", 9) + "B" + "KKKK" + r(".", 6),
  r(".", 4) + r("W", 9) + "b" + r("W", 9) + "b" + r("W", 7) + r(".", 3),
  r(".", 3) + r("W", 10) + "b" + r("W", 9) + "b" + r("W", 8) + r(".", 2),
  r(".", 3) + r("W", 5) + "DD" + "W" + "DD" + r("W", 20) + ".",
  r(".", 3) + r("L", 30) + ".",
  r(".", 5) + "G" + r(".", 8) + "G" + r(".", 8) + "G" + r(".", 6) + "G" + r(".", 3),
  r(".", 3) + r("W", 29) + "..",
  "MG" + r("W", 31) + ".",
  "M." + r("L", 31) + ".",
  "MM." + r("G", 29) + "..",
];
const SW = SPRITE[0].length;
const SH = SPRITE.length;
console.assert(SPRITE.every((row) => row.length === SW), "Kaax: todas las filas del sprite deben medir lo mismo");

const PAL = {
  W: "#f3f5f4", L: "#c3cccb", G: "#7d8a8a", M: "#4a5355",
  K: "#141617", k: "#3a4144", B: "#2f8de4", b: "#2370bd", D: "#1b1d1e",
};
const WATER = { crest: "#8fe8dc", top: "#2a9a9b", body: "#16606a", deep: "#0b2f38", foam: "#e8fbf8" };

let W = 0;           // ancho del canvas en pixeles de juego
let x = 0;           // posición actual de Kaax (suavizada)
let face = 1;        // 1 = mira a la derecha, -1 = a la izquierda
let t = 0;
const foam = [];     // estela: { x, y, life }

function target() {
  const max = document.documentElement.scrollHeight - innerHeight;
  const p = max > 0 ? Math.min(1, Math.max(0, scrollY / max)) : 0;
  return p * (W - SW);
}

function resize() {
  const scale = canvas.clientHeight / H || 4;
  W = Math.ceil(canvas.clientWidth / scale);
  canvas.width = W;
  canvas.height = H;
  x = target();
}

function waveY(col) {
  return SURFACE + Math.round(Math.sin(col * 0.33 + t * 1.8) * 0.7);
}

function drawWater(alpha) {
  ctx.globalAlpha = alpha;
  for (let c = 0; c < W; c++) {
    const y = waveY(c);
    const crest = Math.sin(c * 0.33 + t * 1.8) > 0.75;
    ctx.fillStyle = crest ? WATER.crest : WATER.top;
    ctx.fillRect(c, y, 1, 1);
    ctx.fillStyle = WATER.body;
    ctx.fillRect(c, y + 1, 1, 3);
    ctx.fillStyle = WATER.deep;
    ctx.fillRect(c, y + 4, 1, H - y - 4);
  }
  ctx.globalAlpha = 1;
}

// Se pinta una sola vez por dirección, con contorno oscuro de 1 px para que el casco
// blanco se distinga también sobre las secciones claras.
function bake(flip) {
  const c = document.createElement("canvas");
  c.width = SW + 2;
  c.height = SH + 2;
  const g = c.getContext("2d");
  for (const pass of ["outline", "fill"]) {
    for (let row = 0; row < SH; row++) {
      for (let col = 0; col < SW; col++) {
        const ch = SPRITE[row][flip ? SW - 1 - col : col];
        if (ch === ".") continue;
        if (pass === "outline") {
          g.fillStyle = "#101415";
          g.fillRect(col, row + 1, 3, 1);
          g.fillRect(col + 1, row, 1, 3);
        } else {
          g.fillStyle = PAL[ch];
          g.fillRect(col + 1, row + 1, 1, 1);
        }
      }
    }
  }
  return c;
}
const SPRITES = { 1: bake(false), [-1]: bake(true) };

function drawSprite(sx, sy) {
  ctx.drawImage(SPRITES[face], sx - 1, sy - 1);
}

function frame() {
  const goal = target();
  const dx = goal - x;
  x = reduced ? goal : x + dx * 0.12;
  if (Math.abs(dx) > 0.5) face = dx > 0 ? 1 : -1;

  // Estela: espuma que sale por la popa mientras Kaax avanza.
  if (!reduced && Math.abs(dx) > 0.6) {
    const stern = face === 1 ? x + 1 : x + SW - 2;
    foam.push({ x: stern, y: SURFACE + (Math.random() < 0.5 ? 0 : 1), life: 1 });
  }

  ctx.clearRect(0, 0, W, H);
  drawWater(1);

  const sx = Math.round(x);
  const bob = reduced ? 0 : Math.round(Math.sin(t * 2.4) * 0.6);
  drawSprite(sx, SURFACE - (SH - 2) + bob);

  // El agua vuelve a pasar, semitransparente, sobre la parte sumergida del casco.
  ctx.save();
  ctx.beginPath();
  ctx.rect(sx, SURFACE + 1, SW, H);
  ctx.clip();
  drawWater(0.55);
  ctx.restore();

  for (let i = foam.length - 1; i >= 0; i--) {
    const f = foam[i];
    f.life -= 0.025;
    f.x -= face * 0.15;
    if (f.life <= 0) { foam.splice(i, 1); continue; }
    ctx.globalAlpha = f.life;
    ctx.fillStyle = WATER.foam;
    ctx.fillRect(Math.round(f.x), f.y, 1, 1);
  }
  ctx.globalAlpha = 1;

  if (!reduced) {
    t += 1 / 60;
    requestAnimationFrame(frame);
  }
}

// La franja sube en cuanto se empieza a bajar por la página.
function onScroll() {
  strip.classList.toggle("is-up", scrollY > 40);
  if (reduced) frame();
}

addEventListener("scroll", onScroll, { passive: true });
// ResizeObserver también cubre cambios de layout al cargar fuentes o rotar el teléfono.
new ResizeObserver(() => { resize(); if (reduced) frame(); }).observe(canvas);
resize();
onScroll();
frame();
