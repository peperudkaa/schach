// Entspricht den Enums Farbe und Figurenart aus Java (hier einfach Texte)
const WEISS = "weiss";
const SCHWARZ = "schwarz";

// Richtungen als [Zeilenänderung, Spaltenänderung]
const GERADE = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const DIAGONAL = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
const ALLE = GERADE.concat(DIAGONAL);
const SPRINGER = [
  [2, 1], [2, -1], [-2, 1], [-2, -1], [1, 2], [1, -2], [-1, 2], [-1, -2]
];

const brettElement = document.getElementById("brett");
const reihenElement = document.getElementById("reihen");
const dateienElement = document.getElementById("dateien");
const geschlagenObenElement = document.getElementById("geschlagenOben");
const geschlagenUntenElement = document.getElementById("geschlagenUnten");
const statusElement = document.getElementById("status");
const umwandlungElement = document.getElementById("umwandlung");
const zuglisteElement = document.getElementById("zugliste");
const zugscrollElement = document.getElementById("zugscroll");
const gegnerElement = document.getElementById("gegner");
const stufeElement = document.getElementById("stufe");
const neuesSpielElement = document.getElementById("neuesSpiel");
const infoElement = document.getElementById("computerinfo");

// Elemente der Online-Lobby
const onlineBereichElement = document.getElementById("onlineBereich");
const onlineErstellenKnopfElement = document.getElementById("onlineErstellenKnopf");
const onlineZugangsdatenElement = document.getElementById("onlineZugangsdaten");
const onlineCodeElement = document.getElementById("onlineCode");
const onlineLinkElement = document.getElementById("onlineLink");
const onlineLinkKopierenElement = document.getElementById("onlineLinkKopieren");
const onlineCodeEingabeElement = document.getElementById("onlineCodeEingabe");
const onlineBeitretenKnopfElement = document.getElementById("onlineBeitretenKnopf");
const onlineStatusElement = document.getElementById("onlineStatus");

// ---------- Figuren als Unicode-Schachsymbole ----------

// Nur der "schwarze" Zeichensatz wird verwendet: die eigentlich für Weiß
// vorgesehenen Unicode-Zeichen (U+2654-2659) werden von vielen Schriftarten
// genauso ausgefüllt dargestellt wie die schwarzen - man sieht dann keinen
// Unterschied. Stattdessen wird die Farbe selbst per CSS gesetzt
// (.figur-weiss / .figur-schwarz), das funktioniert zuverlässig überall.
const FIGURENSYMBOL = {
  koenig: "\u265A",
  dame: "\u265B",
  turm: "\u265C",
  laeufer: "\u265D",
  springer: "\u265E",
  bauer: "\u265F"
};

function figurElement(farbe, art) {
  const span = document.createElement("span");
  span.className = "figur " + (farbe === WEISS ? "figur-weiss" : "figur-schwarz");
  span.textContent = FIGURENSYMBOL[art];
  return span;
}

// ---------- Pixel-Muster für die Felder ----------

// Ein Punkt ist die Grundfarbe, s = etwas dunkler, h = etwas heller.
const KACHEL_HELL = [
  "............",
  "..s.....h...",
  "............",
  "......s.....",
  ".h..........",
  "........s...",
  "....h.......",
  ".s..........",
  "..........h.",
  ".......s....",
  "...h........",
  "............"
];

const KACHEL_DUNKEL = [
  "............",
  "....s.......",
  ".h..........",
  "........h...",
  "..s.........",
  ".........s..",
  "......h.....",
  "s...........",
  "....h.......",
  ".........h..",
  "..s.........",
  "......s....."
];

function erstelleKachel(muster, farben) {
  const leinwand = document.createElement("canvas");
  leinwand.width = muster[0].length;
  leinwand.height = muster.length;
  const ctx = leinwand.getContext("2d");
  ctx.fillStyle = farben["."];
  ctx.fillRect(0, 0, leinwand.width, leinwand.height);
  for (let y = 0; y < muster.length; y++) {
    for (let x = 0; x < muster[y].length; x++) {
      const zeichen = muster[y][x];
      if (zeichen !== ".") {
        ctx.fillStyle = farben[zeichen];
        ctx.fillRect(x, y, 1, 1);
      }
    }
  }
  return leinwand.toDataURL();
}

document.documentElement.style.setProperty("--kachel-hell",
  "url(" + erstelleKachel(KACHEL_HELL, { ".": "#fde7ee", s: "#f9d6e2", h: "#fff3f7" }) + ")");
document.documentElement.style.setProperty("--kachel-dunkel",
  "url(" + erstelleKachel(KACHEL_DUNKEL, { ".": "#f4b6c8", s: "#ec9db5", h: "#f9cdda" }) + ")");

// ---------- Brett und Startaufstellung ----------

// brett[zeile][spalte], null = leeres Feld (wie das Figur[8][8] in Java)
function leeresBrett() {
  const brett = [];
  for (let zeile = 0; zeile < 8; zeile++) {
    brett.push(new Array(8).fill(null));
  }
  return brett;
}

