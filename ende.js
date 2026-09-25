// Zeigt eine kleine Animation, sobald eine Partie durch Matt oder Patt endet.
// Greift auf die Spielvariablen aus script.js zu (brett, amZug, spielVorbei, ...).
(function () {
  const PIXEL = 4;

  // Pixelbilder: r = rosa Herz, g = graues Herz, w = Wasser (Tropfen)
  const HERZ = [
    ".rr.rr.",
    "rrrrrrr",
    "rrrrrrr",
    ".rrrrr.",
    "..rrr..",
    "...r..."
  ];
  const TROPFEN = [
    "...w...",
    "..www..",
    ".wwwww.",
    ".wwwww.",
    "..www..",
    "......."
  ];

  function male(muster, farbe) {
    const leinwand = document.createElement("canvas");
    leinwand.width = muster[0].length;
    leinwand.height = muster.length;
    const ctx = leinwand.getContext("2d");
    for (let y = 0; y < muster.length; y++) {
      for (let x = 0; x < muster[y].length; x++) {
        if (muster[y][x] !== ".") {
          ctx.fillStyle = farbe;
          ctx.fillRect(x, y, 1, 1);
        }
      }
    }
    const bild = document.createElement("img");
    bild.src = leinwand.toDataURL();
    bild.style.cssText =
      "position: absolute; width: " + muster[0].length * PIXEL + "px;" +
      "image-rendering: crisp-edges; image-rendering: pixelated;";
    return bild;
  }

  // Lässt für ein paar Sekunden Teilchen von oben herabfallen
  function regen(behaelter, muster, farbe, dauerMs) {
    const start = Date.now();
    const takt = setInterval(() => {
      if (Date.now() - start > dauerMs) {
        clearInterval(takt);
        return;
      }
      const teilchen = male(muster, farbe);
      teilchen.style.left = Math.random() * 100 + "%";
      teilchen.style.top = "-30px";
      behaelter.appendChild(teilchen);

      const zielY = window.innerHeight + 30;
      const drehung = (Math.random() * 60 - 30) + "deg";
      const animation = teilchen.animate(
        [
          { transform: "translateY(0) rotate(0deg)", opacity: 1 },
          { transform: "translateY(" + zielY + "px) rotate(" + drehung + ")", opacity: 0.8 }
        ],
        { duration: 2200 + Math.random() * 1500, easing: "ease-in" }
      );
      animation.onfinish = () => teilchen.remove();
    }, 120);
  }

  // Baut die Vollbild-Anzeige mit Text und zwei Knöpfen
  function zeigeBanner(art, text) {
    const overlay = document.createElement("div");
    overlay.style.cssText =
      "position: fixed; inset: 0; z-index: 200000; overflow: hidden;" +
      "display: flex; align-items: center; justify-content: center;" +
      "background: rgba(255, 233, 241, 0.25);";
    document.body.appendChild(overlay);

    if (art === "sieg") {
      regen(overlay, HERZ, "#ff6f9c", 3000);
    } else if (art === "niederlage") {
      regen(overlay, TROPFEN, "#7fb8e0", 3000);
    } else {
      regen(overlay, HERZ, "#b7bccb", 2500);
    }

    const kasten = document.createElement("div");
    kasten.style.cssText =
      "position: relative; text-align: center; padding: 26px 30px;" +
      "background: #fff5f8; font-family: 'Press Start 2P', monospace;" +
      "box-shadow: 0 -4px 0 0 #d98aa5, 0 4px 0 0 #d98aa5," +
      "-4px 0 0 0 #d98aa5, 4px 0 0 0 #d98aa5," +
      "0 -7px 0 0 #b04a6f, 0 7px 0 0 #b04a6f," +
      "-7px 0 0 0 #b04a6f, 7px 0 0 0 #b04a6f;";

    const ueberschrift = document.createElement("p");
    ueberschrift.textContent = text;
    ueberschrift.style.cssText = "margin: 0 0 22px; font-size: 16px; color: #d6538a; line-height: 1.6;";
    kasten.appendChild(ueberschrift);

    const knopfReihe = document.createElement("div");
    knopfReihe.style.cssText = "display: flex; gap: 12px; justify-content: center;";

    function knopf(beschriftung, aktion) {
      const b = document.createElement("button");
      b.textContent = beschriftung;
      b.style.cssText =
        "font-family: 'Press Start 2P', monospace; font-size: 10px; color: #d6538a;" +
        "background: #ffffff; border: none; padding: 10px 14px; cursor: pointer;" +
        "box-shadow: 0 -3px 0 0 #d98aa5, 0 3px 0 0 #d98aa5, -3px 0 0 0 #d98aa5, 3px 0 0 0 #d98aa5;";
      b.addEventListener("click", aktion);
      return b;
    }

    knopfReihe.appendChild(knopf(t("schliessen"), () => overlay.remove()));
    knopfReihe.appendChild(knopf(t("neues_spiel"), () => {
      overlay.remove();
      if (typeof neuesSpiel === "function") {
        neuesSpiel();
      }
    }));
    kasten.appendChild(knopfReihe);
    overlay.appendChild(kasten);

    // nach einer Weile von selbst ausblenden, falls niemand klickt
    setTimeout(() => {
      overlay.style.transition = "opacity 1s";
      overlay.style.opacity = "0";
      setTimeout(() => overlay.remove(), 1000);
    }, 6000);
  }

  // Beobachtet das Spiel und erkennt, wann es neu zu Ende geht
  let bereitsGezeigt = false;
  setInterval(() => {
    if (typeof spielVorbei === "undefined") {
      return; // script.js ist noch nicht geladen
    }
    if (!spielVorbei) {
      bereitsGezeigt = false;
      return;
    }
    if (bereitsGezeigt) {
      return;
    }
    bereitsGezeigt = true;

    const mattgesetzt = istImSchach(brett, amZug);
    if (!mattgesetzt) {
      zeigeBanner("unentschieden", t("remis_banner"));
      return;
    }

    const gewinner = amZug === WEISS ? SCHWARZ : WEISS; // die andere Farbe hat gewonnen
    const gegenComputer = typeof computerFarbe === "function" ? computerFarbe() : null;

    if (gegenComputer === null) {
            zeigeBanner("sieg", t("gewinnt_banner", gewinner === WEISS ? t("weiss") : t("schwarz")));
    } else if (gewinner !== gegenComputer) {
            zeigeBanner("sieg", t("gewonnen"));      zeigeBanner("sieg", t("gewonnen"));
    } else {
      zeigeBanner("niederlage", t("verloren"));
    }
  }, 200);
})();