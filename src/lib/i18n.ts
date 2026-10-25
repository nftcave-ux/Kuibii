import es from "./i18n-es.json";

export type Lang = "en" | "es";
const dict = es as Record<string, string>;
const ATTRS = ["placeholder", "aria-label", "title"] as const;
const originals = new WeakMap<Node, string>();

function tr(value: string): string | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const hit = dict[trimmed];
  return hit ? value.replace(trimmed, hit) : undefined;
}

function translateNode(node: Node) {
  if (node.nodeType === Node.TEXT_NODE) {
    const cur = node.nodeValue ?? "";
    const next = tr(cur);
    if (next && next !== cur) { originals.set(node, cur); node.nodeValue = next; }
    return;
  }
  if (!(node instanceof Element) || node.closest("script,style,[data-no-translate]")) return;
  for (const a of ATTRS) {
    const v = node.getAttribute(a);
    const next = v ? tr(v) : undefined;
    if (v && next && next !== v) { node.setAttribute(`data-orig-${a}`, v); node.setAttribute(a, next); }
  }
  node.childNodes.forEach(translateNode);
}

/** Translates rendered text in place while Spanish is active; returns a cleanup that restores English. */
export function startDomTranslation(root: HTMLElement): () => void {
  translateNode(root);
  const obs = new MutationObserver((muts) => {
    for (const m of muts) {
      if (m.type === "characterData") translateNode(m.target);
      else if (m.type === "attributes") translateNode(m.target);
      else m.addedNodes.forEach(translateNode);
    }
  });
  obs.observe(root, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: [...ATTRS] });
  return () => {
    obs.disconnect();
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      const o = originals.get(n);
      if (o !== undefined && dict[o.trim()] && n.nodeValue === tr(o)) n.nodeValue = o;
    }
    for (const a of ATTRS) root.querySelectorAll(`[data-orig-${a}]`).forEach((el) => {
      el.setAttribute(a, el.getAttribute(`data-orig-${a}`)!); el.removeAttribute(`data-orig-${a}`);
    });
  };
}
