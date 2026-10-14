import { createRoot } from "react-dom/client";
import { AvatarBlob } from "@/components/avatar/AvatarBlob";
import { AVATAR_COLORS, AVATAR_ITEMS, DEFAULT_LOOK, type AvatarLook, type AvatarSlot } from "@/lib/avatar/look";
import { costumeLayers, type ZCostume } from "./ui/costumes";
import "./ui/zinzin.css";
import { PassScreen, ZRanking } from "@/components/games/local-kit";
import { rankingCard } from "@/lib/share-cards";
import { renderShareCard } from "@/lib/share-card";

/**
 * Planche de contrôle des persos (DEV uniquement, jamais dans le build) :
 * #avatar-lab?slot=hair&size=48 — chaque élément sur plusieurs couleurs.
 */
export function mountAvatarLab() {
  const q = new URLSearchParams(location.hash.split("?")[1] ?? "");
  const size = Number(q.get("size") ?? 48);
  const slot = (q.get("slot") ?? "hair") as AvatarSlot | "color" | "costume" | "mix" | "matrix";
  // Filtre facultatif : ids séparés par des virgules, ou « new:N » = les N derniers du catalogue
  const only = q.get("items");
  const pick = <T extends { id: string }>(list: T[]) => {
    if (!only) return list;
    if (only.startsWith("new:")) return list.slice(-Number(only.slice(4)));
    const ids = only.split(",");
    return list.filter((x) => ids.includes(x.id));
  };
  const colors = (q.get("colors") ?? "pink,yellow,night,white").split(",");
  if (slot === ("kit" as string)) {
    const names = (q.get("names") ?? "Sofian,Léa,Max,Zoé").split(",");
    const rows = names.map((name, i) => ({ name, score: 10 - i * 2, colorIndex: i }));
    createRoot(document.getElementById("root")!).render(
      <div style={{ background: "#1E1250", minHeight: "100vh", padding: 16 }}>
        <ZRanking rows={rows} />
        <PassScreen toName={names[1]} colorIndex={1} onReady={() => {}} />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img id="card" style={{ width: "100%" }} alt="" />
      </div>,
    );
    void renderShareCard(rankingCard("top-ten", rows)).then((c) => { (document.getElementById("card") as HTMLImageElement).src = c.toDataURL(); });
    return;
  }
  const rows: { label: string; looks: AvatarLook[]; costume?: ZCostume }[] = [];
  if (slot === "color") {
    rows.push({ label: "colors", looks: AVATAR_COLORS.map((c) => ({ ...DEFAULT_LOOK, color: c, hair: "swoop" })) });
  } else if (slot === "costume") {
    const cs: ZCostume[] = ["wolf", "groucho", "pinocchio", "ten", "spy", "angeldevil", "mime", "waiter", "train", "hearts"];
    for (const c of cs) rows.push({ label: c, costume: c, looks: [
      { ...DEFAULT_LOOK, color: "pink", hair: "golden", hat: "straw", face: "scar", extra: "scarf" },
      { ...DEFAULT_LOOK, color: "mint", hair: "swordsman", hat: "bandana", face: "round", extra: "armband" },
      { ...DEFAULT_LOOK, color: "yellow", hair: "afro", hat: "none", face: "shades", extra: "cape" },
    ] });
  } else if (slot === "mix") {
    const mixes: Partial<AvatarLook>[] = [
      { hair: "golden", hat: "crown" }, { hair: "afro", hat: "cap" }, { hair: "hero", hat: "straw" }, { hair: "long", hat: "beanie" },
      { hair: "curly", hat: "halo" }, { hair: "flame", hat: "party" }, { hair: "pigtails", hat: "bow" }, { hair: "bun", hat: "ninja" },
      { hair: "mohawk", hat: "cowboy" }, { hair: "emo", hat: "tophat" }, { hair: "swordsman", hat: "horns", face: "beard" }, { hair: "bowl", hat: "bucket", face: "goggles" },
      { hair: "long", face: "mask", extra: "headphones" }, { hair: "golden", extra: "headphones" }, { eyes: "big", hair: "pigtails", face: "blush", extra: "lei" },
      { eyes: "determined", hair: "hero", face: "scar", extra: "cape" },
    ];
    rows.push({ label: "mix", looks: mixes.map((m, i) => ({ ...DEFAULT_LOOK, color: AVATAR_COLORS[i % AVATAR_COLORS.length], ...m })) });
  } else if (slot === ("mix2" as string)) {
    // Combinaisons des éléments v2 (manga) avec l'existant
    const mixes: Partial<AvatarLook>[] = [
      { hair: "ponytail", extra: "katana", face: "crossscar", eyes: "determined" }, { hair: "silver", hat: "crown", face: "earring" },
      { hair: "messy", face: "bandages", hat: "cap" }, { hair: "mane", extra: "longscarf", hat: "horns" },
      { hair: "twintails", hat: "bow", face: "blush" }, { hair: "sticks", hat: "halo", extra: "katana" },
      { hair: "peekaboo", face: "mask", extra: "katana" }, { hair: "ahoge", extra: "headphones", eyes: "big" },
      { hair: "mohawk", hat: "crown" }, { hair: "streak", face: "bandages", extra: "longscarf" },
      { hair: "silver", extra: "headphones" }, { hair: "hedgehog", face: "crossscar", hat: "ninja" },
      { hair: "ponytail", hat: "beanie", extra: "longscarf" }, { hair: "twintails", hat: "cowboy", face: "earring" },
      { hair: "golden", hat: "crown", extra: "cape" }, { hair: "flame", hat: "tophat", face: "shades" },
    ];
    rows.push({ label: "mix2", looks: mixes.map((m, i) => ({ ...DEFAULT_LOOK, color: AVATAR_COLORS[(i * 3) % AVATAR_COLORS.length], ...m })) });
  } else if (slot === "matrix") {
    // Matrice coupes × chapeaux (contrôle des chapeaux posés sur chaque coupe)
    const hats = AVATAR_ITEMS.hat;
    for (const [i, h] of pick(AVATAR_ITEMS.hair).entries()) {
      rows.push({ label: `hair.${h.id}`, looks: hats.map((t) => ({ ...DEFAULT_LOOK, color: colors[i % colors.length], hair: h.id, hat: t.id })) });
    }
  } else {
    for (const it of pick(AVATAR_ITEMS[slot])) rows.push({ label: `${slot}.${it.id}${it.free ? "" : " 🔒"}`, looks: colors.map((c) => ({ ...DEFAULT_LOOK, color: c, [slot]: it.id })) });
  }
  const cell = size * 1.6;
  createRoot(document.getElementById("root")!).render(
    <div style={{ background: "#1E1250", color: "#fff", padding: 12, fontFamily: "system-ui", minHeight: "100vh" }}>
      {rows.map((r) => (
        <div key={r.label} style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 4, marginBottom: 4 }}>
          <div style={{ width: 110, fontSize: 11 }}>{r.label}</div>
          {r.looks.map((l, i) => (
            <div key={i} style={{ width: cell, height: cell, display: "grid", placeItems: "end center", paddingBottom: size * 0.1, background: i % 2 ? "#2A1A6B" : "#FFF6E5" }}>
              <AvatarBlob look={l} size={size} animate={false} costume={r.costume ? (ctx) => costumeLayers(r.costume, ctx) : undefined} />
            </div>
          ))}
        </div>
      ))}
    </div>,
  );
}
