/**
 * Typographie française automatique pour TOUT le texte affiché (app + jeux) :
 * l'espace devant « ? ! : ; = » et à l'intérieur des guillemets « » devient
 * insécable, pour qu'un « ? » ne se retrouve jamais seul en début de ligne.
 * Agit sur les nœuds texte (pas sur les champs de saisie), y compris ceux
 * que React met à jour ensuite.
 */
const RE = /[ \t]+([?!:;»=])|(«)[ \t]+/g;
const fix = (s: string) => s.replace(RE, (_m, p: string | undefined, q: string | undefined) => (p ? " " + p : q + " "));
const SKIP = new Set(["SCRIPT", "STYLE", "TEXTAREA", "INPUT", "CODE", "PRE"]);

function fixNode(n: Node) {
  if (n.nodeType === Node.TEXT_NODE) {
    const v = n.nodeValue;
    if (v && RE.test(v)) {
      RE.lastIndex = 0;
      const nv = fix(v);
      if (nv !== v) n.nodeValue = nv;
    }
    RE.lastIndex = 0;
    return;
  }
  if (n.nodeType !== Node.ELEMENT_NODE || SKIP.has((n as Element).tagName)) return;
  const w = document.createTreeWalker(n, NodeFilter.SHOW_TEXT);
  for (let t = w.nextNode(); t; t = w.nextNode()) {
    if (t.parentElement && SKIP.has(t.parentElement.tagName)) continue;
    fixNode(t);
  }
}

export function installFrenchTypo(root: HTMLElement = document.body) {
  fixNode(root);
  const mo = new MutationObserver((list) => {
    for (const m of list) {
      if (m.type === "characterData") fixNode(m.target);
      else m.addedNodes.forEach(fixNode);
    }
  });
  mo.observe(root, { subtree: true, childList: true, characterData: true });
  return () => mo.disconnect();
}
