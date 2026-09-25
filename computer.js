// Das "Gehirn" des Computers: Stellungen bewerten und den besten Zug suchen.
// Benutzt das Brett und die Regeln aus script.js.

// Wie viel ist eine Figur wert? (in Hundertstel-Bauern, ein Bauer = 100)
const FIGURWERT = { bauer: 100, springer: 320, laeufer: 330, turm: 500, dame: 900, koenig: 0 };

// So hoch wird "Schachmatt" bewertet
const MATT = 100000;

// Bonus oder Malus je nach Feld. Die Tabellen zeigen das Brett aus Sicht von Weiß
// (oben = 8. Reihe). Zum Beispiel sind Springer in der Mitte besser als am Rand.
const POSITIONSWERT = {
  bauer: [
    [ 0,  0,  0,  0,  0,  0,  0,  0],
    [50, 50, 50, 50, 50, 50, 50, 50],
    [10, 10, 20, 30, 30, 20, 10, 10],
    [ 5,  5, 10, 25, 25, 10,  5,  5],
    [ 0,  0,  0, 20, 20,  0,  0,  0],
    [ 5, -5,-10,  0,  0,-10, -5,  5],
    [ 5, 10, 10,-20,-20, 10, 10,  5],
    [ 0,  0,  0,  0,  0,  0,  0,  0]
  ],
  springer: [
    [-50,-40,-30,-30,-30,-30,-40,-50],
    [-40,-20,  0,  0,  0,  0,-20,-40],
    [-30,  0, 10, 15, 15, 10,  0,-30],
    [-30,  5, 15, 20, 20, 15,  5,-30],
    [-30,  0, 15, 20, 20, 15,  0,-30],
    [-30,  5, 10, 15, 15, 10,  5,-30],
    [-40,-20,  0,  5,  5,  0,-20,-40],
    [-50,-40,-30,-30,-30,-30,-40,-50]
  ],
  laeufer: [
    [-20,-10,-10,-10,-10,-10,-10,-20],
    [-10,  0,  0,  0,  0,  0,  0,-10],
    [-10,  0,  5, 10, 10,  5,  0,-10],
    [-10,  5,  5, 10, 10,  5,  5,-10],
    [-10,  0, 10, 10, 10, 10,  0,-10],
    [-10, 10, 10, 10, 10, 10, 10,-10],
    [-10,  5,  0,  0,  0,  0,  5,-10],
    [-20,-10,-10,-10,-10,-10,-10,-20]
  ],
  turm: [
    [ 0,  0,  0,  0,  0,  0,  0,  0],
    [ 5, 10, 10, 10, 10, 10, 10,  5],
    [-5,  0,  0,  0,  0,  0,  0, -5],
    [-5,  0,  0,  0,  0,  0,  0, -5],
    [-5,  0,  0,  0,  0,  0,  0, -5],
    [-5,  0,  0,  0,  0,  0,  0, -5],
    [-5,  0,  0,  0,  0,  0,  0, -5],
    [ 0,  0,  0,  5,  5,  0,  0,  0]
  ],
  dame: [
    [-20,-10,-10, -5, -5,-10,-10,-20],
    [-10,  0,  0,  0,  0,  0,  0,-10],
    [-10,  0,  5,  5,  5,  5,  0,-10],
    [ -5,  0,  5,  5,  5,  5,  0, -5],
    [  0,  0,  5,  5,  5,  5,  0, -5],
    [-10,  5,  5,  5,  5,  5,  0,-10],
    [-10,  0,  5,  0,  0,  0,  0,-10],
    [-20,-10,-10, -5, -5,-10,-10,-20]
  ],
  koenig: [
    [-30,-40,-40,-50,-50,-40,-40,-30],
    [-30,-40,-40,-50,-50,-40,-40,-30],
    [-30,-40,-40,-50,-50,-40,-40,-30],
    [-30,-40,-40,-50,-50,-40,-40,-30],
    [-20,-30,-30,-40,-40,-30,-30,-20],
    [-10,-20,-20,-20,-20,-20,-20,-10],
    [ 20, 20,  0,  0,  0,  0, 20, 20],
    [ 20, 30, 10,  0,  0, 10, 30, 20]
  ]
};

// Wie steht es gerade? Positive Zahl = Weiß steht besser, negative = Schwarz.
function bewertePosition() {
  let summe = 0;
  for (let zeile = 0; zeile < 8; zeile++) {
    for (let spalte = 0; spalte < 8; spalte++) {
      const f = brett[zeile][spalte];
      if (f === null) {
        continue;
      }
      const tabelle = POSITIONSWERT[f.art];
      // Für Schwarz wird die Tabelle umgedreht (seine Grundreihe ist unten in der Tabelle)
      const lage = f.farbe === WEISS ? tabelle[7 - zeile][spalte] : tabelle[zeile][spalte];
      const wert = FIGURWERT[f.art] + lage;
      summe += f.farbe === WEISS ? wert : -wert;
    }
  }
  return summe;
}

// ---------- Züge ausprobieren und wieder zurücknehmen ----------

// Führt einen Zug auf dem echten Brett aus und merkt sich alles, um ihn zurückzunehmen.
// Ein Bauer in der letzten Reihe wird dabei zur Dame (nur für die Suche).
function macheZugTest(zug) {
  const von = zug.von;
  const nach = zug.nach;
  const figur = brett[von.zeile][von.spalte];
  const geschlagenPos = zug.enPassant ? { zeile: von.zeile, spalte: nach.spalte } : nach;
  const rueckgaengig = {
    zug: zug,
    figur: figur,
    geschlagenPos: geschlagenPos,
    geschlagen: brett[geschlagenPos.zeile][geschlagenPos.spalte],
    rechte: [
      rochadeRechte.weiss.kurz, rochadeRechte.weiss.lang,
      rochadeRechte.schwarz.kurz, rochadeRechte.schwarz.lang
    ],
    enPassant: enPassantFeld
  };

  ziehe(zug);
  if (figur.art === "bauer" && (nach.zeile === 7 || nach.zeile === 0)) {
    brett[nach.zeile][nach.spalte] = { farbe: figur.farbe, art: "dame" };
  }
  return rueckgaengig;
}

