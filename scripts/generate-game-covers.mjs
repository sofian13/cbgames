import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const OUTPUT_DIR = path.join(process.cwd(), "public", "game-covers");
const API_URL = "https://api.openai.com/v1/images/generations";

const BASE_STYLE = [
  "Mobile mini-game app cover in a playful cartoon style",
  "inspired by hyper-casual game stores",
  "bold shapes",
  "clean composition",
  "soft 3D shading",
  "thick dark outline around objects",
  "bright readable title zone at the bottom",
  "portrait cover art",
  "high contrast",
  "kid-safe",
  "no watermark",
  "no UI buttons",
  "no small unreadable text",
].join(", ");

const GAME_PROMPTS = {
  "bomb-party": "A cute purple bomb with a glowing fuse above letter blocks exploding in a fun word puzzle scene.",
  "word-chain": "A chunky chain made of letters linking two floating word tiles in a colorful puzzle world.",
  "speed-quiz": "A bright lightning bolt over quiz cards and a giant question mark, energetic trivia game scene.",
  "roast-quiz": "A fiery quiz podium with playful trap icons and bright comic chaos, funny competitive trivia scene.",
  "reaction-time": "A target and tap burst with neon timing rings, instant reflex mini-game cover.",
  "tap-rush": "A giant cartoon finger smashing a glowing arcade button with speed lines and score sparks.",
  "split-second": "A fast arcade timer, buttons, and micro-challenge icons bursting in every direction.",
  "king-hill": "A tiny king on a glowing hill while rivals rush in with gadgets, competitive arena cartoon.",
  undercover: "Three suspicious cartoon characters, one with a hidden mask vibe, social deduction game cover.",
  "loup-garou": "A friendly werewolf silhouette under a moon over a village, mystery social party game scene.",
  infiltre: "A secret agent sneaking between colorful speech bubbles and clue cards, bluff party game art.",
  "la-taupe": "A sneaky mole in a team mission room pushing secret switches while others cooperate.",
  "black-market": "Cartoon smugglers trading glowing crates and fake treasure in a stylized underground market.",
  "code-names": "A grid of word tiles and two teams pointing at clues in a bright spy board-game scene.",
  enchere: "Mysterious auction items on pedestals with bidding paddles and spotlight beams, playful strategy cover.",
  roulette: "A dramatic cartoon revolver cylinder and betting chips in a stylized risk game scene.",
  chess: "Big toy-like chess pieces on a colorful board, elegant but playful strategy cover.",
  battleship: "Toy warships firing at a grid ocean with splashes and explosions, bright navy battle cover.",
  "motion-tennis": "Cartoon tennis racket swing with dynamic ball trail on a colorful court, energetic sports cover.",
  uno: "Fan of colorful number cards flying around a central discard pile in a playful card game scene.",
  poker: "A fun cartoon poker table with cards, chips, and dramatic bluff expressions, family-safe style.",
  "blind-control": "Several hands controlling one character from different directions in a chaotic obstacle maze.",
  "block-runner": "Chunky block heroes running and jumping over traps in a side-scrolling platform world.",
  "guess-word": "Friends making someone guess a word with big gestures and a card on forehead party scene.",
  "make-guess": "Two teammates in a fast guessing challenge with clue cards and playful timer energy.",
};

function slugListFromArgs() {
  const args = process.argv.slice(2).filter(Boolean);
  if (args.length === 0 || args.includes("--all")) {
    return Object.keys(GAME_PROMPTS);
  }
  return args;
}

async function fetchImageBuffer(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Image download failed: ${response.status} ${response.statusText}`);
  }
  return Buffer.from(await response.arrayBuffer());
}

async function generateCover(gameId, apiKey, model, quality) {
  const scenePrompt = GAME_PROMPTS[gameId];
  if (!scenePrompt) {
    throw new Error(`Unknown game id: ${gameId}`);
  }

  const prompt = `${BASE_STYLE}. ${scenePrompt} Add a simple empty bottom banner area for the app title.`;

  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      prompt,
      size: "1024x1536",
      quality,
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`OpenAI Images API failed for ${gameId}: ${response.status} ${response.statusText}\n${detail}`);
  }

  const json = await response.json();
  const image = json?.data?.[0];

  if (image?.b64_json) {
    return Buffer.from(image.b64_json, "base64");
  }

  if (image?.url) {
    return fetchImageBuffer(image.url);
  }

  throw new Error(`No image payload returned for ${gameId}`);
}

async function main() {
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_IMAGE_MODEL ?? "gpt-image-1";
  const quality = process.env.OPENAI_IMAGE_QUALITY ?? "medium";

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is missing. Add it to your environment before running the generator.");
  }

  const gameIds = slugListFromArgs();
  await mkdir(OUTPUT_DIR, { recursive: true });

  for (const gameId of gameIds) {
    process.stdout.write(`Generating ${gameId}...\n`);
    const buffer = await generateCover(gameId, apiKey, model, quality);
    const filePath = path.join(OUTPUT_DIR, `${gameId}.png`);
    await writeFile(filePath, buffer);
    process.stdout.write(`Saved ${filePath}\n`);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
