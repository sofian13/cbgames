/**
 * Yeux en spirale (secrets : « accros » au Rejouer, accueil secoué en tous sens).
 * Posés hors React, pour quelques secondes, sur les blobs VISIBLES d'un conteneur :
 * - blobs SVG (ZBlob, persos « Ma bande ») : une spirale qui tourne est ajoutée par-dessus chaque
 *   blanc d'œil (cercle blanc dans la zone des yeux du repère 120×120), puis retirée ;
 * - blobs des jeux (Mascot) : classe « zz-spiral » sur le conteneur, spirale en CSS (.mascot-eye::after).
 * Rien n'est modifié dans les composants : au retrait, tout redevient exactement comme avant.
 */

const NS = "http://www.w3.org/2000/svg";
const INK = "#1A0B33";

/** Spirale d'Archimède centrée en 0,0 (rayon r, ~2,5 tours). */
function spiralD(r: number): string {
  const turns = 2.5, steps = 40;
  let d = "";
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const a = t * turns * Math.PI * 2;
    const k = r * 0.82 * t;
    d += `${i ? "L" : "M"}${(Math.cos(a) * k).toFixed(2)} ${(Math.sin(a) * k).toFixed(2)}`;
  }
  return d;
}

const onScreen = (el: Element) => {
  const r = el.getBoundingClientRect();
  return r.width > 0 && r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth;
};

/**
 * Ajoute les spirales sur les blobs visibles de `root` ; renvoie la fonction qui les retire
 * (appelée toute seule après `ms`).
 */
export function spiralEyes(root: Element, ms = 3000): () => void {
  const added: Element[] = [];
  root.classList.add("zz-spiral");
  for (const svg of Array.from(root.querySelectorAll("svg"))) {
    const vb = svg.getAttribute("viewBox") ?? "";
    if (!/120 120$/.test(vb.trim()) || !onScreen(svg)) continue;
    for (const c of Array.from(svg.querySelectorAll('circle[fill="#fff"]'))) {
      const r = Number(c.getAttribute("r")), cx = Number(c.getAttribute("cx")), cy = Number(c.getAttribute("cy"));
      // Seulement les blancs des yeux (pas les reflets, joyaux, boutons de costume…)
      if (!(r >= 8 && r <= 22 && cx >= 20 && cx <= 100 && cy >= 35 && cy <= 80) || !c.parentNode) continue;
      const g = document.createElementNS(NS, "g");
      g.setAttribute("class", "zz-spiral-eye");
      g.setAttribute("transform", `translate(${cx} ${cy})`);
      const spin = document.createElementNS(NS, "g");
      spin.setAttribute("class", "zz-spiral-spin");
      // Fond blanc (cache la pupille) + spirale ; le cercle centre aussi la rotation (fill-box)
      const bg = document.createElementNS(NS, "circle");
      bg.setAttribute("r", String(r + 0.4));
      bg.setAttribute("fill", "#fff");
      const p = document.createElementNS(NS, "path");
      p.setAttribute("d", spiralD(r));
      p.setAttribute("fill", "none");
      p.setAttribute("stroke", INK);
      p.setAttribute("stroke-width", String(Math.max(2.4, r * 0.2)));
      p.setAttribute("stroke-linecap", "round");
      spin.append(bg, p);
      g.append(spin);
      c.parentNode.appendChild(g);
      added.push(g);
    }
  }
  let done = false;
  const undo = () => {
    if (done) return;
    done = true;
    clearTimeout(t);
    root.classList.remove("zz-spiral");
    added.forEach((g) => g.remove());
  };
  const t = setTimeout(undo, ms);
  return undo;
}
