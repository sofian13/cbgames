"use client";

export function EmberOrb({ px, py, boost }: { px: number; py: number; boost: number }) {
  const b = boost;
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center z-[4]">
      <div style={{ transform: `translate(${px}px, ${py}px)`, transition: "transform 0.1s ease-out" }}>
        <div className="absolute" style={{ width: 850 + b * 80, height: 850 + b * 80, left: "50%", top: "50%", transform: "translate(-50%,-50%)", background: `radial-gradient(circle, rgba(70,170,255,${0.06 + b * 0.03}) 10%, transparent 55%)`, animation: "pulse 7s ease-in-out infinite", transition: "all 0.4s ease" }} />
        <div className="absolute" style={{ width: 580, height: 680, left: -160, top: -200, background: `radial-gradient(ellipse 60% 50% at 40% 60%, rgba(56,90,255,${0.07 + b * 0.02}) 0%, transparent 100%)`, filter: "blur(55px)", animation: "drift 10s ease-in-out infinite alternate" }} />
        <div className="absolute" style={{ width: 520, height: 620, right: -140, top: -140, background: `radial-gradient(ellipse 55% 50% at 60% 50%, rgba(70,230,255,${0.06 + b * 0.02}) 0%, transparent 100%)`, filter: "blur(50px)", animation: "drift 13s ease-in-out infinite alternate-reverse" }} />
        <div className="absolute" style={{ width: 520, height: 380, left: "50%", bottom: -170, transform: "translateX(-50%)", background: `radial-gradient(ellipse 80% 60% at 50% 15%, rgba(76,130,255,${0.055 + b * 0.02}) 0%, transparent 100%)`, filter: "blur(50px)" }} />

        <div className="relative rounded-full" style={{
          width: 480, height: 480,
          background: `radial-gradient(circle at 44% 38%, rgba(108,205,255,${0.2 + b * 0.06}) 0%, rgba(75,120,255,${0.1 + b * 0.03}) 28%, rgba(68,60,220,${0.05 + b * 0.015}) 50%, transparent 72%)`,
          boxShadow: `0 0 ${105 + b * 40}px rgba(78,180,255,${0.14 + b * 0.04}), 0 0 ${210 + b * 60}px rgba(95,90,255,${0.08 + b * 0.025}), 0 0 ${350 + b * 80}px rgba(62,64,180,${0.04 + b * 0.015}), inset 0 0 ${95 + b * 30}px rgba(70,170,255,${0.06 + b * 0.02})`,
          animation: "orbGlow 5s ease-in-out infinite alternate",
          transition: "box-shadow 0.35s ease, background 0.35s ease",
        }}>
          <div className="absolute inset-[23%] rounded-full" style={{ background: `radial-gradient(circle, rgba(115,226,255,${0.14 + b * 0.05}) 0%, transparent 60%)` }} />
          <div className="absolute inset-[12%] rounded-full" style={{ background: `radial-gradient(ellipse 55% 35% at 34% 33%, rgba(150,165,255,${0.06 + b * 0.02}) 0%, transparent 55%)` }} />
        </div>

        <div className="absolute left-1/2 top-1/2 rounded-full" style={{ width: 480, height: 480, transform: "translate(-50%,-50%)", border: `1px solid rgba(100,195,255,${0.14 + b * 0.04})`, boxShadow: `inset 0 0 50px rgba(88,162,255,${0.03 + b * 0.01})`, transition: "all 0.35s ease" }} />
        <div className="absolute left-1/2 -translate-x-1/2" style={{ width: 300, height: 140, top: -35, background: `radial-gradient(ellipse 100% 80% at 50% 100%, rgba(106,225,255,${0.18 + b * 0.05}) 0%, transparent 58%)`, borderRadius: "50%", animation: "flicker 4s ease-in-out infinite alternate" }} />
        <div className="absolute left-1/2 -translate-x-1/2" style={{ width: 160, height: 55, top: -12, background: `radial-gradient(ellipse 100% 100% at 50% 100%, rgba(168,180,255,${0.12 + b * 0.04}) 0%, transparent 68%)`, borderRadius: "50%" }} />
        <div className="absolute left-1/2 -translate-x-1/2" style={{ width: 260, height: 95, bottom: -12, background: `radial-gradient(ellipse 100% 100% at 50% 0%, rgba(86,135,255,${0.06 + b * 0.02}) 0%, transparent 68%)`, borderRadius: "50%" }} />
        <div className="absolute" style={{ width: 90, height: 220, left: -18, top: "50%", transform: "translateY(-50%)", background: `radial-gradient(ellipse at 100% 50%, rgba(84,130,255,${0.04 + b * 0.015}) 0%, transparent 70%)`, borderRadius: "50%" }} />
        <div className="absolute" style={{ width: 90, height: 220, right: -18, top: "50%", transform: "translateY(-50%)", background: `radial-gradient(ellipse at 0% 50%, rgba(84,130,255,${0.04 + b * 0.015}) 0%, transparent 70%)`, borderRadius: "50%" }} />
      </div>
    </div>
  );
}
