// Pixel-Katzen, die über den Bildschirm laufen (aber nicht über das Brett), sich hinsetzen,
// die Pfote lecken und beim Anklicken Herzen zeigen.
// Oben rechts gibt es einen Schalter, um Katzen hinzuzufügen oder zu entfernen.
// Alles steckt in einer Funktion, damit die Namen nicht mit script.js kollidieren.
(function () {
  const PIXEL = 3;          // Größe eines Katzen-Pixels (kleiner = kleinere Katze)
  const SCHRITT = 3;        // so viele Pixel läuft sie pro Tick (alle 50 ms)
  const MAX_KATZEN = 67;    // so viele Katzen sind höchstens gleichzeitig unterwegs
  const MAX_B = 20 * PIXEL; // größte Breite einer Katze (von der Seite, mit Rand)
  const MAX_H = 18 * PIXEL; // größte Höhe einer Katze (sitzend, mit Rand)

  // Dieser Bereich der Seite ist für die Katzen tabu:
  // "#brettbereich" = Brett + Umwandlungs-Knöpfe + Statustext
  // "#spiel"        = zusätzlich die Tabelle mit den Zügen
  const SPERRZONE = "#brettbereich";

  // Farben pro Fellsorte. Jeder Buchstabe im Bild unten steht für eine Farbe:
  // b = Fell, d = dunklere Streifen, g = zweiter Fleck (nur Calico), l = hell (Brust, Schnauze),
  // f = Pfoten, E = Ohren, T = Schwanz, e = Augen
  const FELLFARBEN = {
    weiss:   { b: "#ffffff", d: "#dde2f0", g: "#ffffff", l: "#ffffff", f: "#ffffff", E: "#ffffff", T: "#ffffff", e: "#4aa8e8" },
    calico:  { b: "#ffffff", d: "#f2a03d", g: "#a9adba", l: "#ffffff", f: "#ffffff", E: "#ffffff", T: "#f2a03d", e: "#4aa8e8" },
    orange:  { b: "#f2a03d", d: "#d9781f", g: "#f2a03d", l: "#fbcf8a", f: "#fbcf8a", E: "#f2a03d", T: "#f2a03d", e: "#4caf50" },
    grau:    { b: "#b7bccb", d: "#858b9d", g: "#b7bccb", l: "#eef0f6", f: "#eef0f6", E: "#b7bccb", T: "#b7bccb", e: "#d94a4a" },
    siam:    { b: "#eadcc0", d: "#6b4a3a", g: "#eadcc0", l: "#f4ead6", f: "#6b4a3a", E: "#6b4a3a", T: "#6b4a3a", e: "#4aa8e8" },
    schwarz: { b: "#3b3b4a", d: "#2c2c38", g: "#3b3b4a", l: "#4a4a5c", f: "#3b3b4a", E: "#3b3b4a", T: "#3b3b4a", e: "#f2c230" }
  };
  const FELLNAMEN = Object.keys(FELLFARBEN);

  // Farben, die bei allen Katzen gleich sind:
  // i = Ohr innen, n = Nase und Zunge, h = Schnurrhaare, o = Umrandung (wird automatisch ergänzt)
  const GEMEINSAM = { i: "#f7a8c4", n: "#f28ab0", h: "#22212e", o: "#22212e" };

  // ---------- Die Katze von vorne, sitzend (16 x 16 Pixel) ----------
  // Ein Punkt bedeutet durchsichtig.
  const SITZ = [
    "..E..........E..",
    "..Ei........iE..",
    "..bbbbdbbdbggb..",
    "..bbbebbbbebgb..",
    "..bbbebbbbebbb..",
    "hhbbbblnnlbbbbhh",
    ".h.bbbllllbbb.h.",
    ".....bbbbbb.....",
    "....bbbllbgg....",
    "....bbllllbb....",
    "...dbbllllbbd.T.",
    "...bbbllllbbb.T.",
    "...dbbllllbbd.T.",
    "...bbbllllbbbTT.",
    "....fff..fff....",
    "....fff..fff...."
  ];

  // Zeilen, die beim Blinzeln (Augen zu) und beim Schwanzwackeln ersetzt werden
  const SITZ_ZU_3 = "..bbbbbbbbbbgb..";
  const SITZ_ZU_4 = "..bbbhbbbbhbbb..";
  const SITZ_SCHWANZ_10 = "...dbbllllbbd...";
  const SITZ_SCHWANZ_11 = "...bbbllllbbb.TT";

  function sitzPose(augenZu, schwanzB) {
    const pose = SITZ.slice();
    if (augenZu) {
      pose[3] = SITZ_ZU_3;
      pose[4] = SITZ_ZU_4;
    }
    if (schwanzB) {
      pose[10] = SITZ_SCHWANZ_10;
      pose[11] = SITZ_SCHWANZ_11;
    }
    return pose;
  }

  // Pfote lecken: Augen zu, eine Pfote am Mund. Zwei Bilder wechseln sich ab.
  function leckPose(bild) {
    const pose = sitzPose(true, false);
    if (bild === 0) {
      pose[6] = ".h.bbffnllbbb.h.";
      pose[7] = ".....ffbbbb.....";
    } else {
      pose[6] = ".h.bbbffllbbb.h.";
      pose[7] = ".....bffbbb.....";
    }
    // die linke Vorderpfote ist ja oben am Mund
    pose[14] = ".........fff....";
    pose[15] = ".........fff....";
    return pose;
  }

  // ---------- Die Katze von der Seite, laufend (18 x 13 Pixel), schaut nach rechts ----------
  const LAUF_KOERPER = [
    "...........E...E..",
    "...........Ei.iE..",
    "...........gbdbbb.",
    "T..........bbbebb.",
    "TT.........bbbbbnh",
    ".T.bbbbbbbbblllb.h",
    ".Tbbdbdbdbbbb.....",
    ".Tbbbbbbbbbll.....",
    "..bbbbbbbbbll.....",
    "...bbbbbbbbll....."
  ];

  // Zwei Beinstellungen, die sich beim Laufen abwechseln
  const LAUF_BEINE_1 = [
    "...bb......bb.....",
    "...bb......bb.....",
    "...ff......ff....."
  ];
  const LAUF_BEINE_2 = [
    ".....bb..bb.......",
    ".....bb..bb.......",
    ".....ff..ff......."
  ];
  const LAUFEN = [LAUF_KOERPER.concat(LAUF_BEINE_1), LAUF_KOERPER.concat(LAUF_BEINE_2)];

  // ---------- Das Herz (7 x 6 Pixel) ----------
  const HERZ = [
    ".rr.rr.",
    "rwrrrrr",
    "rrrrrrr",
    ".rrrrr.",
    "..rrr..",
    "...r..."
  ];
  const HERZ_FARBEN = { r: "#ff5c8a", w: "#ffd0e0", o: "#22212e" };

  function zufall(von, bis) {
    return Math.floor(von + Math.random() * (bis - von + 1));
  }

  // Malt ein Pixelbild auf eine Leinwand. Leere Pixel neben dem Bild werden zur Umrandung.
  // Gibt die Größe des Bildes auf dem Bildschirm zurück (b = Breite, h = Höhe).
  function male(leinwand, pose, farben, px) {
    const hoehe = pose.length;
    const breite = Math.max(...pose.map(zeile => zeile.length));
    const zeilen = pose.map(zeile => zeile.padEnd(breite, "."));

    // Die Leinwand ist rundherum 1 Pixel größer, dort kommt die Umrandung hin
    leinwand.width = breite + 2;
    leinwand.height = hoehe + 2;
    const b = (breite + 2) * px;
    const h = (hoehe + 2) * px;
    leinwand.style.width = b + "px";
    leinwand.style.height = h + "px";

    const ctx = leinwand.getContext("2d");
    const pixel = (x, y) =>
      (x < 0 || y < 0 || x >= breite || y >= hoehe) ? "." : zeilen[y][x];

    for (let y = -1; y <= hoehe; y++) {
      for (let x = -1; x <= breite; x++) {
        let zeichen = pixel(x, y);
        if (zeichen === ".") {
          const nachbarn = [pixel(x - 1, y), pixel(x + 1, y), pixel(x, y - 1), pixel(x, y + 1)];
          if (nachbarn.some(n => n !== ".")) {
            zeichen = "o";
          }
        }
        if (zeichen !== ".") {
          ctx.fillStyle = farben[zeichen];
          ctx.fillRect(x + 1, y + 1, 1, 1);
        }
      }
    }
    return { b: b, h: h };
  }

  // Ein Herz steigt an dieser Stelle auf und verblasst
  function zeigeHerz(x, y, versatz) {
    const herz = document.createElement("canvas");
    herz.style.cssText =
      "position: fixed; pointer-events: none; z-index: 50000;" +
      "image-rendering: crisp-edges; image-rendering: pixelated;";
    const groesse = male(herz, HERZ, HERZ_FARBEN, PIXEL + 1);
    herz.style.left = Math.round(x - groesse.b / 2 + versatz) + "px";
    herz.style.top = Math.round(y - groesse.h) + "px";
    document.body.appendChild(herz);

    const animation = herz.animate(
      [
        { transform: "translateY(0) scale(0.6)", opacity: 1 },
        { transform: "translateY(-45px) scale(1.2)", opacity: 0 }
      ],
      { duration: 1300, easing: "ease-out" }
    );
    animation.onfinish = () => herz.remove();
  }

  // ---------- Der Bereich, den die Katzen meiden (das Brett) ----------
  // Gespeichert ist der Bereich, in dem die FÜSSE nicht sein dürfen. Er ist rundherum
  // so viel größer als das Brett, dass die ganze Katze daneben Platz hat.
  let sperre = null;

  function aktualisiereSperre() {
    const element = document.querySelector(SPERRZONE);
    if (!element) {
      sperre = null;
      return;
    }
    const r = element.getBoundingClientRect();
    sperre = {
      left: r.left - MAX_B / 2 - 4,
      right: r.right + MAX_B / 2 + 4,
      top: r.top,                    // oben darf sie mit den Füßen am Rand stehen
      bottom: r.bottom + MAX_H + 4   // unten muss der ganze Körper unter dem Brett sein
    };
  }
  aktualisiereSperre();
  window.addEventListener("resize", aktualisiereSperre);
  window.addEventListener("scroll", aktualisiereSperre);
  setInterval(aktualisiereSperre, 500);

  // Liegt der Punkt im Inneren des gesperrten Bereichs? (Auf dem Rand ist erlaubt.)
  function imInneren(p) {
    return sperre !== null
      && p.x > sperre.left && p.x < sperre.right
      && p.y > sperre.top && p.y < sperre.bottom;
  }

  // Geht die Strecke von a nach b durch das Innere des gesperrten Bereichs?
  function schneidet(a, b) {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const p = [-dx, dx, -dy, dy];
    const q = [a.x - sperre.left, sperre.right - a.x, a.y - sperre.top, sperre.bottom - a.y];
    let t0 = 0;
    let t1 = 1;
    for (let i = 0; i < 4; i++) {
      if (p[i] === 0) {
        if (q[i] <= 0) {
          return false; // parallel und außerhalb (oder genau auf dem Rand)
        }
      } else {
        const t = q[i] / p[i];
        if (p[i] < 0) {
          t0 = Math.max(t0, t);
        } else {
          t1 = Math.min(t1, t);
        }
      }
    }
    return t0 < t1 - 1e-9;
  }

  // Falls eine Katze im gesperrten Bereich steht: der kürzeste Weg hinaus
  function ausSperreHeraus(p) {
    const links = p.x - sperre.left;
    const rechts = sperre.right - p.x;
    const oben = p.y - sperre.top;
    const unten = sperre.bottom - p.y;
    const kleinste = Math.min(links, rechts, oben, unten);
    if (kleinste === oben) return { x: p.x, y: sperre.top - 2 };
    if (kleinste === links) return { x: sperre.left - 2, y: p.y };
    if (kleinste === rechts) return { x: sperre.right + 2, y: p.y };
    return { x: p.x, y: sperre.bottom + 2 };
  }

  // Plant den Weg von "von" nach "ziel" als Liste von Zwischenpunkten,
  // sodass die Katze um das Brett herumläuft statt darüber.
  function planeWeg(von, ziel) {
    if (sperre === null) {
      return [ziel];
    }
    const weg = [];
    let start = von;
    if (imInneren(start)) {
      start = ausSperreHeraus(start);
      weg.push(start);
    }
    if (!schneidet(start, ziel)) {
      weg.push(ziel);
      return weg;
    }

    // Umweg über eine oder zwei Ecken des gesperrten Bereichs, der kürzeste gewinnt
    const ecken = [
      { x: sperre.left, y: sperre.top },
      { x: sperre.right, y: sperre.top },
      { x: sperre.right, y: sperre.bottom },
      { x: sperre.left, y: sperre.bottom }
    ];
    const kandidaten = [];
    for (let i = 0; i < 4; i++) {
      kandidaten.push([ecken[i]]);
      kandidaten.push([ecken[i], ecken[(i + 1) % 4]]);
      kandidaten.push([ecken[i], ecken[(i + 3) % 4]]);
    }
    let bester = null;
    let kuerzeste = Infinity;
    for (const punkte of kandidaten) {
      const kette = [start].concat(punkte, [ziel]);
      let ok = true;
      let laenge = 0;
      for (let i = 0; i < kette.length - 1; i++) {
        if (schneidet(kette[i], kette[i + 1])) {
          ok = false;
          break;
        }
        laenge += Math.hypot(kette[i + 1].x - kette[i].x, kette[i + 1].y - kette[i].y);
      }
      if (ok && laenge < kuerzeste) {
        bester = punkte;
        kuerzeste = laenge;
      }
    }
    if (bester !== null) {
      weg.push(...bester);
    }
    weg.push(ziel);
    return weg;
  }

  // Ein zufälliger Punkt auf dem Bildschirm, aber nicht im gesperrten Bereich
  function zufallspunkt() {
    for (let versuch = 0; versuch < 30; versuch++) {
      const p = {
        x: zufall(MAX_B / 2, Math.max(MAX_B / 2, window.innerWidth - MAX_B / 2)),
        y: zufall(MAX_H, Math.max(MAX_H, window.innerHeight))
      };
      if (!imInneren(p)) {
        return p;
      }
    }
    return null;
  }

  function erstelleKatze(fellname) {
    const farben = Object.assign({}, GEMEINSAM, FELLFARBEN[fellname]);

    const leinwand = document.createElement("canvas");
    leinwand.style.cssText =
      "position: fixed; left: 0; top: 0; cursor: pointer;" +
      "image-rendering: crisp-edges; image-rendering: pixelated;";
    document.body.appendChild(leinwand);

    let breitePx = 0;
    let hoehePx = 0;

    function zeichne(pose) {
      const groesse = male(leinwand, pose, farben, PIXEL);
      breitePx = groesse.b;
      hoehePx = groesse.h;
    }

    // Position der Katze: cx = Mitte, fy = Höhe der Füße, beides in Bildschirm-Pixeln
    const startPunkt = zufallspunkt() || { x: MAX_B / 2, y: MAX_H };
    let cx = startPunkt.x;
    let fy = startPunkt.y;
    let weg = [];                                  // Zwischenpunkte auf dem Weg zum Ziel
    let richtung = Math.random() < 0.5 ? 1 : -1;  // 1 = schaut nach rechts, -1 = nach links

    // Zustand: "laufen", "sitzen" oder "lecken"
    let modus = "laufen";
    let dauer = 0;          // so viele Ticks dauert das Sitzen/Lecken noch
    let beinPose = 0;       // welche Beinstellung gerade gezeigt wird
    let leckBild = 0;       // welches der zwei Leck-Bilder gerade gezeigt wird
    let augenZu = 0;        // Ticks, in denen die Augen noch zu sind
    let schwanzB = false;   // zweite Schwanzstellung
    let tickZaehler = 0;
    let letzterSchluessel = "";

    // Sucht sich irgendeinen Punkt außerhalb des Bretts als nächstes Ziel
    function neuesZiel() {
      const ziel = zufallspunkt() || { x: cx, y: fy };
      weg = planeWeg({ x: cx, y: fy }, ziel);
    }
    neuesZiel();

    // Angekommen: Pause machen (sitzen oder Pfote lecken) oder gleich weiterlaufen
    function naechsteAktion() {
      const r = Math.random();
      if (r < 0.35) {
        modus = "sitzen";
        dauer = zufall(40, 100);
      } else if (r < 0.7) {
        modus = "lecken";
        dauer = zufall(50, 110);
      } else {
        modus = "laufen";
        neuesZiel();
      }
    }

    // Angeklickt: hinsetzen, Augen zu, drei Herzen steigen auf
    function streicheln() {
      modus = "sitzen";
      dauer = zufall(40, 70);
      augenZu = 30;
      const kopfY = fy - hoehePx;
      zeigeHerz(cx, kopfY, -12);
      setTimeout(() => zeigeHerz(cx, kopfY, 10), 150);
      setTimeout(() => zeigeHerz(cx, kopfY, -2), 300);
    }
    leinwand.addEventListener("click", streicheln);

    // Wird alle 50 Millisekunden aufgerufen
    function tick() {
      tickZaehler++;

      // Steht sie plötzlich im gesperrten Bereich (z.B. Fenster verändert)? Dann raus da.
      if (tickZaehler % 20 === 0 && imInneren({ x: cx, y: fy })) {
        modus = "laufen";
        neuesZiel();
      }

      let pose;
      let schluessel;

      if (modus === "laufen") {
        if (tickZaehler % 4 === 0) {
          beinPose = 1 - beinPose; // Beine wechseln
        }
        pose = LAUFEN[beinPose];
        schluessel = "L" + beinPose;

        if (weg.length === 0) {
          naechsteAktion();
        } else {
          // ein Stück in Richtung des nächsten Zwischenpunkts gehen
          const ziel = weg[0];
          const dx = ziel.x - cx;
          const dy = ziel.y - fy;
          const abstand = Math.hypot(dx, dy);
          if (abstand <= SCHRITT) {
            cx = ziel.x;
            fy = ziel.y;
            weg.shift();
            if (weg.length === 0) {
              naechsteAktion();
            }
          } else {
            cx += dx / abstand * SCHRITT;
            fy += dy / abstand * SCHRITT;
            if (Math.abs(dx) > 2) {
              richtung = dx > 0 ? 1 : -1;
            }
          }
        }
      } else if (modus === "sitzen") {
        // ab und zu blinzeln und mit dem Schwanz wackeln
        if (augenZu > 0) {
          augenZu--;
        } else if (Math.random() < 0.03) {
          augenZu = 3;
        }
        if (tickZaehler % 10 === 0 && Math.random() < 0.5) {
          schwanzB = !schwanzB;
        }
        pose = sitzPose(augenZu > 0, schwanzB);
        schluessel = "S" + (augenZu > 0) + schwanzB;

        dauer--;
        if (dauer <= 0) {
          modus = "laufen";
          neuesZiel();
        }
      } else {
        // Pfote lecken
        if (tickZaehler % 4 === 0) {
          leckBild = 1 - leckBild;
        }
        pose = leckPose(leckBild);
        schluessel = "P" + leckBild;

        dauer--;
        if (dauer <= 0) {
          modus = "sitzen"; // nach dem Putzen kurz sitzen bleiben
          dauer = zufall(20, 50);
        }
      }

      // nur neu malen, wenn sich das Bild wirklich geändert hat
      if (schluessel !== letzterSchluessel) {
        zeichne(pose);
        letzterSchluessel = schluessel;
      }

      // beim Laufen hüpft sie leicht, scaleX(-1) dreht sie um
      const huepfer = (modus === "laufen" && beinPose === 0) ? -2 : 0;
      leinwand.style.zIndex = 1000 + Math.round(fy); // weiter unten = weiter vorne
      leinwand.style.transform =
        "translate(" + Math.round(cx - breitePx / 2) + "px, " +
        Math.round(fy - hoehePx + huepfer) + "px) scaleX(" + richtung + ")";
    }

    const takt = setInterval(tick, 50);

    return {
      entfernen: function () {
        clearInterval(takt);
        leinwand.remove();
      }
    };
  }

  // ---------- Der Schalter oben rechts ----------
  const katzen = []; // alle Katzen, die gerade unterwegs sind (die letzte ist die neueste)

  const leiste = document.createElement("div");
  leiste.style.cssText =
    "position: fixed; top: 12px; right: 12px; z-index: 100000;" +
    "display: flex; align-items: center; gap: 6px; padding: 6px 8px;" +
    "background: #fde7ee; border: 2px solid #d98aa5; border-radius: 10px;" +
    "font-family: sans-serif;";

  function erstelleKnopf(text) {
    const knopf = document.createElement("button");
    knopf.textContent = text;
    knopf.style.cssText =
      "cursor: pointer; font-size: 14px; font-weight: bold; color: #d6538a;" +
      "background: #ffffff; border: 2px solid #d98aa5; border-radius: 8px; padding: 4px 10px;";
    return knopf;
  }

  const weniger = erstelleKnopf(t("katze_minus"));
  const mehr = erstelleKnopf(t("katze_plus"));
  const anzahl = document.createElement("span");
  anzahl.style.cssText =
    "color: #d6538a; font-weight: bold; font-size: 14px; min-width: 70px; text-align: center;";
  leiste.append(weniger, anzahl, mehr);
  document.body.appendChild(leiste);

  function aktualisiereAnzeige() {
    anzahl.textContent = katzen.length === 1 ? t("katze_anzahl_ein") : t("katze_anzahl_mehr", katzen.length);
    weniger.style.opacity = katzen.length === 0 ? "0.4" : "1";
    mehr.style.opacity = katzen.length >= MAX_KATZEN ? "0.4" : "1";
  }

  function katzeHinzufuegen(fellname) {
    if (katzen.length >= MAX_KATZEN) {
      return;
    }
    katzen.push(erstelleKatze(fellname));
    aktualisiereAnzeige();
  }

  function katzeEntfernen() {
    const katze = katzen.pop();
    if (katze) {
      katze.entfernen();
    }
    aktualisiereAnzeige();
  }

  // jede neue Katze bekommt eine zufällige Fellfarbe
  mehr.addEventListener("click", () => katzeHinzufuegen(FELLNAMEN[zufall(0, FELLNAMEN.length - 1)]));
  weniger.addEventListener("click", katzeEntfernen);

  // zum Start läuft eine weiße Katze herum
  katzeHinzufuegen("weiss");
})();