function neueStartaufstellung() {
  const brett = leeresBrett();
  const grundreihe = [
    "turm", "springer", "laeufer", "dame", "koenig", "laeufer", "springer", "turm"
  ];
  for (let spalte = 0; spalte < 8; spalte++) {
    brett[0][spalte] = { farbe: WEISS, art: grundreihe[spalte] };
    brett[1][spalte] = { farbe: WEISS, art: "bauer" };
    brett[6][spalte] = { farbe: SCHWARZ, art: "bauer" };
    brett[7][spalte] = { farbe: SCHWARZ, art: grundreihe[spalte] };
  }
  return brett;
}

// Testpositionen: erreichbar über die Adresszeile, z.B. index.html?test=rochade
function testBrett(name) {
  const b = leeresBrett();
  if (name === "umwandlung") {
    b[6][0] = { farbe: WEISS, art: "bauer" };    // a7
    b[0][4] = { farbe: WEISS, art: "koenig" };   // e1
    b[7][7] = { farbe: SCHWARZ, art: "koenig" }; // h8
    return b;
  }
  if (name === "enpassant") {
    b[4][4] = { farbe: WEISS, art: "bauer" };    // e5
    b[6][3] = { farbe: SCHWARZ, art: "bauer" };  // d7
    b[0][4] = { farbe: WEISS, art: "koenig" };   // e1
    b[7][7] = { farbe: SCHWARZ, art: "koenig" }; // h8
    return b;
  }
  if (name === "rochade") {
    // nur Könige und Türme in der Grundstellung
    b[0][4] = { farbe: WEISS, art: "koenig" };   // e1
    b[0][0] = { farbe: WEISS, art: "turm" };     // a1
    b[0][7] = { farbe: WEISS, art: "turm" };     // h1
    b[7][4] = { farbe: SCHWARZ, art: "koenig" }; // e8
    b[7][0] = { farbe: SCHWARZ, art: "turm" };   // a8
    b[7][7] = { farbe: SCHWARZ, art: "turm" };   // h8
    return b;
  }
  return null;
}

const testName = new URLSearchParams(window.location.search).get("test");
const brett = testBrett(testName) || neueStartaufstellung();
let amZug = testName === "enpassant" ? SCHWARZ : WEISS; // im En-passant-Test beginnt Schwarz
let ausgewaehlt = null;     // {zeile, spalte} oder null, wenn nichts angeklickt ist
let umwandlung = null;      // der Zug, solange auf die Wahl der Figur gewartet wird
let enPassantFeld = null;   // Feld, das ein Bauer beim letzten Doppelschritt übersprungen hat
let spielVorbei = false;
let computerDenkt = false;  // true, solange der Computer gerade rechnet
const zugListe = [];        // Einträge der Zugliste: { farbe, text }

// Geschlagene Figuren, sortiert nach Farbe der geschlagenen Figur
const geschlagenFiguren = { weiss: [], schwarz: [] };
const ANZEIGE_REIHENFOLGE = ["dame", "turm", "laeufer", "springer", "bauer"];

// Rochaderechte pro Farbe: kurz = Königsseite (Turm h), lang = Damenseite (Turm a)
const rochadeRechte = {
  weiss:   { kurz: true, lang: true },
  schwarz: { kurz: true, lang: true }
};

// ---------- Zuggenerator (entspricht Zuggenerator.java) ----------

// Entspricht Position.istGueltig
function istGueltig(zeile, spalte) {
  return zeile >= 0 && zeile < 8 && spalte >= 0 && spalte < 8;
}

// Ein Zug ist ein kleines Objekt: { von: {zeile, spalte}, nach: {zeile, spalte} }
// Bei En passant kommt enPassant: true dazu, bei einer Rochade rochade: true.
function moeglicheZuege(brett, von) {
  const zuege = [];
  const figur = brett[von.zeile][von.spalte];
  if (figur === null) {
    return zuege;
  }

  switch (figur.art) {
    case "turm":     gleiten(brett, von, figur, GERADE, zuege); break;
    case "laeufer":  gleiten(brett, von, figur, DIAGONAL, zuege); break;
    case "dame":     gleiten(brett, von, figur, ALLE, zuege); break;
    case "springer": springen(brett, von, figur, SPRINGER, zuege); break;
    case "koenig":
      springen(brett, von, figur, ALLE, zuege);
      rochade(brett, von, figur, zuege);
      break;
    case "bauer":    bauer(brett, von, figur, zuege); break;
  }
  return zuege;
}

// Läuft in jede Richtung, bis Rand oder Figur im Weg ist
function gleiten(brett, von, figur, richtungen, zuege) {
  for (const r of richtungen) {
    let zeile = von.zeile + r[0];
    let spalte = von.spalte + r[1];
    while (istGueltig(zeile, spalte)) {
      const imWeg = brett[zeile][spalte];
      if (imWeg === null) {
        zuege.push({ von: von, nach: { zeile: zeile, spalte: spalte } });
      } else {
        if (imWeg.farbe !== figur.farbe) {
          zuege.push({ von: von, nach: { zeile: zeile, spalte: spalte } }); // schlagen
        }
        break; // dahinter geht es nicht weiter
      }
      zeile += r[0];
      spalte += r[1];
    }
  }
}

// Jede Richtung nur ein einziges Mal probieren
function springen(brett, von, figur, richtungen, zuege) {
  for (const r of richtungen) {
    const zeile = von.zeile + r[0];
    const spalte = von.spalte + r[1];
    if (!istGueltig(zeile, spalte)) {
      continue;
    }
    const imWeg = brett[zeile][spalte];
    if (imWeg === null || imWeg.farbe !== figur.farbe) {
      zuege.push({ von: von, nach: { zeile: zeile, spalte: spalte } });
    }
  }
}

