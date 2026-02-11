"use client";

const KEYFRAMES = `
@keyframes letterIn {
  from { opacity: 0; transform: translateY(55px) scale(0.95); filter: blur(10px); }
  to   { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); }
}
@keyframes shimmer {
  0%   { background-position: 200% center; }
  100% { background-position: -200% center; }
}
@keyframes blink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0; }
}
@keyframes fadeUp {
  from { opacity: 0; transform: translateY(35px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes fadeIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}
@keyframes navIn {
  from { opacity: 0; transform: translateX(-50%) translateY(-35px); }
  to   { opacity: 1; transform: translateX(-50%) translateY(0); }
}
@keyframes logoPulse {
  0%   { box-shadow: 0 0 12px rgba(200,55,28,0.2); border-color: rgba(200,65,30,0.35); }
  100% { box-shadow: 0 0 20px rgba(200,55,28,0.35); border-color: rgba(200,65,30,0.5); }
}
@keyframes orbGlow {
  0%   { box-shadow: 0 0 105px rgba(200,55,28,0.09), 0 0 210px rgba(180,38,18,0.055), 0 0 350px rgba(150,28,12,0.03), inset 0 0 95px rgba(200,55,28,0.045); }
  100% { box-shadow: 0 0 145px rgba(200,55,28,0.14), 0 0 280px rgba(180,38,18,0.08), 0 0 420px rgba(150,28,12,0.045), inset 0 0 120px rgba(200,55,28,0.065); }
}
@keyframes pulse {
  0%, 100% { opacity: 1; transform: translate(-50%,-50%) scale(1); }
  50%      { opacity: 0.5; transform: translate(-50%,-50%) scale(1.07); }
}
@keyframes drift {
  0%   { transform: translate(0, 0) scale(1); }
  100% { transform: translate(28px, -20px) scale(1.04); }
}
@keyframes flicker {
  0%   { opacity: 1; }
  40%  { opacity: 0.55; }
  70%  { opacity: 0.85; }
  100% { opacity: 1; }
}
@keyframes shockwave {
  0%   { width: 180px; height: 180px; opacity: 0.18; border: 1.5px solid rgba(200,55,28,0.15); }
  100% { width: 1100px; height: 1100px; opacity: 0; border: 0.5px solid rgba(200,55,28,0.02); }
}
@keyframes orbit0 {
  0%   { transform: translate(200px, -120px); }
  25%  { transform: translate(240px, 80px); }
  50%  { transform: translate(-80px, 200px); }
  75%  { transform: translate(-220px, -40px); }
  100% { transform: translate(200px, -120px); }
}
@keyframes orbit1 {
  0%   { transform: translate(-180px, -160px); }
  25%  { transform: translate(100px, -200px); }
  50%  { transform: translate(260px, 40px); }
  75%  { transform: translate(-60px, 180px); }
  100% { transform: translate(-180px, -160px); }
}
@keyframes orbit2 {
  0%   { transform: translate(50px, 220px); }
  25%  { transform: translate(-240px, 60px); }
  50%  { transform: translate(-120px, -200px); }
  75%  { transform: translate(200px, -100px); }
  100% { transform: translate(50px, 220px); }
}
@keyframes orbit3 {
  0%   { transform: translate(-160px, 100px); }
  25%  { transform: translate(-200px, -160px); }
  50%  { transform: translate(120px, -220px); }
  75%  { transform: translate(260px, 120px); }
  100% { transform: translate(-160px, 100px); }
}
@keyframes scrollLine {
  0%, 100% { opacity: 0.2; transform: scaleY(1); }
  50%      { opacity: 0.8; transform: scaleY(1.4); }
}
@keyframes grainShift {
  0%   { transform: translate(0, 0); }
  33%  { transform: translate(-2px, 1px); }
  66%  { transform: translate(1px, -2px); }
  100% { transform: translate(0, 0); }
}
`;

export function EmberKeyframes() {
  return <style dangerouslySetInnerHTML={{ __html: KEYFRAMES }} />;
}
