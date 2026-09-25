// Übersetzungen für die Oberfläche. Wird als erste Datei geladen, damit
// alle anderen Dateien t("schluessel") benutzen können.

const STRINGS = {
  de: {
    title: "Schach",
    gegner_label: "Gegner",
    opt_computer_schwarz: "Computer (ich bin Weiß)",
    opt_computer_weiss: "Computer (ich bin Schwarz)",
    opt_zwei: "Zwei Spieler",
    staerke_label: "Stärke",
    stufe1: "1 - Anfänger",
    stufe2: "2 - Mittel",
    stufe3: "3 - Stark",
    stufe4: "4 - Sehr stark (langsamer)",
    sprache_label: "Sprache",
    neues_spiel: "Neues Spiel",
    zuege_ueberschrift: "Züge",
    spalte_nr: "Nr.",
    weiss: "Weiß",
    schwarz: "Schwarz",
    am_zug: "Am Zug: {0}",
    am_zug_schach: "Am Zug: {0} - Schach!",
    schachmatt: "Schachmatt! {0} gewinnt.",
    patt: "Patt - Remis.",
    umwandlung_waehlen: "Bauernumwandlung: Wähle eine Figur",
    computer_denkt: "Computer denkt ...",
    info_zieht: "Computer spielt {0}. ",
    info_matt_in: "Er sieht ein Schachmatt in {0} Zügen",
    info_matt_gegen: "Er sieht, dass er in {0} Zügen matt gesetzt wird",
    info_bewertung: "Bewertung {0} (aus Sicht von Weiß)",
    info_suchtiefe: "Suchtiefe {0}, {1} Stellungen geprüft in {2} s.",
    schliessen: "Schließen",
    gewonnen: "Du hast gewonnen!",
    verloren: "Du hast verloren.",
    remis_banner: "Patt – Remis!",
    gewinnt_banner: "{0} gewinnt!",
    katze_minus: "− Katze",
    katze_plus: "+ Katze",
    katze_anzahl_ein: "1 Katze",
    katze_anzahl_mehr: "{0} Katzen"
  },
  en: {
    title: "Chess",
    gegner_label: "Opponent",
    opt_computer_schwarz: "Computer (I play White)",
    opt_computer_weiss: "Computer (I play Black)",
    opt_zwei: "Two players",
    staerke_label: "Strength",
    stufe1: "1 - Beginner",
    stufe2: "2 - Medium",
    stufe3: "3 - Strong",
    stufe4: "4 - Very strong (slower)",
    sprache_label: "Language",
    neues_spiel: "New game",
    zuege_ueberschrift: "Moves",
    spalte_nr: "No.",
    weiss: "White",
    schwarz: "Black",
    am_zug: "{0} to move",
    am_zug_schach: "{0} to move - Check!",
    schachmatt: "Checkmate! {0} wins.",
    patt: "Stalemate - Draw.",
    umwandlung_waehlen: "Pawn promotion: choose a piece",
    computer_denkt: "Computer is thinking ...",
    info_zieht: "Computer plays {0}. ",
    info_matt_in: "It sees a checkmate in {0} moves",
    info_matt_gegen: "It sees that it will be checkmated in {0} moves",
    info_bewertung: "Evaluation {0} (from White's perspective)",
    info_suchtiefe: "Search depth {0}, {1} positions checked in {2} s.",
    schliessen: "Close",
    gewonnen: "You won!",
    verloren: "You lost.",
    remis_banner: "Stalemate – Draw!",
    gewinnt_banner: "{0} wins!",
    katze_minus: "− Cat",
    katze_plus: "+ Cat",
    katze_anzahl_ein: "1 Cat",
    katze_anzahl_mehr: "{0} Cats"
  },
  bg: {
    title: "Шахмат",
    gegner_label: "Противник",
    opt_computer_schwarz: "Компютър (аз играя с бели)",
    opt_computer_weiss: "Компютър (аз играя с черни)",
    opt_zwei: "Двама играчи",
    staerke_label: "Сила",
    stufe1: "1 - Начинаещ",
    stufe2: "2 - Среден",
    stufe3: "3 - Силен",
    stufe4: "4 - Много силен (по-бавно)",
    sprache_label: "Език",
    neues_spiel: "Нова игра",
    zuege_ueberschrift: "Ходове",
    spalte_nr: "№",
    weiss: "Бели",
    schwarz: "Черни",
    am_zug: "На ход: {0}",
    am_zug_schach: "На ход: {0} - Шах!",
    schachmatt: "Мат! {0} печели.",
    patt: "Пат - Реми.",
    umwandlung_waehlen: "Превръщане на пешка: избери фигура",
    computer_denkt: "Компютърът мисли ...",
    info_zieht: "Компютърът играе {0}. ",
    info_matt_in: "Вижда мат след {0} хода",
    info_matt_gegen: "Вижда, че ще бъде матиран след {0} хода",
    info_bewertung: "Оценка {0} (от гледна точка на белите)",
    info_suchtiefe: "Дълбочина {0}, {1} позиции проверени за {2} с.",
    schliessen: "Затвори",
    gewonnen: "Ти спечели!",
    verloren: "Ти загуби.",
    remis_banner: "Пат – Реми!",
    gewinnt_banner: "{0} печели!",
    katze_minus: "− Котка",
    katze_plus: "+ Котка",
    katze_anzahl_ein: "1 котка",
    katze_anzahl_mehr: "{0} котки"
  }
};