// Bauer: vorwärts nur auf freie Felder, schlagen nur schräg
function bauer(brett, von, figur, zuege) {
  const richtung = figur.farbe === WEISS ? 1 : -1;
  const startzeile = figur.farbe === WEISS ? 1 : 6;
  const zeile = von.zeile + richtung;
  const spalte = von.spalte;

  // ein Feld vorwärts
  if (istGueltig(zeile, spalte) && brett[zeile][spalte] === null) {
    zuege.push({ von: von, nach: { zeile: zeile, spalte: spalte } });

    // zwei Felder vorwärts von der Startreihe
    const zeile2 = zeile + richtung;
    if (von.zeile === startzeile && brett[zeile2][spalte] === null) {
      zuege.push({ von: von, nach: { zeile: zeile2, spalte: spalte } });
    }
  }

  // schräg schlagen (links und rechts), auch En passant
  for (const ds of [-1, 1]) {
    const s = spalte + ds;
    if (istGueltig(zeile, s)) {
      const ziel = brett[zeile][s];
      if (ziel !== null && ziel.farbe !== figur.farbe) {
        zuege.push({ von: von, nach: { zeile: zeile, spalte: s } });
      } else if (ziel === null && enPassantFeld !== null
                 && enPassantFeld.zeile === zeile && enPassantFeld.spalte === s) {
        // daneben muss der gegnerische Bauer stehen, der gerade gezogen ist
        const nebenan = brett[von.zeile][s];
        if (nebenan !== null && nebenan.art === "bauer" && nebenan.farbe !== figur.farbe) {
          zuege.push({ von: von, nach: { zeile: zeile, spalte: s }, enPassant: true });
        }
      }
    }
  }
}

// Rochade: Recht noch da, Turm steht, Felder dazwischen frei.
// Ob der König dabei im Schach steht oder über ein bedrohtes Feld zieht,
// prüft legaleZuege (über rochadeWegSicher).
function rochade(brett, von, figur, zuege) {
  const farbe = figur.farbe;
  const zeile = farbe === WEISS ? 0 : 7;
  if (von.zeile !== zeile || von.spalte !== 4) {
    return;
  }
  const rechte = rochadeRechte[farbe];

  // kurz: Turm auf h, Felder f und g frei
  if (rechte.kurz && istEigenerTurm(brett, zeile, 7, farbe)
      && brett[zeile][5] === null && brett[zeile][6] === null) {
    zuege.push({ von: von, nach: { zeile: zeile, spalte: 6 }, rochade: true });
  }
  // lang: Turm auf a, Felder b, c und d frei
  if (rechte.lang && istEigenerTurm(brett, zeile, 0, farbe)
      && brett[zeile][1] === null && brett[zeile][2] === null && brett[zeile][3] === null) {
    zuege.push({ von: von, nach: { zeile: zeile, spalte: 2 }, rochade: true });
  }
}

function istEigenerTurm(brett, zeile, spalte, farbe) {
  const f = brett[zeile][spalte];
  return f !== null && f.art === "turm" && f.farbe === farbe;
}

// ---------- Schach (entspricht dem Schach-Teil von Zuggenerator.java) ----------

// Sucht den König einer Farbe (entspricht Brett.findeKoenig)
function findeKoenig(brett, farbe) {
  for (let zeile = 0; zeile < 8; zeile++) {
    for (let spalte = 0; spalte < 8; spalte++) {
      const f = brett[zeile][spalte];
      if (f !== null && f.art === "koenig" && f.farbe === farbe) {
        return { zeile: zeile, spalte: spalte };
      }
    }
  }
  return null;
}

// Wird das Feld von einer Figur der Farbe "angreifer" angegriffen?
function wirdAngegriffen(brett, zeile, spalte, angreifer) {
  const bauernZeile = angreifer === WEISS ? zeile - 1 : zeile + 1;
  for (const ds of [-1, 1]) {
    if (istGueltig(bauernZeile, spalte + ds)) {
      const f = brett[bauernZeile][spalte + ds];
      if (f !== null && f.farbe === angreifer && f.art === "bauer") {
        return true;
      }
    }
  }

  for (const r of SPRINGER) {
    const z = zeile + r[0];
    const s = spalte + r[1];
    if (istGueltig(z, s)) {
      const f = brett[z][s];
      if (f !== null && f.farbe === angreifer && f.art === "springer") {
        return true;
      }
    }
  }

  for (const r of ALLE) {
    const z = zeile + r[0];
    const s = spalte + r[1];
    if (istGueltig(z, s)) {
      const f = brett[z][s];
      if (f !== null && f.farbe === angreifer && f.art === "koenig") {
        return true;
      }
    }
  }

  const linien = [[GERADE, "turm"], [DIAGONAL, "laeufer"]];
  for (const [richtungen, art] of linien) {
    for (const r of richtungen) {
      let z = zeile + r[0];
      let s = spalte + r[1];
      while (istGueltig(z, s)) {
        const f = brett[z][s];
        if (f !== null) {
          if (f.farbe === angreifer && (f.art === art || f.art === "dame")) {
            return true;
          }
          break;
        }
        z += r[0];
        s += r[1];
      }
    }
  }
  return false;
}

