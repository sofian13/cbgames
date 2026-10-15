/**
 * Yeux en spirale (secrets : « accros » au Rejouer, accueil secoué en tous sens = « tournis »).
 * Posés hors React, pour quelques secondes, sur les blobs VISIBLES (et proches) d'un conteneur (16 au plus) :
 * - blobs SVG repérés (ZBlob, persos « Ma bande ») : le groupe des yeux d'origine ([data-eyes]) est masqué
 *   et de gros yeux en spirale sont posés au-dessus du visage ([data-eyes-top], sous les cheveux / chapeaux),
 *   quel que soit le style d'yeux (ronds, points, arcs rieurs, étoiles…). Yeux cachés par des lunettes
 *   noires / un bandeau : spirale blanche dessinée sur le verre ;
 * - autres SVG 120×120 : spirale posée sur chaque blanc d'œil (cercle blanc de la zone des yeux) ;
 * - blobs des jeux (Mascot) : classe « zz-spiral » sur le conteneur, spirale en CSS (.mascot-eye::after) ;
 * - petites étoiles qui tournent au-dessus de la tête, et (option) le blob titube (Web Animations sur
 *   `translate` / `rotate` / `scale` : le gigotement CSS, en `transform`, continue dessous).
 * Rien n'est modifié dans les composants : au retrait, le DOM redevient exactement comme avant.
 */

const NS = "http://www.w3.org/2000/svg";
const INK = "#1A0B33";
const MAX_BLOBS = 16;
/** Étoiles seulement au-dessus des blobs assez grands (sinon c'est du bruit) */
const STARS_MIN_PX = 44;

type Anchor = { x: number; y: number; r: number; lens: boolean };

const reduced = () => typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Spirale « dessin animé » : un ruban plein qui s'épaissit du centre vers le bord (≈ 2,3 tours),
 * bout arrondi. Rayon 1, centrée en 0,0 (mise à l'échelle par le groupe). Calculée une seule fois.
 */
let spiralCache: string | undefined;
function spiralD(): string {
  if (spiralCache) return spiralCache;
  const turns = 2.3, steps = 120, R = 0.86, w0 = 0.035, w1 = 0.13;
  const out: string[] = [], inn: string[] = [];
  let ex = 0, ey = 0, eh = 0, ea = 0;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const a = t * turns * Math.PI * 2;
    const k = R * Math.pow(t, 0.92);
    const h = w0 + (w1 - w0) * t;
    const c = Math.cos(a), s = Math.sin(a);
    out.push(`${((k + h) * c).toFixed(3)} ${((k + h) * s).toFixed(3)}`);
    inn.push(`${(Math.max(0, k - h) * c).toFixed(3)} ${(Math.max(0, k - h) * s).toFixed(3)}`);
    if (i === steps) { ex = k * c; ey = k * s; eh = h; ea = a; }
  }
  // Bout arrondi : demi-cercle du bord extérieur vers le bord intérieur
  const ix = (ex - eh * Math.cos(ea)).toFixed(3), iy = (ey - eh * Math.sin(ea)).toFixed(3);
  spiralCache = `M${out.join(" L")} A${eh.toFixed(3)} ${eh.toFixed(3)} 0 0 1 ${ix} ${iy} L${inn.reverse().join(" L")} Z`;
  return spiralCache;
}

const STAR = (() => {
  const p: string[] = [];
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const r = i % 2 ? 0.46 : 1;
    p.push(`${(Math.cos(a) * r).toFixed(3)} ${(Math.sin(a) * r).toFixed(3)}`);
  }
  return `M${p.join(" L")}Z`;
})();

function el<K extends keyof SVGElementTagNameMap>(tag: K, attrs: Record<string, string | number>): SVGElementTagNameMap[K] {
  const n = document.createElementNS(NS, tag);
  for (const k in attrs) n.setAttribute(k, String(attrs[k]));
  return n;
}

const onScreen = (e: Element, margin = 0) => {
  const r = e.getBoundingClientRect();
  return r.width > 0 && r.bottom > -margin && r.top < innerHeight + margin && r.right > 0 && r.left < innerWidth;
};

/** Boîte d'un élément dans le repère de son parent (seul l'attribut transform compte, pas le CSS animé). */
function boxIn(n: SVGGraphicsElement): DOMRect | null {
  try {
    const b = n.getBBox();
    const m = n.transform?.baseVal?.consolidate()?.matrix;
    if (!m) return b;
    const xs: number[] = [], ys: number[] = [];
    for (const [x, y] of [[b.x, b.y], [b.x + b.width, b.y], [b.x, b.y + b.height], [b.x + b.width, b.y + b.height]]) {
      xs.push(m.a * x + m.c * y + m.e);
      ys.push(m.b * x + m.d * y + m.f);
    }
    const x0 = Math.min(...xs), y0 = Math.min(...ys);
    return new DOMRect(x0, y0, Math.max(...xs) - x0, Math.max(...ys) - y0);
  } catch {
    return null;
  }
}

