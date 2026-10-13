// Pensad Igual — temas en español neutro (mismas reglas que el FR : categorías donde
// dos personas pueden dar LA MISMA respuesta ; pack picante sugerente, nunca explícito).
import type { Prompt } from "./pp-content";

const SOFT = [
  "Una fruta", "Un color", "Una mascota", "Un país para visitar", "Un número del 1 al 10",
  "Una estación del año", "Un postre", "Un superhéroe", "Una bebida caliente", "Una película animada",
  "Un emoji", "Un ingrediente de pizza", "Una verdura", "Un deporte", "Un instrumento musical",
  "Un día de la semana", "Una ciudad europea", "Un animal de granja", "Un animal de la sabana", "Una flor",
  "Una profesión", "Un medio de transporte", "Un queso", "Una comida rápida", "Una parte de la cara",
  "Una prenda de invierno", "Algo del baño", "Una asignatura del cole", "Un juego de mesa", "Un personaje de dibujos animados",
  "Una princesa de cuento", "Una red social", "Un planeta", "Un mes del año", "Una golosina",
  "Un sabor de helado", "Un insecto", "Un pájaro", "Un pez", "Una capital europea",
  "Una fruta tropical", "Una figura geométrica", "Un zumo de fruta", "Una especia", "Un utensilio de cocina",
  "Un mueble", "Algo que te llevas a la playa", "Un dinosaurio", "Un mago famoso", "Un país donde hace frío",
  "Un idioma extranjero", "Un número del 1 al 100", "Una emoción", "Algo que se desayuna", "Una fiesta del año",
  "Un deporte de invierno", "Algo rojo", "Algo que pica", "Un animal que da miedo", "Un monumento famoso",
  "Un plato de la abuela", "Un héroe de videojuego", "Algo que hay en un bolso", "Un deporte con pelota", "Un dulce de pastelería",
  "Una capital de Latinoamérica",
];

const COUPLE = [
  "Nuestra serie del momento", "Nuestro próximo destino", "Un plato que siempre pedimos", "Nuestro plan de domingo", "Nuestra canción",
  "El nombre de nuestra futura mascota", "Nuestro restaurante favorito", "Algo que siempre nos hace reír", "El apodo que nos damos", "Quién cocina mejor (nombre)",
  "La primera peli que vimos juntos", "El sitio de nuestra primera cita", "Nuestro postre para compartir", "El peor defecto del otro", "La mejor cualidad del otro",
  "El plato que al otro siempre le sale mal", "Quién se duerme primero (nombre)", "Quién dijo «te quiero» primero (nombre)", "El país donde viviríamos", "El nombre de nuestro futuro hijo",
  "Nuestro emoji", "El regalo ideal para el otro", "Nuestro motivo de pelea n.º 1", "Nuestro rincón favorito de la casa", "El juego al que jugamos juntos",
  "Lo que cenamos en nuestra primera cena", "El animal que se parece al otro", "La estación favorita del otro", "El color favorito del otro", "El snack favorito del otro",
  "El cantante favorito del otro", "Una palabra que nos describe", "Quién es más celoso (nombre)", "Quién llega siempre tarde (nombre)", "Nuestro plan de vacaciones",
  "La peli que veríamos 100 veces",
];

const SPICY = [
  "Un sitio insólito para besarse", "La parte del cuerpo del otro que más me gusta", "Una palabra para nuestra última noche", "Una prenda que vuelve loco/a al otro", "Un sitio donde nunca nos hemos atrevido",
  "El apodo pícaro del otro", "Un color de lencería", "Un perfume que te derrite", "Una habitación de la casa (que no sea el dormitorio)", "El mejor momento del día para unos mimos",
  "Una peli que sube la temperatura", "Una canción para crear ambiente", "Un accesorio para darle chispa", "Una comida sexy", "Lo que el otro se pone para dormir",
  "Una palabra bonita para susurrar", "Una zona del cuerpo para un masaje", "Lo primero que te fijas del otro", "Un destino para una escapada en pareja", "Un juego pícaro",
  "Un disfraz para un juego de rol", "Una zona del cuerpo para besar", "Una bebida para una cita a solas", "Un olor que te vuelve loco/a", "Una fantasía en una palabra",
  "El mueble más resistente de la casa", "Una palabra para nuestros besos", "La prenda del otro que más me gusta quitarle", "Una textura que da ganas de tocar", "Un postre para compartir en la cama",
  "Un emoji pícaro", "Lo primero que hacemos al volver de una cita", "Un sitio para un baño a medianoche",
];

export const PROMPTS_ES: Prompt[] = [
  ...SOFT.map((text) => ({ text, tier: "soft" as const })),
  ...COUPLE.map((text) => ({ text, tier: "couple" as const })),
  ...SPICY.map((text) => ({ text, tier: "spicy" as const })),
];
