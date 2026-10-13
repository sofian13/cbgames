// Pensez Pareil — thèmes en anglais (mêmes règles que le FR : catégories où deux
// personnes peuvent tomber sur LA MÊME réponse ; pack spicy suggestif, jamais explicite).
import type { Prompt } from "./pp-content";

const SOFT = [
  "A fruit", "A colour", "A pet", "A country to visit", "A number between 1 and 10",
  "A season", "A dessert", "A superhero", "A hot drink", "An animated movie",
  "An emoji", "A pizza topping", "A vegetable", "A sport", "A musical instrument",
  "A day of the week", "A big city", "A farm animal", "A safari animal", "A flower",
  "A job", "A means of transport", "A cheese", "A fast-food meal", "A part of the face",
  "A winter clothing item", "A bathroom item", "A school subject", "A board game", "A cartoon character",
  "A fairy-tale princess", "A social network", "A planet", "A month of the year", "A sweet or candy",
  "An ice cream flavour", "An insect", "A bird", "A fish", "A European capital",
  "An exotic fruit", "A shape", "A fruit juice", "A spice", "A kitchen utensil",
  "A piece of furniture", "Something you take to the beach", "A dinosaur", "A famous wizard", "A cold country",
  "A foreign language", "A number between 1 and 100", "An emotion", "A breakfast food", "A holiday of the year",
  "A winter sport", "Something red", "Something spiky", "A scary animal", "A famous monument",
  "A grandma classic dish", "A video game hero", "Something you'd find in a handbag", "A sport with a ball", "A pastry or cake",
  "A sandwich filling",
];

const COUPLE = [
  "Our current show", "Our next trip", "A dish we always order", "Our Sunday activity", "Our song",
  "Our future pet's name", "Our favourite restaurant", "Something that always makes us laugh", "Our nickname for each other", "Who's the better cook (first name)",
  "The first movie we watched together", "Where our first date was", "Our dessert to share", "The other's worst flaw", "The other's best quality",
  "The dish the other always messes up", "Who falls asleep first (first name)", "Who said \"I love you\" first (first name)", "The country we'd live in", "Our future kid's name",
  "Our emoji", "The perfect gift for the other", "Our #1 thing to argue about", "Our favourite room at home", "The game we play together",
  "What we ate on our first dinner", "The animal the other looks like", "The other's favourite season", "The other's favourite colour", "The other's favourite snack",
  "The other's favourite singer", "One word to describe us", "Who's more jealous (first name)", "Who's always late (first name)", "Our holiday activity",
  "The movie we could rewatch 100 times",
];

const SPICY = [
  "An unusual place to kiss", "My favourite part of the other's body", "One word for our last night", "An outfit that drives the other wild", "A place we've never dared",
  "The other's flirty nickname", "A lingerie colour", "A perfume that makes you melt", "A room in the house (not the bedroom)", "The best time of day for a cuddle",
  "A movie that heats things up", "A song to set the mood", "An accessory to spice things up", "A sexy food", "What the other wears to bed",
  "A sweet word to whisper", "A spot on the body for a massage", "The first thing you notice about the other", "A destination for a getaway for two", "A flirty game",
  "A costume for role play", "A spot on the body to kiss", "A drink for a date night", "A scent that drives you wild", "A fantasy in one word",
  "The sturdiest piece of furniture at home", "One word for our kisses", "The other's clothing item I most like to take off", "A fabric you just want to touch", "A dessert to share in bed",
  "A flirty emoji", "The first thing we do after coming home from a date", "A spot for a midnight swim",
];

export const PROMPTS_EN: Prompt[] = [
  ...SOFT.map((text) => ({ text, tier: "soft" as const })),
  ...COUPLE.map((text) => ({ text, tier: "couple" as const })),
  ...SPICY.map((text) => ({ text, tier: "spicy" as const })),
];