/** Position des yeux d'un perso : son blanc d'œil s'il en a un, sinon la place standard des yeux. */
function anchorsFromEyes(eyes: Element): [Anchor, Anchor] {
  const DEF = [{ x: 42, y: 57, r: 14 }, { x: 78, y: 57, r: 14 }];
  // Yeux cachés (lunettes noires, cache-œil) : sur le verre
  const LENS: Anchor[] = [{ x: 41, y: 55.5, r: 9, lens: true }, { x: 79.5, y: 55.5, r: 9, lens: true }];
  const got: (Anchor | null)[] = [null, null];
  for (const child of Array.from(eyes.children) as SVGGraphicsElement[]) {
    const b = boxIn(child);
    if (!b || !b.width) continue;
    if (b.width > 44) {
      // Un seul groupe pour les deux yeux (croix d'éliminé…)
      got[0] ??= { ...DEF[0], lens: false };
      got[1] ??= { ...DEF[1], lens: false };
      continue;
    }
    const side = b.x + b.width / 2 < 60 ? 0 : 1;
    const white = Array.from(child.querySelectorAll("circle")).find((c) => c.getAttribute("fill") === "#fff" && Number(c.getAttribute("r")) >= 8);
    got[side] = white
      ? { x: +white.getAttribute("cx")!, y: +white.getAttribute("cy")!, r: Math.min(17, Math.max(12, +white.getAttribute("r")!)), lens: false }
      : { ...DEF[side], lens: false };
  }
  return [got[0] ?? LENS[0], got[1] ?? LENS[1]];
}

/** Un œil en spirale (repère 120×120). dir : sens de rotation (les deux yeux tournent en sens contraire). */
function spiralEye(a: Anchor, dir: 1 | -1, i: number): SVGGElement {
  const g = el("g", { class: "zz-dz-eye", transform: `translate(${a.x} ${a.y})` });
  const pop = el("g", { class: "zz-dz-pop" });
  pop.style.animationDelay = `0ms, ${300 + i * 90}ms`;
  const spin = el("g", { class: dir > 0 ? "zz-dz-spin" : "zz-dz-spin is-ccw" });
  spin.style.animationDelay = `${-i * 137}ms`;
  const r = a.r;
  if (a.lens) {
    // Sur un verre noir : spirale blanche cernée d'encre (lisible sur tous les fonds)
    spin.append(
      el("circle", { r, fill: "none" }),
      el("path", { d: spiralD(), transform: `scale(${r})`, fill: "#fff", stroke: INK, "stroke-width": 1.6 / r, "paint-order": "stroke", "stroke-linejoin": "round" }),
    );
    pop.append(spin);
  } else {
    const ring = Math.max(1.6, r * 0.12);
    pop.append(
      el("ellipse", { cx: 0, cy: 2.4, rx: r + 0.6, ry: r + 0.6, fill: INK, opacity: 0.28 }),
      el("circle", { r: r + 0.6, fill: "#fff", stroke: INK, "stroke-width": ring }),
    );
    spin.append(
      el("circle", { r: r - ring / 2, fill: "none" }),
      el("path", { d: spiralD(), transform: `scale(${r - ring * 0.2})`, fill: INK }),
    );
    // Reflet fixe (ne tourne pas) : l'œil reste « mouillé », très cartoon
    pop.append(spin, el("ellipse", { cx: -r * 0.42, cy: -r * 0.46, rx: r * 0.2, ry: r * 0.13, transform: `rotate(-35 ${-r * 0.42} ${-r * 0.46})`, fill: "#fff", opacity: 0.9 }));
  }
  g.append(pop);
  return g;
}

/** Haut de la tête (chapeau, couronne, cheveux compris) : les éléments dessinés après le visage. */
function headTop(svg: SVGSVGElement, top: Element | null): number {
  let y = 14;
  let n: Element | null = top;
  while (n && n.parentElement !== (svg as Element)) n = n.parentElement;
  for (n = n?.nextElementSibling ?? null; n; n = n.nextElementSibling) {
    const b = boxIn(n as SVGGraphicsElement);
    // Seulement ce qui est posé sur la tête (pas une goutte ou un « z » sur le côté)
    if (b && b.width && b.x < 92 && b.x + b.width > 28) y = Math.min(y, b.y);
  }
  return Math.max(-22, y);
}

