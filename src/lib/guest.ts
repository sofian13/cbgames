const GUEST_ID_KEY = "af-games-guest-id";
const GUEST_NAME_KEY = "af-games-guest-name";
const GUEST_SESSION_ID_KEY = "af-games-guest-session-id";

const ADJECTIVES = [
  "Brave", "Rusé", "Rapide", "Malin", "Cool", "Fort", "Vif", "Agile",
  "Zen", "Épic", "Turbo", "Mega", "Ultra", "Super", "Hyper", "Max",
];

const ANIMALS = [
  "Renard", "Loup", "Aigle", "Ours", "Tigre", "Panda", "Lynx", "Faucon",
  "Dragon", "Phénix", "Cobra", "Shark", "Lion", "Hawk", "Raven", "Wolf",
];

function generateGuestName(): string {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const animal = ANIMALS[Math.floor(Math.random() * ANIMALS.length)];
  const num = Math.floor(Math.random() * 100);
  return `${adj}${animal}${num}`;
}

function generateGuestId(): string {
  return `guest-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function getOrCreateGuest(): { id: string; name: string } {
  if (typeof window === "undefined") {
    return { id: generateGuestId(), name: generateGuestName() };
  }

  let id = sessionStorage.getItem(GUEST_SESSION_ID_KEY);
  let name = localStorage.getItem(GUEST_NAME_KEY);

  if (!id) {
    id = generateGuestId();
    sessionStorage.setItem(GUEST_SESSION_ID_KEY, id);
    // Keep legacy key in sync for compatibility with old sessions.
    localStorage.setItem(GUEST_ID_KEY, id);
  }

  if (!name) {
    name = generateGuestName();
    localStorage.setItem(GUEST_NAME_KEY, name);
  }

  return { id, name };
}

export function setGuestName(name: string) {
  localStorage.setItem(GUEST_NAME_KEY, name);
}
