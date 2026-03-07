/* eslint-disable @typescript-eslint/no-require-imports */
const fs=require("fs");const path=require("path");const p=path.join(__dirname,"roulette-game.tsx");const c=fs.readFileSync(path.join(__dirname,"_content.txt"),"utf8");fs.writeFileSync(p,c);console.log("done");