// Steht der König dieser Farbe im Schach?
function istImSchach(brett, farbe) {
  const koenig = findeKoenig(brett, farbe);
  if (koenig === null) {
    return false;
  }
  return wirdAngegriffen(brett, koenig.zeile, koenig.spalte, farbe === WEISS ? SCHWARZ : WEISS);
}

// Rochade nur, wenn der König nicht im Schach steht und das Feld, über das er
// zieht, nicht bedroht ist. (Das Zielfeld prüft legaleZuege wie bei jedem Zug.)
function rochadeWegSicher(brett, zug, farbe) {
  if (istImSchach(brett, farbe)) {
    return false;
  }
  const zeile = zug.von.zeile;
  const zwischen = (zug.von.spalte + zug.nach.spalte) / 2; // f (5) oder d (3)
  const koenig = brett[zeile][zug.von.spalte];

  // König probeweise aufs Zwischenfeld stellen
  brett[zeile][zwischen] = koenig;
  brett[zeile][zug.von.spalte] = null;
  const imSchach = istImSchach(brett, farbe);
  brett[zeile][zug.von.spalte] = koenig;
  brett[zeile][zwischen] = null;

  return !imSchach;
}

// Nur Züge, nach denen der eigene König nicht im Schach steht
function legaleZuege(brett, von) {
  const legal = [];
  const figur = brett[von.zeile][von.spalte];
  if (figur === null) {
    return legal;
  }
  for (const zug of moeglicheZuege(brett, von)) {
    if (zug.rochade && !rochadeWegSicher(brett, zug, figur.farbe)) {
      continue;
    }

    // Bei En passant steht der geschlagene Bauer neben dem Start, nicht auf dem Ziel
    const geschlagenPos = zug.enPassant
      ? { zeile: von.zeile, spalte: zug.nach.spalte }
      : zug.nach;

    // Zug ausprobieren
    const geschlagen = brett[geschlagenPos.zeile][geschlagenPos.spalte];
    brett[geschlagenPos.zeile][geschlagenPos.spalte] = null;
    brett[zug.nach.zeile][zug.nach.spalte] = figur;
    brett[von.zeile][von.spalte] = null;

    // Rochade: den Turm mitziehen
    let turmVon = 0;
    let turmNach = 0;
    if (zug.rochade) {
      const kurz = zug.nach.spalte === 6;
      turmVon = kurz ? 7 : 0;
      turmNach = kurz ? 5 : 3;
      brett[von.zeile][turmNach] = brett[von.zeile][turmVon];
      brett[von.zeile][turmVon] = null;
    }

    const imSchach = istImSchach(brett, figur.farbe);

    // Zug zurücknehmen
    if (zug.rochade) {
      brett[von.zeile][turmVon] = brett[von.zeile][turmNach];
      brett[von.zeile][turmNach] = null;
    }
    brett[von.zeile][von.spalte] = figur;
    brett[zug.nach.zeile][zug.nach.spalte] = null;
    brett[geschlagenPos.zeile][geschlagenPos.spalte] = geschlagen;

    if (!imSchach) {
      legal.push(zug);
    }
  }
  return legal;
}

// Alle legalen Züge aller Figuren einer Farbe (entspricht Spielende.alleLegalenZuege)
function alleLegalenZuege(brett, farbe) {
  const alle = [];
  for (let zeile = 0; zeile < 8; zeile++) {
    for (let spalte = 0; spalte < 8; spalte++) {
      const f = brett[zeile][spalte];
      if (f !== null && f.farbe === farbe) {
        alle.push(...legaleZuege(brett, { zeile: zeile, spalte: spalte }));
      }
    }
  }
  return alle;
}

// ---------- Geschlagene Figuren ----------

// Merkt sich vor dem Ausführen eines Zugs, welche Figur dabei geschlagen wird
function erfasseSchlagfigur(zug) {
  const pos = zug.enPassant ? { zeile: zug.von.zeile, spalte: zug.nach.spalte } : zug.nach;
  const figur = brett[pos.zeile][pos.spalte];
  if (figur !== null) {
    geschlagenFiguren[figur.farbe].push(figur.art);
  }
}

// Zeigt die geschlagenen Figuren einer Farbe in einer Reihe, größere Figuren zuerst
function zeichneGeschlagen(element, farbe) {
  element.innerHTML = "";
  const liste = geschlagenFiguren[farbe]
    .slice()
    .sort((a, b) => ANZEIGE_REIHENFOLGE.indexOf(a) - ANZEIGE_REIHENFOLGE.indexOf(b));
  for (const art of liste) {
    element.appendChild(figurElement(farbe, art));
  }
}

// ---------- Zugliste ----------

// {zeile: 0, spalte: 4} -> "e1"
function feldName(p) {
  return "abcdefgh"[p.spalte] + (p.zeile + 1);
}

// Text eines Zugs, z.B. "e2-e4", "Sg1-f3", "d4xe5", "O-O", "a7-a8=D".
// Muss VOR dem Ausführen des Zugs aufgerufen werden (sonst ist die Figur schon weg).
function zugText(zug, umwandlungsArt) {
  if (zug.rochade) {
    return zug.nach.spalte === 6 ? "O-O" : "O-O-O";
  }
  const figur = brett[zug.von.zeile][zug.von.spalte];
  const schlag = zug.enPassant || brett[zug.nach.zeile][zug.nach.spalte] !== null;
  let text = BUCHSTABEN[figur.art] + feldName(zug.von) + (schlag ? "x" : "-") + feldName(zug.nach);
  if (umwandlungsArt) {
    text += "=" + BUCHSTABEN[umwandlungsArt];
  }
  if (zug.enPassant) {
    text += " e.p.";
  }
  return text;
}

