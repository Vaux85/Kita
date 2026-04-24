// assets/js/main.js

// Browser soll keine alte Scrollposition automatisch wiederherstellen
if ("scrollRestoration" in history) {
    history.scrollRestoration = "manual";
}

function resetScroll() {
    // Fenster selbst nach oben
    window.scrollTo(0, 0);

    // die weiße Kachel nach oben
    var card = document.querySelector(".content-card");
    if (card) {
        card.scrollTop = 0;
    }
}

// Beim normalen Laden
window.addEventListener("load", resetScroll);

// Beim Zurück-Navigieren aus dem Verlauf (bfcache)
window.addEventListener("pageshow", function (event) {
    if (event.persisted) {
        resetScroll();
    }
});