/** Petites étoiles qui tournent en ellipse au-dessus de la tête. */
function stars(svg: SVGSVGElement, cy: number, px: number, anims: Animation[], still: boolean): SVGGElement {
  const g = el("g", { class: "zz-dz-stars" });
  const u = 120 / px; // unités SVG par pixel écran
  const base = Math.min(15, Math.max(6, (px >= 90 ? 10 : 8) * u));
  const rx = 31, ry = 6.5 + base * 0.15;
  // Petits blobs serrés (la bande) : 2 étoiles, sinon 3
  const kinds = [
    { k: 1, fill: "#FFD23F" },
    { k: 0.78, fill: "#FFF3A6" },
    { k: 0.9, fill: "#FFD23F" },
  ].slice(0, px >= 90 ? 3 : 2);
  kinds.forEach((s, i) => {
    const star = el("path", { d: STAR, fill: s.fill, stroke: INK, "stroke-width": (1.7 * u) / (base * s.k), "stroke-linejoin": "round", "paint-order": "stroke" });
    const holder = el("g", {});
    holder.append(star);
    g.append(holder);
    const phase = (i / kinds.length) * Math.PI * 2;
    const at = (t: number) => {
      const a = phase + t * Math.PI * 2;
      const depth = (Math.sin(a) + 1) / 2; // 1 = devant (en bas de l'ellipse)
      const sc = base * s.k * (0.6 + 0.5 * depth);
      return {
        transform: `translate(${(60 + rx * Math.cos(a)).toFixed(2)}px, ${(cy + ry * Math.sin(a)).toFixed(2)}px) rotate(${(t * 360 + i * 40).toFixed(1)}deg) scale(${sc.toFixed(3)})`,
        opacity: (0.8 + 0.2 * depth).toFixed(2),
      };
    };
    if (still || typeof holder.animate !== "function") {
      const f = at(0.12);
      holder.style.transform = f.transform;
      return;
    }
    const frames = Array.from({ length: 17 }, (_, j) => at(j / 16));
    holder.style.transform = frames[0].transform;
    anims.push(holder.animate(frames, { duration: 1150, iterations: Infinity, easing: "linear" }));
    // Apparition (pop) : sur l'étoile elle-même pour ne pas se mélanger à l'orbite
    anims.push(star.animate(
      [{ transform: "scale(0)" }, { transform: "scale(1.35)", offset: 0.6 }, { transform: "scale(1)" }],
      { duration: 420, delay: 80 + i * 110, easing: "ease-out", fill: "backwards" },
    ));
  });
  return g;
}

/**
 * Le blob titube comme un ivre : il penche d'un côté puis de l'autre (amplitude qui monte puis retombe),
 * pivot au sol, s'écrase un peu à chaque passage au milieu, dérive de côté. 40 images calculées, aucune
 * par image en JS. `rotate` / `translate` / `scale` : n'écrase pas le gigotement / le saut (en `transform`).
 */
function stagger(node: HTMLElement, i: number, ms: number, anims: Animation[]) {
  if (typeof node.animate !== "function") return;
  const cs = getComputedStyle(node);
  const hgt = node.offsetHeight || node.getBoundingClientRect().height;
  const oy = parseFloat(cs.transformOrigin.split(" ")[1] ?? "") || hgt / 2;
  const h = hgt * 0.92 - oy; // du centre de transformation au pivot (le « sol » du blob)
  const k = i % 2 ? -1 : 1;
  const delay = (i % 4) * 70;
  const dur = Math.max(600, ms - delay);
  const N = 40;
  const frames: Keyframe[] = [];
  for (let j = 0; j <= N; j++) {
    const t = j / N;
    // Enveloppe : monte vite, tient, retombe doucement à zéro
    const env = Math.min(1, t / 0.12) * Math.pow(1 - t, 0.7);
    const ph = t * Math.PI * 2 * 2.3 + (i * 0.9);
    const th = k * 15 * env * Math.sin(ph);
    const sw = Math.abs(Math.cos(ph)); // 1 = passage au milieu
    const sy = 1 - 0.07 * env * sw;
    const sx = 1 + 0.06 * env * sw;
    const drift = k * 5 * env * Math.sin(t * Math.PI * 2 * 1.1 + i);
    const r = (th * Math.PI) / 180;
    const tx = h * sy * Math.sin(r) + drift;
    const ty = h - h * sy * Math.cos(r);
    frames.push({
      translate: `${tx.toFixed(2)}px ${ty.toFixed(2)}px`,
      rotate: `${th.toFixed(2)}deg`,
      scale: `${sx.toFixed(4)} ${sy.toFixed(4)}`,
    });
  }
  frames[0] = { translate: "0px 0px", rotate: "0deg", scale: "1 1" };
  frames[N] = { translate: "0px 0px", rotate: "0deg", scale: "1 1" };
  anims.push(node.animate(frames, { duration: dur, delay, easing: "linear" }));
}

