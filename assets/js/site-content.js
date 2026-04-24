(function () {
    var fieldMap = {
        heroTitle: { selector: "#hero-title", type: "text" },
        heroDescription: { selector: "#hero-description", type: "multiline" },
        heroNote: { selector: "#hero-note", type: "text" },
        heroImage: { selector: "#hero-image", type: "image" },
        supportTitle: { selector: "#support-title", type: "text" },
        supportSubtitle: { selector: "#support-subtitle", type: "multiline" },
        donationImage: { selector: "#donation-image", type: "image" },
        donationTitle: { selector: "#donation-title", type: "text" },
        donationText: { selector: "#donation-text", type: "multiline" },
        moneyImage: { selector: "#money-image", type: "image" },
        moneyTitle: { selector: "#money-title", type: "text" },
        moneyText: { selector: "#money-text", type: "multiline" },
        participationImage: { selector: "#participation-image", type: "image" },
        participationTitle: { selector: "#participation-title", type: "text" },
        participationText: { selector: "#participation-text", type: "multiline" },
        supportNote: { selector: "#support-note", type: "multiline" },
        goalsText: { selector: "#goals-text", type: "multiline" },
        goalsHighlight: { selector: "#goals-highlight", type: "text" },
        membershipText: { selector: "#membership-text", type: "multiline" },
        eventsText: { selector: "#events-text", type: "multiline" },
        eventsImage: { selector: "#events-image", type: "image" },
        sponsorsText: { selector: "#sponsors-text", type: "multiline" },
        contactText: { selector: "#contact-text", type: "multiline" }
    };

    function escapeHtml(value) {
        return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    function renderMultiline(node, value) {
        node.innerHTML = escapeHtml(value).replace(/\n/g, "<br>");
    }

    function toggleImageVisibility(node, isVisible) {
        var wrapper = node.closest(".event-image-wrap, .home-card-image-placeholder, .home-hero-image-placeholder");
        node.classList.toggle("hidden", !isVisible);

        if (wrapper) {
            wrapper.classList.toggle("hidden", !isVisible);
        }
    }

    function applyContent(content) {
        Object.keys(fieldMap).forEach(function (key) {
            var field = fieldMap[key];
            var node = document.querySelector(field.selector);
            var value = content[key];

            if (!node || typeof value !== "string") {
                return;
            }

            if (field.type === "image") {
                if (!value) {
                    node.removeAttribute("src");
                    toggleImageVisibility(node, false);
                    return;
                }

                node.src = value;
                toggleImageVisibility(node, true);
                return;
            }

            if (field.type === "multiline") {
                renderMultiline(node, value);
                return;
            }

            node.textContent = value;
        });
    }

    fetch("/api/content", { credentials: "same-origin" })
        .then(function (response) {
            if (!response.ok) {
                throw new Error("content fetch failed");
            }

            return response.json();
        })
        .then(applyContent)
        .catch(function () {
            // Fallback bleibt der statische HTML-Inhalt.
        });
})();
