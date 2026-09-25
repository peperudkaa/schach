// Pastellrosa Hintergrund mit Pixel-Herzen und Pixel-Pfoten.
// Ein kleines Muster wird gemalt und über die ganze Seite wiederholt.
(function () {
  const PIXEL = 4;    // so groß ist ein Pixel des Musters auf dem Bildschirm
  const KACHEL = 40;  // das Muster ist 40 x 40 Pixel groß

  // Alle Farben stehen hier. Für kräftigere Muster die Farben dunkler machen.
  const FARBEN = {
    grund: "#ffe9f1", // pastellrosa
    herz: "#ffc4d8",
    pfote: "#ffd6e4"
  };

  // Ein Punkt bedeutet: hier wird nichts gemalt
  const HERZ = [
    ".rr.rr.",
    "rrrrrrr",
    "rrrrrrr",
    ".rrrrr.",
    "..rrr..",
    "...r..."
  ];

  const PFOTE = [
    "..rr.rr..",
    "..rr.rr..",
    ".........",
    "rr.....rr",
    "rr.rrr.rr",
    "..rrrrr..",
    ".rrrrrrr.",
    "..rrrrr.."
  ];

  const leinwand = document.createElement("canvas");
  leinwand.width = KACHEL;
  leinwand.height = KACHEL;
  const ctx = leinwand.getContext("2d");

  ctx.fillStyle = FARBEN.grund;
  ctx.fillRect(0, 0, KACHEL, KACHEL);

  // Setzt ein Muster mit der oberen linken Ecke bei (x0, y0) ein
  function stemple(muster, x0, y0, farbe) {
    ctx.fillStyle = farbe;
    for (let y = 0; y < muster.length; y++) {
      for (let x = 0; x < muster[y].length; x++) {
        if (muster[y][x] !== ".") {
          ctx.fillRect(x0 + x, y0 + y, 1, 1);
        }
      }
    }
  }

  // Zwei Herzen und zwei Pfoten, über Kreuz angeordnet
  stemple(HERZ, 4, 4, FARBEN.herz);
  stemple(PFOTE, 24, 3, FARBEN.pfote);
  stemple(PFOTE, 5, 24, FARBEN.pfote);
  stemple(HERZ, 26, 26, FARBEN.herz);

  // Das Muster wird als Hintergrund der ganzen Seite gesetzt
  const seite = document.documentElement;
  seite.style.backgroundColor = FARBEN.grund;
  seite.style.backgroundImage = "url(" + leinwand.toDataURL() + ")";
  seite.style.backgroundSize = (KACHEL * PIXEL) + "px " + (KACHEL * PIXEL) + "px";
  seite.style.imageRendering = "crisp-edges";
  seite.style.imageRendering = "pixelated";
})();