// Trägt den Zug in die Liste ein. Aufrufen NACH dem Ausführen und Wechseln von amZug:
// Dann sieht man, ob der Gegner jetzt im Schach steht (+) oder matt ist (#).
function protokolliere(text) {
  let zusatz = "";
  if (istImSchach(brett, amZug)) {
    zusatz = alleLegalenZuege(brett, amZug).length === 0 ? "#" : "+";
  }
  const gezogen = amZug === WEISS ? SCHWARZ : WEISS;
  zugListe.push({ farbe: gezogen, text: text + zusatz });
}

// Baut die Tabelle neu auf: eine Zeile pro Zugnummer, Weiß links, Schwarz rechts
function zeichneZugliste() {
  zuglisteElement.innerHTML = "";
  let zeileElement = null;
  let nummer = 0;
  for (const eintrag of zugListe) {
    if (eintrag.farbe === WEISS || zeileElement === null) {
      nummer++;
      zeileElement = document.createElement("tr");
      for (const inhalt of [nummer + ".", "", ""]) {
        const zelle = document.createElement("td");
        zelle.textContent = inhalt;
        zeileElement.appendChild(zelle);
      }
      zuglisteElement.appendChild(zeileElement);
    }
    const spaltenIndex = eintrag.farbe === WEISS ? 1 : 2;
    zeileElement.children[spaltenIndex].textContent = eintrag.text;
  }
  // immer den neuesten Zug im Blick behalten
  zugscrollElement.scrollTop = zugscrollElement.scrollHeight;
}

// ---------- Spiel ----------

// Ein Recht geht verloren, wenn der König zieht oder ein Turm zieht/geschlagen wird
function aktualisiereRochaderechte(figur, zug) {
  if (figur.art === "koenig") {
    rochadeRechte[figur.farbe].kurz = false;
    rochadeRechte[figur.farbe].lang = false;
  }
  verliereRecht(zug.von);
  verliereRecht(zug.nach);
}

// Betrifft ein Zug eine Turm-Ecke, verfällt das zugehörige Recht
function verliereRecht(p) {
  if (p.zeile === 0 && p.spalte === 7) rochadeRechte.weiss.kurz = false;
  if (p.zeile === 0 && p.spalte === 0) rochadeRechte.weiss.lang = false;
  if (p.zeile === 7 && p.spalte === 7) rochadeRechte.schwarz.kurz = false;
  if (p.zeile === 7 && p.spalte === 0) rochadeRechte.schwarz.lang = false;
}

// Entspricht brett.ziehe(zug) aus Java
function ziehe(zug) {
  const figur = brett[zug.von.zeile][zug.von.spalte];

  if (zug.enPassant) {
    // der geschlagene Bauer steht neben dem Start, nicht auf dem Zielfeld
    brett[zug.von.zeile][zug.nach.spalte] = null;
  }
  brett[zug.nach.zeile][zug.nach.spalte] = figur;
  brett[zug.von.zeile][zug.von.spalte] = null;

  // Rochade: den Turm mitziehen
  if (zug.rochade) {
    const kurz = zug.nach.spalte === 6;
    const turmVon = kurz ? 7 : 0;
    const turmNach = kurz ? 5 : 3;
    brett[zug.von.zeile][turmNach] = brett[zug.von.zeile][turmVon];
    brett[zug.von.zeile][turmVon] = null;
  }

  aktualisiereRochaderechte(figur, zug);

  // nach einem Doppelschritt das übersprungene Feld merken, sonst vergessen
  enPassantFeld = null;
  if (figur.art === "bauer" && Math.abs(zug.nach.zeile - zug.von.zeile) === 2) {
    enPassantFeld = {
      zeile: (zug.von.zeile + zug.nach.zeile) / 2,
      spalte: zug.von.spalte
    };
  }
}

// ---------- Online spielen (PeerJS: direkte Verbindung zwischen zwei Browsern) ----------

let onlineAktiv = false;        // true, sobald man tatsächlich mit jemandem verbunden ist
let onlineFarbe = null;         // eigene Farbe im Online-Spiel
let onlinePeer = null;          // die eigene PeerJS-Instanz
let onlineVerbindung = null;    // die Datenverbindung zum Mitspieler

// Kurzer Code ohne leicht verwechselbare Zeichen (kein 0/O, kein 1/I)
function zufallsCode() {
  const zeichen = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 5; i++) {
    code += zeichen[Math.floor(Math.random() * zeichen.length)];
  }
  return code;
}

// Legt eine neue PeerJS-Verbindung an und reicht sie an die Callback-Funktionen weiter
function verbindungAufsetzen() {
  onlineVerbindung.on("open", () => {
    onlineAktiv = true;
    onlineStatusElement.textContent = onlineFarbe === WEISS
      ? "Verbunden! Du spielst Weiß."
      : "Verbunden! Du spielst Schwarz.";
    neuesSpiel();
  });

  onlineVerbindung.on("data", (nachricht) => {
    if (nachricht.typ === "zug") {
      wendeEntfernenZugAn(nachricht);
    } else if (nachricht.typ === "neuesSpiel") {
      neuesSpiel();
    }
  });

  onlineVerbindung.on("close", () => {
    onlineStatusElement.textContent = "Verbindung getrennt.";
    onlineAktiv = false;
  });
}

