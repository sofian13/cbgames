import { AvatarBlob, type AvatarCostumeCtx, type AvatarCostumeLayers } from "@/components/avatar/AvatarBlob";
import { usePersoTalk, usePlayerLook } from "@/components/avatar/PlayerBlob";
import { VoiceBadge } from "@/components/avatar/VoiceUI";
import { playPersoVoice, usePersoVoice } from "@/lib/avatar/voice";
import { costumeLayers, type ZCostume } from "./costumes";
import { isBossName, isZinzinName } from "@/lib/avatar/secrets";
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
 * `talk` : toucher = il dit son son ; `autoTalk` : il le dit une fois à l'apparition (podium).
 */
export function BandBlob({ name, costume, crown, talk = false, autoTalk = false, talkDelay, ...p }: ZBlobProps & {
  name: string; costume?: ZCostume; talk?: boolean; autoTalk?: boolean; talkDelay?: number;
}) {
  const look = usePlayerLook(name);
  const voice = usePersoVoice(talk ? name : null);
  const { ref, mood: talking } = usePersoTalk(name, { auto: autoTalk, delay: talkDelay });
  const mood = talking ?? p.mood;
  const size = p.size ?? 96;
  // Secret : « Zinzin » porte la couronne arc-en-ciel (à la place de celle du gagnant)
  const zinzin = isZinzinName(name);
  const cos = costume
    ? (ctx: AvatarCostumeCtx) => costumeLayers(costume, ctx)
    : crown && !zinzin ? () => CROWN : undefined;
  const blob = look
    ? <AvatarBlob look={look} size={size} mood={mood} name={name} animate={p.wobble !== false && !talking} costume={cos} className={p.className} style={p.style} />
    : <ZBlob {...p} mood={mood} costume={costume} crown={crown} rainbowCrown={zinzin} shades={isBossName(name)} />;
  if (!talk && !autoTalk) return blob;
  return (
    <div ref={ref} style={{ position: "relative", display: "inline-block" }}
      {...(talk && voice ? { onClick: () => void playPersoVoice(name), role: "button", tabIndex: 0, "aria-label": name } : {})}>
      {blob}
      {talk && voice && <VoiceBadge size={Math.max(18, Math.round(size * 0.26))} />}
    </div>
  );
}
