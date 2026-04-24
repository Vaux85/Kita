(function () {
    var loginPanel = document.getElementById("login-panel");
    var editorPanel = document.getElementById("editor-panel");
    var loginForm = document.getElementById("login-form");
    var contentForm = document.getElementById("content-form");
    var loginMessage = document.getElementById("login-message");
    var saveMessage = document.getElementById("save-message");
    var logoutButton = document.getElementById("logout-button");

    function request(url, options) {
        return fetch(url, Object.assign({
            credentials: "same-origin",
            headers: {
                "Content-Type": "application/json"
            }
        }, options || {})).then(function (response) {
            if (!response.ok) {
                return response.json().catch(function () {
                    return { error: "Unbekannter Fehler." };
                }).then(function (payload) {
                    throw new Error(payload.error || "Unbekannter Fehler.");
                });
            }

            return response.json();
        });
    }

    function buildField(field, value) {
        var wrapper = document.createElement("div");
        wrapper.className = "admin-field";

        var label = document.createElement("label");
        label.textContent = field.label;
        wrapper.appendChild(label);

        if (field.type === "image") {
            var textInput = document.createElement("input");
            textInput.type = "text";
            textInput.name = field.key;
            textInput.value = value || "";
            textInput.placeholder = "Pfad aus Upload oder vorhandene Bilddatei";
            wrapper.appendChild(textInput);

            var fileInput = document.createElement("input");
            fileInput.type = "file";
            fileInput.accept = "image/*";
            wrapper.appendChild(fileInput);

            var preview = document.createElement("img");
            preview.className = "admin-preview";
            preview.alt = field.label;
            preview.src = value || "";
            if (!value) {
                preview.classList.add("hidden");
            }
            wrapper.appendChild(preview);

            var uploadMessage = document.createElement("p");
            uploadMessage.className = "admin-message";
            wrapper.appendChild(uploadMessage);

            textInput.addEventListener("input", function () {
                preview.src = textInput.value.trim();
                preview.classList.toggle("hidden", !textInput.value.trim());
            });

            fileInput.addEventListener("change", function () {
                var file = fileInput.files && fileInput.files[0];
                if (!file) {
                    return;
                }

                uploadMessage.textContent = "Bild wird hochgeladen...";
                var formData = new FormData();
                formData.append("image", file);

                fetch("/api/admin/upload", {
                    method: "POST",
                    credentials: "same-origin",
                    body: formData
                }).then(function (response) {
                    if (!response.ok) {
                        return response.json().then(function (payload) {
                            throw new Error(payload.error || "Upload fehlgeschlagen.");
                        });
                    }

                    return response.json();
                }).then(function (payload) {
                    textInput.value = payload.path;
                    preview.src = payload.path;
                    preview.classList.remove("hidden");
                    uploadMessage.textContent = "Upload erfolgreich.";
                }).catch(function (error) {
                    uploadMessage.textContent = error.message;
                });
            });

            return wrapper;
        }

        var input = field.type === "multiline"
            ? document.createElement("textarea")
            : document.createElement("input");

        input.name = field.key;
        input.value = value || "";

        if (field.type === "multiline") {
            input.rows = 6;
        } else {
            input.type = "text";
        }

        wrapper.appendChild(input);
        return wrapper;
    }

    function buildEditor(content) {
        contentForm.innerHTML = "";

        window.KitaAdminFields.forEach(function (field) {
            contentForm.appendChild(buildField(field, content[field.key]));
        });
    }

    function setEditorVisible(isVisible) {
        loginPanel.classList.toggle("hidden", isVisible);
        editorPanel.classList.toggle("hidden", !isVisible);
    }

    function loadContent() {
        return request("/api/admin/content").then(function (content) {
            buildEditor(content);
            setEditorVisible(true);
            loginMessage.textContent = "";
        });
    }

    loginForm.addEventListener("submit", function (event) {
        event.preventDefault();
        var formData = new FormData(loginForm);

        request("/api/auth/login", {
            method: "POST",
            body: JSON.stringify({
                username: formData.get("username"),
                password: formData.get("password")
            })
        }).then(function () {
            loginForm.reset();
            return loadContent();
        }).catch(function (error) {
            loginMessage.textContent = error.message;
        });
    });

    contentForm.addEventListener("submit", function (event) {
        event.preventDefault();
        var formData = new FormData(contentForm);
        var payload = {};

        window.KitaAdminFields.forEach(function (field) {
            payload[field.key] = String(formData.get(field.key) || "").trim();
        });

        request("/api/admin/content", {
            method: "PUT",
            body: JSON.stringify(payload)
        }).then(function () {
            saveMessage.textContent = "Änderungen gespeichert.";
        }).catch(function (error) {
            saveMessage.textContent = error.message;
        });
    });

    logoutButton.addEventListener("click", function () {
        request("/api/auth/logout", {
            method: "POST",
            body: JSON.stringify({})
        }).then(function () {
            setEditorVisible(false);
            saveMessage.textContent = "";
        });
    });

    request("/api/auth/session")
        .then(function (payload) {
            if (payload.authenticated) {
                return loadContent();
            }

            setEditorVisible(false);
        })
        .catch(function () {
            setEditorVisible(false);
        });
})();