// Erstellt ein neues Online-Spiel: eigener Code, man selbst spielt Weiß
function onlineSpielErstellen() {
  const code = zufallsCode();
  onlineFarbe = WEISS;
  onlineStatusElement.textContent = "Lobby wird erstellt \u2026";
  onlinePeer = new Peer("schach-" + code);

  onlinePeer.on("open", () => {
    onlineCodeElement.textContent = code;
    const link = window.location.origin + window.location.pathname + "?spiel=" + code;
    onlineLinkElement.value = link;
    onlineZugangsdatenElement.classList.add("aktiv");
    onlineStatusElement.textContent = "Warte auf Mitspieler \u2026 Code oder Link weitergeben.";
  });

  onlinePeer.on("connection", (verbindung) => {
    onlineVerbindung = verbindung;
    verbindungAufsetzen();
  });

  onlinePeer.on("error", (fehler) => {
    onlineStatusElement.textContent = "Verbindungsfehler (" + fehler.type + ").";
  });
}

// Tritt einem bestehenden Online-Spiel bei: man selbst spielt Schwarz
function onlineSpielBeitreten(code) {
  code = code.trim().toUpperCase();
  if (code === "") {
    return;
  }
  onlineFarbe = SCHWARZ;
  onlineStatusElement.textContent = "Verbinde \u2026";
  onlinePeer = new Peer();

  onlinePeer.on("open", () => {
    onlineVerbindung = onlinePeer.connect("schach-" + code);
    verbindungAufsetzen();
  });

  onlinePeer.on("error", (fehler) => {
    onlineStatusElement.textContent = "Verbindungsfehler (" + fehler.type + "). Stimmt der Code?";
  });
}

// Schickt den eigenen Zug an den Mitspieler
function sendeZug(zug, umwandlungsArt) {
  if (onlineVerbindung === null || !onlineVerbindung.open) {
    return;
  }
  onlineVerbindung.send({
    typ: "zug",
    von: zug.von,
    nach: zug.nach,
    enPassant: !!zug.enPassant,
    rochade: !!zug.rochade,
    umwandlung: umwandlungsArt || null
  });
}

// Wendet einen vom Mitspieler erhaltenen Zug auf das eigene Brett an
function wendeEntfernenZugAn(nachricht) {
  const zug = {
    von: nachricht.von,
    nach: nachricht.nach,
    enPassant: nachricht.enPassant,
    rochade: nachricht.rochade
  };
  const farbeVorDemZug = amZug;
  const text = zugText(zug, nachricht.umwandlung);
  erfasseSchlagfigur(zug);
  ziehe(zug);
  if (nachricht.umwandlung) {
    brett[zug.nach.zeile][zug.nach.spalte] = { farbe: farbeVorDemZug, art: nachricht.umwandlung };
  }
  ausgewaehlt = null;
  amZug = amZug === WEISS ? SCHWARZ : WEISS;
  protokolliere(text);
  zeichneBrett();
}

// ---------- Computergegner (die Rechnerei steht in computer.js) ----------

// Welche Farbe spielt der Computer? null = zwei Spieler
function computerFarbe() {
  const wahl = gegnerElement.value;
  if (wahl === "computer-schwarz") return SCHWARZ;
  if (wahl === "computer-weiss") return WEISS;
  return null;
}

function istComputerAmZug() {
  return computerFarbe() === amZug;
}

// Ist der Computer dran? Dann lassen wir ihn (kurz verzögert, damit "Computer denkt" erscheint)
function pruefeComputer() {
  if (computerDenkt || spielVorbei || umwandlung !== null || !istComputerAmZug()) {
    return;
  }
  computerDenkt = true;
  statusElement.textContent = t("computer_denkt");
  setTimeout(computerZieht, 200);
}

// Rechnet den Zug aus, wartet dann noch ein Stück, damit es nicht zu abrupt wirkt
function computerZieht() {
  if (spielVorbei || umwandlung !== null || !istComputerAmZug()) {
    computerDenkt = false;
    return;
  }

  const farbe = amZug;
  const tiefe = Number(stufeElement.value);
  const start = performance.now();
  const ergebnis = findeBestenZug(farbe, tiefe);
  const dauer = performance.now() - start;

  if (ergebnis === null) {
    computerDenkt = false;
    zeichneBrett();
    return;
  }

  // Mindestens eine knappe Sekunde warten, damit der Zug nachvollziehbar bleibt
  const wartezeit = Math.max(600, 1000 - dauer);
  setTimeout(() => fuehreComputerzugAus(ergebnis, tiefe, dauer), wartezeit);
}

// Führt den vom Computer gefundenen Zug wirklich aus
function fuehreComputerzugAus(ergebnis, tiefe, dauer) {
  computerDenkt = false;
  if (spielVorbei || umwandlung !== null || !istComputerAmZug()) {
    return;
  }

  const farbe = amZug;
  const zug = ergebnis.zug;
  const bewegt = brett[zug.von.zeile][zug.von.spalte];
  const wirdDame = bewegt.art === "bauer" && zug.nach.zeile === (farbe === WEISS ? 7 : 0);
  const text = zugText(zug, wirdDame ? "dame" : null);

  erfasseSchlagfigur(zug);
  ziehe(zug);
  if (wirdDame) {
    brett[zug.nach.zeile][zug.nach.spalte] = { farbe: farbe, art: "dame" };
  }
  ausgewaehlt = null;
  amZug = farbe === WEISS ? SCHWARZ : WEISS;
  protokolliere(text);
  zeichneBrett();
  zeigeInfo(farbe, text, ergebnis, tiefe, dauer);
}