export interface SpiralOpts {
  /** Le blob titube (accueil secoué) */
  wobble?: boolean;
  /** Étoiles au-dessus de la tête (défaut : oui) */
  stars?: boolean;
}

/**
 * Ajoute les yeux en spirale (et les étoiles) sur les blobs visibles de `root` ; renvoie la fonction
 * qui retire tout (appelée toute seule après `ms`).
 */
export function spiralEyes(root: Element, ms = 3000, opts: SpiralOpts = {}): () => void {
  const added: Element[] = [];
  const marked: Element[] = [];
  const anims: Animation[] = [];
  const still = reduced();
  root.classList.add("zz-spiral");

  // Blobs visibles ET ceux juste au-dessus/en dessous (on défile souvent encore un peu après le
  // déclenchement : tout le monde doit être étourdi), les visibles d'abord puis les plus grands
  const svgs = Array.from(root.querySelectorAll<SVGSVGElement>("svg"))
    .filter((s) => /120 120$/.test((s.getAttribute("viewBox") ?? "").trim()) && onScreen(s, innerHeight * 0.75))
    .map((s) => ({ s, px: s.getBoundingClientRect().width, vis: onScreen(s) ? 1 : 0 }))
    .sort((a, b) => b.vis - a.vis || b.px - a.px)
    .slice(0, MAX_BLOBS);

  svgs.forEach(({ s: svg, px }, i) => {
    const top = svg.querySelector("[data-eyes-top]");
    const eyes = svg.querySelector("[data-eyes]");
    const overlay: SVGGElement[] = [];
    if (top && eyes) {
      const spec = top.getAttribute("data-eyes-top")?.trim().split(/\s+/) ?? [];
      const anchors: Anchor[] = spec.length >= 6
        ? [0, 3].map((o) => ({ x: +spec[o], y: +spec[o + 1], r: +spec[o + 2], lens: spec[6] === "lens" }))
        : anchorsFromEyes(eyes);
      const g = el("g", { class: "zz-dz" });
      anchors.forEach((a, j) => g.append(spiralEye(a, j ? -1 : 1, i * 2 + j)));
      top.appendChild(g);
      overlay.push(g);
      svg.setAttribute("data-zz-dizzy", "");
      marked.push(svg);
    } else {
      // SVG sans repères : par-dessus chaque blanc d'œil (pas les reflets, joyaux, boutons de costume…)
      for (const c of Array.from(svg.querySelectorAll('circle[fill="#fff"]'))) {
        const r = Number(c.getAttribute("r")), cx = Number(c.getAttribute("cx")), cy = Number(c.getAttribute("cy"));
        if (!(r >= 8 && r <= 22 && cx >= 20 && cx <= 100 && cy >= 35 && cy <= 80) || !c.parentNode) continue;
        const g = spiralEye({ x: cx, y: cy, r, lens: false }, cx < 60 ? 1 : -1, i * 2 + (cx < 60 ? 0 : 1));
        c.parentNode.appendChild(g);
        overlay.push(g);
      }
      if (!overlay.length) return;
    }
    if (opts.stars !== false && px >= STARS_MIN_PX) {
      const st = stars(svg, headTop(svg, top) - 3, px, anims, still);
      svg.appendChild(st);
      overlay.push(st);
    }
    added.push(...overlay);
    if (!still) {
      // Petit fondu de sortie
      for (const o of overlay) {
        if (typeof o.animate === "function") anims.push(o.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 180, delay: Math.max(0, ms - 180), fill: "forwards" }));
      }
      if (opts.wobble && svg.parentElement) stagger(svg.parentElement, i, ms, anims);
    }
  });

  let done = false;
  const undo = () => {
    if (done) return;
    done = true;
    clearTimeout(t);
    root.classList.remove("zz-spiral");
    anims.forEach((a) => a.cancel());
    added.forEach((g) => g.remove());
    marked.forEach((s) => s.removeAttribute("data-zz-dizzy"));
  };
  const t = setTimeout(undo, ms);
  return undo;
}