// aktuelle Sprache, im Browser gespeichert, damit sie nach dem Neuladen erhalten bleibt
let SPRACHE = localStorage.getItem("schach_sprache") || "de";
if (!STRINGS[SPRACHE]) {
  SPRACHE = "de";
}

// holt den Text zu einem Schlüssel und setzt {0}, {1}, ... ein
function t(schluessel, ...werte) {
  let text = (STRINGS[SPRACHE] && STRINGS[SPRACHE][schluessel]) || STRINGS.de[schluessel] || schluessel;
  werte.forEach((wert, i) => {
    text = text.replace("{" + i + "}", wert);
  });
  return text;
}

// Buchstaben für die Zugliste, je nach Sprache unterschiedlich
const BUCHSTABEN_JE_SPRACHE = {
  de: { koenig: "K", dame: "D", turm: "T", laeufer: "L", springer: "S", bauer: "" },
  en: { koenig: "K", dame: "Q", turm: "R", laeufer: "B", springer: "N", bauer: "" },
  bg: { koenig: "Кр", dame: "Д", turm: "Т", laeufer: "О", springer: "К", bauer: "" }
};
const BUCHSTABEN = BUCHSTABEN_JE_SPRACHE[SPRACHE];

// rundet und benutzt je nach Sprache Punkt oder Komma als Dezimaltrennzeichen
function formatZahl(zahl, nachkommastellen) {
  const text = zahl.toFixed(nachkommastellen);
  return SPRACHE === "en" ? text : text.replace(".", ",");
}

// wechselt die Sprache und lädt die Seite neu, damit überall der neue Text erscheint
function setzeSprache(neu) {
  localStorage.setItem("schach_sprache", neu);
  location.reload();
}

// überträgt alle Texte, die mit data-i18n markiert sind
function uebersetzeSeite() {
  document.title = t("title");
  document.querySelectorAll("[data-i18n]").forEach(el => {
    el.textContent = t(el.getAttribute("data-i18n"));
  });
  const sprachauswahl = document.getElementById("sprache");
  if (sprachauswahl) {
    sprachauswahl.value = SPRACHE;
    sprachauswahl.addEventListener("change", () => setzeSprache(sprachauswahl.value));
  }
}
document.addEventListener("DOMContentLoaded", uebersetzeSeite);