// Zeigt unter dem Brett, was der Computer gerechnet hat
function zeigeInfo(farbe, text, ergebnis, tiefe, dauer) {
  let bewertung;
  if (ergebnis.mattIn > 0) {
    bewertung = ergebnis.wert > 0
      ? t("info_matt_in", ergebnis.mattIn)
      : t("info_matt_gegen", ergebnis.mattIn);
  } else {
    // Die Bewertung immer aus Sicht von Weiß zeigen, in Bauern
    const weiss = farbe === WEISS ? ergebnis.wert : -ergebnis.wert;
    const zahl = (weiss >= 0 ? "+" : "") + formatZahl(weiss / 100, 2);
    bewertung = t("info_bewertung", zahl);
  }
  infoElement.textContent =
    t("info_zieht", text) + bewertung + ". " +
    t("info_suchtiefe", tiefe, ergebnis.geprueft, formatZahl(dauer / 1000, 1));
}

// Alles auf Anfang
function neuesSpiel() {
  const neu = neueStartaufstellung();
  for (let zeile = 0; zeile < 8; zeile++) {
    brett[zeile] = neu[zeile];
  }
  amZug = WEISS;
  ausgewaehlt = null;
  umwandlung = null;
  enPassantFeld = null;
  spielVorbei = false;
  zugListe.length = 0;
  geschlagenFiguren.weiss = [];
  geschlagenFiguren.schwarz = [];
  rochadeRechte.weiss.kurz = true;
  rochadeRechte.weiss.lang = true;
  rochadeRechte.schwarz.kurz = true;
  rochadeRechte.schwarz.lang = true;
  infoElement.textContent = "";
  zeichneBrett();
  pruefeComputer();
}

// Der Spieler hat eine Figur für die Umwandlung gewählt: Zug ausführen, Bauer ersetzen
function waehleUmwandlung(art) {
  const zugZumSenden = umwandlung;
  const bauer = brett[umwandlung.von.zeile][umwandlung.von.spalte];
  const text = zugText(umwandlung, art);
  erfasseSchlagfigur(umwandlung);
  ziehe(umwandlung);
  brett[umwandlung.nach.zeile][umwandlung.nach.spalte] = { farbe: bauer.farbe, art: art };
  umwandlung = null;
  amZug = amZug === WEISS ? SCHWARZ : WEISS;
  protokolliere(text);
  zeichneBrett();
  pruefeComputer();
  if (onlineAktiv) {
    sendeZug(zugZumSenden, art);
  }
}

function klickAufFeld(zeile, spalte) {
  // Gesperrt: Spiel vorbei, Umwandlung wird gewählt oder der Computer ist dran
  if (spielVorbei || umwandlung !== null || computerDenkt || istComputerAmZug()) {
    return;
  }
  // Im Online-Spiel: nur ziehen, wenn man selbst dran und verbunden ist
  if (onlineAktiv && (amZug !== onlineFarbe || onlineVerbindung === null || !onlineVerbindung.open)) {
    return;
  }
  const figur = brett[zeile][spalte];

  // 1. Ist ein Feld ausgewählt und das angeklickte Feld ein legales Ziel? Dann ziehen.
  if (ausgewaehlt !== null) {
    const zuege = legaleZuege(brett, ausgewaehlt);
    const zug = zuege.find(z => z.nach.zeile === zeile && z.nach.spalte === spalte);
    if (zug !== undefined) {
      const bewegt = brett[zug.von.zeile][zug.von.spalte];
      const letzteZeile = bewegt.farbe === WEISS ? 7 : 0;

      if (bewegt.art === "bauer" && zug.nach.zeile === letzteZeile) {
        // Umwandlung: erst die Figur wählen lassen, dann ziehen
        umwandlung = zug;
        ausgewaehlt = null;
        zeichneBrett();
        return;
      }

      const text = zugText(zug, null);
      erfasseSchlagfigur(zug);
      ziehe(zug);
      ausgewaehlt = null;
      amZug = amZug === WEISS ? SCHWARZ : WEISS;
      protokolliere(text);
      zeichneBrett();
      pruefeComputer();
      if (onlineAktiv) {
        sendeZug(zug, null);
      }
      return;
    }
  }

  // 2. Sonst: eigene Figur auswählen, dasselbe Feld nochmal hebt die Auswahl auf
  const gleichesFeld = ausgewaehlt !== null
    && ausgewaehlt.zeile === zeile && ausgewaehlt.spalte === spalte;
  if (figur !== null && figur.farbe === amZug && !gleichesFeld) {
    ausgewaehlt = { zeile: zeile, spalte: spalte };
  } else {
    ausgewaehlt = null;
  }
  zeichneBrett();
}

