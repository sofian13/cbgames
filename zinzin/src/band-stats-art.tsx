import { setBandStatsGameArt } from "@/lib/band-stats";
import { getZGame } from "./catalog";
import { ZBlob, ZPALETTE } from "./ui/ZBlob";

/**
 * Écran « Les stats de la bande » (src/components/avatar/BandStatsScreen.tsx) :
 * le blob déguisé de chaque jeu et sa couleur, comme dans le catalogue.
 */
setBandStatsGameArt({
  art: (id, size) => {
    const g = getZGame(id);
    if (!g) return null;
    // Le costume dépasse du blob : on le dessine un peu plus petit que la case
    return <ZBlob size={Math.round(size * 0.8)} color={g.color} mood={g.mood} costume={g.costume} seed={id.length} outline shadow={false} />;
  },
  color: (id) => {
    const g = getZGame(id);
    return g ? (g.costume === "potato" ? ZPALETTE.yellow.body : ZPALETTE[g.color]?.body) : undefined;
  },
});
