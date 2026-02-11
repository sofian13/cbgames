"use client";

export function FilmGrain() {
  return (
    <>
      {/* Film grain (animated SVG noise) */}
      <div
        className="pointer-events-none fixed inset-0 z-50 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          animation: "grainShift 0.5s steps(3) infinite",
        }}
      />
      {/* Cinematic vignette */}
      <div
        className="pointer-events-none fixed inset-0 z-[3]"
        style={{ boxShadow: "inset 0 0 280px 110px rgba(0,0,0,0.6)" }}
      />
    </>
  );
}
