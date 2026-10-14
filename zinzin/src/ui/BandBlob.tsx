import { AvatarBlob, type AvatarCostumeCtx, type AvatarCostumeLayers } from "@/components/avatar/AvatarBlob";
import { usePlayerLook } from "@/components/avatar/PlayerBlob";
import { costumeLayers, type ZCostume } from "./costumes";
import { ZBlob, type ZBlobProps } from "./ZBlob";

/** Couronne du gagnant (repère 120×120), posée à la place du chapeau. */
const CROWN: AvatarCostumeLayers = {
  top: (
    <g transform="translate(60 12) rotate(-8)">
      <path d="M-20 4 L-24 -16 L-11 -6 L0 -22 L11 -6 L24 -16 L20 4Z" fill="#FFD23F" stroke="#15082E" strokeWidth={3.4} strokeLinejoin="round" />
      <circle cx={0} cy={-6} r={3.2} fill="#FF3EA5" stroke="#15082E" strokeWidth={1.6} />
    </g>
  ),
};

/**
 * Blob d'un joueur dans l'app (Soirée Zinzin) : son perso « Ma bande » s'il en a un,
 * sinon le ZBlob coloré. Costume de jeu ou couronne : prioritaires sur son chapeau.
 */
export function BandBlob({ name, costume, crown, ...p }: ZBlobProps & { name: string; costume?: ZCostume }) {
  const look = usePlayerLook(name);
  if (!look) return <ZBlob {...p} costume={costume} crown={crown} />;
  const size = p.size ?? 96;
  const cos = costume
    ? (ctx: AvatarCostumeCtx) => costumeLayers(costume, ctx)
    : crown ? () => CROWN : undefined;
  return (
    <AvatarBlob look={look} size={size} mood={p.mood} animate={p.wobble !== false} costume={cos} className={p.className} style={p.style} />
  );
}