function nimmZugZurueck(r) {
  const zug = r.zug;
  brett[zug.nach.zeile][zug.nach.spalte] = null;
  brett[zug.von.zeile][zug.von.spalte] = r.figur;
  brett[r.geschlagenPos.zeile][r.geschlagenPos.spalte] = r.geschlagen;

  // Rochade: den Turm zurückstellen
  if (zug.rochade) {
    const zeile = zug.von.zeile;
    if (zug.nach.spalte === 6) {
      brett[zeile][7] = brett[zeile][5];
      brett[zeile][5] = null;
    } else {
      brett[zeile][0] = brett[zeile][3];
      brett[zeile][3] = null;
    }
  }

  rochadeRechte.weiss.kurz = r.rechte[0];
  rochadeRechte.weiss.lang = r.rechte[1];
  rochadeRechte.schwarz.kurz = r.rechte[2];
  rochadeRechte.schwarz.lang = r.rechte[3];
  enPassantFeld = r.enPassant;
}

// ---------- Reihenfolge: gute Züge zuerst, damit Alpha-Beta mehr abkürzen kann ----------

function zugSchaetzung(zug) {
  const opfer = brett[zug.nach.zeile][zug.nach.spalte];
  const figur = brett[zug.von.zeile][zug.von.spalte];
  let wert = 0;
  if (opfer !== null) {
    // eine große Figur mit einer kleinen zu schlagen ist besonders gut
    wert = 10 * FIGURWERT[opfer.art] - FIGURWERT[figur.art] / 10;
  } else if (zug.enPassant) {
    wert = 1000;
  }
  if (figur.art === "bauer" && (zug.nach.zeile === 7 || zug.nach.zeile === 0)) {
    wert += 8000; // Umwandlung
  }
  return wert;
}

function ordneZuege(zuege) {
  const bewertet = zuege.map(z => ({ zug: z, wert: zugSchaetzung(z) }));
  bewertet.sort((a, b) => b.wert - a.wert);
  return bewertet.map(e => e.zug);
}

function mischen(liste) {
  for (let i = liste.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tausch = liste[i];
    liste[i] = liste[j];
    liste[j] = tausch;
  }
}

// ---------- Die Suche (Minimax in der "Negamax"-Schreibweise, mit Alpha-Beta) ----------

let geprueft = 0; // wie viele Stellungen wurden angeschaut

// Gibt zurück, wie gut die Stellung für "farbe" ist (die Farbe, die gerade am Zug ist).
// alpha = das Beste, was farbe schon sicher hat. beta = das Beste, was der Gegner zulässt.
function suche(tiefe, alpha, beta, farbe, abstand) {
  geprueft++;
  const imSchach = istImSchach(brett, farbe);

  // Am Ende der Suchtiefe wird nur bewertet. Steht jemand im Schach, wird noch
  // ein Stück weitergerechnet, damit ein Matt nicht übersehen wird.
  if (tiefe <= 0 && (tiefe <= -2 || !imSchach)) {
    const wert = bewertePosition();
    return farbe === WEISS ? wert : -wert;
  }

  const zuege = alleLegalenZuege(brett, farbe);
  if (zuege.length === 0) {
    // Matt (je früher, desto schlechter für den Matten) oder Patt
    return imSchach ? -MATT + abstand : 0;
  }

  const gegner = farbe === WEISS ? SCHWARZ : WEISS;
  let beste = -Infinity;
  for (const zug of ordneZuege(zuege)) {
    const rueckgaengig = macheZugTest(zug);
    const wert = -suche(tiefe - 1, -beta, -alpha, gegner, abstand + 1);
    nimmZugZurueck(rueckgaengig);

    if (wert > beste) {
      beste = wert;
    }
    if (beste > alpha) {
      alpha = beste;
    }
    if (alpha >= beta) {
      break; // der Gegner würde diese Stellung nie zulassen: nicht weiterrechnen
    }
  }
  return beste;
}

// Sucht den besten Zug für "farbe". tiefe = wie viele Halbzüge vorausgerechnet werden.
// Gibt { zug, wert, geprueft, mattIn } zurück, oder null, wenn es keinen Zug gibt.
function findeBestenZug(farbe, tiefe) {
  geprueft = 0;
  let zuege = alleLegalenZuege(brett, farbe);
  if (zuege.length === 0) {
    return null;
  }
  mischen(zuege);              // damit sie nicht jede Partie gleich spielt
  zuege = ordneZuege(zuege);

  const gegner = farbe === WEISS ? SCHWARZ : WEISS;
  let bester = zuege[0];
  let besterWert = -Infinity;
  for (const zug of zuege) {
    const rueckgaengig = macheZugTest(zug);
    const wert = -suche(tiefe - 1, -Infinity, -besterWert, gegner, 1);
    nimmZugZurueck(rueckgaengig);
    if (wert > besterWert) {
      besterWert = wert;
      bester = zug;
    }
  }

  // Wenn ein Matt gefunden wurde: in wie vielen Zügen?
  let mattIn = 0;
  if (Math.abs(besterWert) > MATT - 1000) {
    mattIn = Math.ceil((MATT - Math.abs(besterWert)) / 2);
  }
  return { zug: bester, wert: besterWert, geprueft: geprueft, mattIn: mattIn };
}