// Zeichnet die Koordinaten passend zur aktuellen Ausrichtung des Bretts
function zeichneKoordinaten(gedreht) {
  reihenElement.innerHTML = "";
  for (let i = 0; i < 8; i++) {
    const zeile = gedreht ? i : 7 - i;
    const span = document.createElement("span");
    span.textContent = zeile + 1;
    reihenElement.appendChild(span);
  }

  dateienElement.innerHTML = "";
  for (let j = 0; j < 8; j++) {
    const spalte = gedreht ? 7 - j : j;
    const span = document.createElement("span");
    span.textContent = "abcdefgh"[spalte];
    dateienElement.appendChild(span);
  }
}

function zeichneBrett() {
  brettElement.innerHTML = "";

  const imSchach = istImSchach(brett, amZug);
  const koenigPos = imSchach ? findeKoenig(brett, amZug) : null;
  const zuege = ausgewaehlt !== null ? legaleZuege(brett, ausgewaehlt) : [];
  spielVorbei = alleLegalenZuege(brett, amZug).length === 0;

  // Spielst du Schwarz, wird das Brett gedreht, sodass deine Figuren unten stehen
  const gedreht = computerFarbe() === WEISS || (onlineAktiv && onlineFarbe === SCHWARZ);
  zeichneKoordinaten(gedreht);

  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      const zeile = gedreht ? i : 7 - i;
      const spalte = gedreht ? 7 - j : j;

      const feld = document.createElement("div");
      feld.className = "feld " + ((zeile + spalte) % 2 === 0 ? "dunkel" : "hell");
      const figur = brett[zeile][spalte];

      if (koenigPos !== null && koenigPos.zeile === zeile && koenigPos.spalte === spalte) {
        feld.classList.add("imschach");
      }

      if (ausgewaehlt !== null
          && ausgewaehlt.zeile === zeile && ausgewaehlt.spalte === spalte) {
        feld.classList.add("ausgewaehlt");
      }

      const istZiel = zuege.some(z => z.nach.zeile === zeile && z.nach.spalte === spalte);
      if (istZiel) {
        feld.classList.add(figur !== null ? "schlag" : "ziel");
      }

      if (figur !== null) {
        feld.appendChild(figurElement(figur.farbe, figur.art));
      }

      feld.addEventListener("click", () => klickAufFeld(zeile, spalte));
      brettElement.appendChild(feld);
    }
  }

  // Geschlagene Figuren: oben zeigt, was die obere Seite dem Gegner abgenommen hat
  const obenFarbe = gedreht ? WEISS : SCHWARZ;
  const untenFarbe = gedreht ? SCHWARZ : WEISS;
  zeichneGeschlagen(geschlagenObenElement, untenFarbe);
  zeichneGeschlagen(geschlagenUntenElement, obenFarbe);

  // Auswahl für die Bauernumwandlung (nur sichtbar, wenn gerade eine ansteht)
  umwandlungElement.innerHTML = "";
  if (umwandlung !== null) {
    for (const art of ["dame", "turm", "laeufer", "springer"]) {
      const knopf = document.createElement("button");
      knopf.className = "wahl";
      knopf.appendChild(figurElement(amZug, art));
      knopf.addEventListener("click", () => waehleUmwandlung(art));
      umwandlungElement.appendChild(knopf);
    }
    umwandlungElement.classList.add("aktiv");
  } else {
    umwandlungElement.classList.remove("aktiv");
  }

  const name = amZug === WEISS ? t("weiss") : t("schwarz");
  const gegner = amZug === WEISS ? t("schwarz") : t("weiss");
  if (umwandlung !== null) {
    statusElement.textContent = t("umwandlung_waehlen");
  } else if (spielVorbei && imSchach) {
    statusElement.textContent = t("schachmatt", gegner);
  } else if (spielVorbei) {
    statusElement.textContent = t("patt");
  } else if (imSchach) {
    statusElement.textContent = t("am_zug_schach", name);
  } else {
    statusElement.textContent = t("am_zug", name);
  }

  zeichneZugliste();
}

// ---------- Steuerung ----------

function onlinePanelAktualisieren() {
  if (gegnerElement.value === "online") {
    onlineBereichElement.classList.add("aktiv");
  } else {
    onlineBereichElement.classList.remove("aktiv");
  }
}

gegnerElement.addEventListener("change", () => {
  onlinePanelAktualisieren();
  zeichneBrett();
  pruefeComputer();
});

neuesSpielElement.addEventListener("click", () => {
  neuesSpiel();
  if (onlineAktiv && onlineVerbindung !== null && onlineVerbindung.open) {
    onlineVerbindung.send({ typ: "neuesSpiel" });
  }
});

onlineErstellenKnopfElement.addEventListener("click", onlineSpielErstellen);

onlineBeitretenKnopfElement.addEventListener("click", () => {
  onlineSpielBeitreten(onlineCodeEingabeElement.value);
});

onlineLinkKopierenElement.addEventListener("click", () => {
  onlineLinkElement.select();
  navigator.clipboard.writeText(onlineLinkElement.value).catch(() => {});
});

// Wurde die Seite über einen geteilten Link geöffnet (?spiel=CODE)? Dann direkt beitreten.
const geteilterCode = new URLSearchParams(window.location.search).get("spiel");
if (geteilterCode) {
  gegnerElement.value = "online";
  onlinePanelAktualisieren();
  onlineCodeEingabeElement.value = geteilterCode.toUpperCase();
  onlineSpielBeitreten(geteilterCode);
}

zeichneBrett();