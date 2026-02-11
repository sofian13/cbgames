"use client";

export function EmberOrb({ px, py, boost }: { px: number; py: number; boost: number }) {
  const b = boost;
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center z-[4]">
      <div style={{ transform: `translate(${px}px, ${py}px)`, transition: "transform 0.1s ease-out" }}>
        <div className="absolute" style={{ width: 850 + b * 80, height: 850 + b * 80, left: "50%", top: "50%", transform: "translate(-50%,-50%)", background: `radial-gradient(circle, rgba(180,50,30,${0.055 + b * 0.03}) 10%, transparent 55%)`, animation: "pulse 7s ease-in-out infinite", transition: "all 0.4s ease" }} />
        <div className="absolute" style={{ width: 580, height: 680, left: -160, top: -200, background: `radial-gradient(ellipse 60% 50% at 40% 60%, rgba(150,28,8,${0.065 + b * 0.02}) 0%, transparent 100%)`, filter: "blur(55px)", animation: "drift 10s ease-in-out infinite alternate" }} />
        <div className="absolute" style={{ width: 520, height: 620, right: -140, top: -140, background: `radial-gradient(ellipse 55% 50% at 60% 50%, rgba(200,65,18,${0.055 + b * 0.02}) 0%, transparent 100%)`, filter: "blur(50px)", animation: "drift 13s ease-in-out infinite alternate-reverse" }} />
        <div className="absolute" style={{ width: 520, height: 380, left: "50%", bottom: -170, transform: "translateX(-50%)", background: `radial-gradient(ellipse 80% 60% at 50% 15%, rgba(170,45,15,${0.05 + b * 0.02}) 0%, transparent 100%)`, filter: "blur(50px)" }} />

        <div className="relative rounded-full" style={{
          width: 480, height: 480,
          background: `radial-gradient(circle at 44% 38%, rgba(225,70,32,${0.16 + b * 0.06}) 0%, rgba(185,40,18,${0.085 + b * 0.03}) 26%, rgba(150,28,12,${0.03 + b * 0.015}) 50%, transparent 70%)`,
          boxShadow: `0 0 ${105 + b * 40}px rgba(200,55,28,${0.09 + b * 0.04}), 0 0 ${210 + b * 60}px rgba(180,38,18,${0.055 + b * 0.025}), 0 0 ${350 + b * 80}px rgba(150,28,12,${0.03 + b * 0.015}), inset 0 0 ${95 + b * 30}px rgba(200,55,28,${0.045 + b * 0.02})`,
          animation: "orbGlow 5s ease-in-out infinite alternate",
          transition: "box-shadow 0.35s ease, background 0.35s ease",
        }}>
          <div className="absolute inset-[23%] rounded-full" style={{ background: `radial-gradient(circle, rgba(245,90,38,${0.1 + b * 0.05}) 0%, transparent 60%)` }} />
          <div className="absolute inset-[12%] rounded-full" style={{ background: `radial-gradient(ellipse 55% 35% at 34% 33%, rgba(255,125,50,${0.04 + b * 0.02}) 0%, transparent 55%)` }} />
        </div>

        <div className="absolute left-1/2 top-1/2 rounded-full" style={{ width: 480, height: 480, transform: "translate(-50%,-50%)", border: `1px solid rgba(200,65,32,${0.11 + b * 0.04})`, boxShadow: `inset 0 0 50px rgba(200,55,28,${0.02 + b * 0.01})`, transition: "all 0.35s ease" }} />
        <div className="absolute left-1/2 -translate-x-1/2" style={{ width: 300, height: 140, top: -35, background: `radial-gradient(ellipse 100% 80% at 50% 100%, rgba(235,82,38,${0.14 + b * 0.05}) 0%, transparent 58%)`, borderRadius: "50%", animation: "flicker 4s ease-in-out infinite alternate" }} />
        <div className="absolute left-1/2 -translate-x-1/2" style={{ width: 160, height: 55, top: -12, background: `radial-gradient(ellipse 100% 100% at 50% 100%, rgba(250,130,55,${0.1 + b * 0.04}) 0%, transparent 68%)`, borderRadius: "50%" }} />
        <div className="absolute left-1/2 -translate-x-1/2" style={{ width: 260, height: 95, bottom: -12, background: `radial-gradient(ellipse 100% 100% at 50% 0%, rgba(200,55,28,${0.055 + b * 0.02}) 0%, transparent 68%)`, borderRadius: "50%" }} />
        <div className="absolute" style={{ width: 90, height: 220, left: -18, top: "50%", transform: "translateY(-50%)", background: `radial-gradient(ellipse at 100% 50%, rgba(190,55,25,${0.035 + b * 0.015}) 0%, transparent 70%)`, borderRadius: "50%" }} />
        <div className="absolute" style={{ width: 90, height: 220, right: -18, top: "50%", transform: "translateY(-50%)", background: `radial-gradient(ellipse at 0% 50%, rgba(190,55,25,${0.035 + b * 0.015}) 0%, transparent 70%)`, borderRadius: "50%" }} />
      </div>
    </div>
  );
}
