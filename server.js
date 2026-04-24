require("dotenv").config();

const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const express = require("express");
const session = require("express-session");
const FileStoreFactory = require("session-file-store");
const rateLimit = require("express-rate-limit");
const multer = require("multer");

const app = express();
const FileStore = FileStoreFactory(session);

const ROOT_DIR = __dirname;
const DATA_DIR = path.join(ROOT_DIR, "data");
const UPLOADS_DIR = path.join(ROOT_DIR, "uploads");
const SESSIONS_DIR = path.join(ROOT_DIR, "sessions");
const CONTENT_FILE = path.join(DATA_DIR, "content.json");

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "vorstand";
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH || "";
const SESSION_SECRET = process.env.SESSION_SECRET || "";
const PORT = Number(process.env.PORT || 3000);
const IS_PRODUCTION = process.env.NODE_ENV === "production";

const CONTENT_SCHEMA = {
    heroTitle: "text",
    heroDescription: "multiline",
    heroNote: "text",
    heroImage: "image",
    supportTitle: "text",
    supportSubtitle: "multiline",
    donationImage: "image",
    donationTitle: "text",
    donationText: "multiline",
    moneyImage: "image",
    moneyTitle: "text",
    moneyText: "multiline",
    participationImage: "image",
    participationTitle: "text",
    participationText: "multiline",
    supportNote: "multiline",
    goalsText: "multiline",
    goalsHighlight: "text",
    membershipText: "multiline",
    eventsText: "multiline",
    eventsImage: "image",
    sponsorsText: "multiline",
    contactText: "multiline"
};

const DEFAULT_CONTENT = {
    heroTitle: "Bärenstarke Kita-Freunde aus Krankenhagen",
    heroDescription: "Wer wir sind…\nSeit 2025 setzen wir uns als Förderverein mit Herz und Hand für die Kindertagesstätte Bärenstark in Krankenhagen ein.\nWir sind ein lebendiges Netzwerk aus engagierten Elternteilen, MitarbeiterInnen, Familienangehörigen und weiteren Interessierten. Gemeinsam bringen wir gute und kreative Ideen ein, um die Kita und die Entwicklung der Kinder optimal zu unterstützen und zu bereichern.",
    heroNote: "„Jede Idee, jede Mitgliedschaft und jeder Euro hilft der Kita und den Kindern.“",
    heroImage: "/gruppenbild.jpg",
    supportTitle: "Wie wir unsere Kita unterstützen",
    supportSubtitle: "Unser Förderverein unterstützt die Kita auf ganz verschiedene Weise:\nWir ermöglichen zusätzliche Anschaffungen und Projekte, organisieren Aktionen für die Kinder und bringen Menschen zusammen, die sich engagieren möchten – sei es mit Sachspenden, finanzieller Unterstützung oder tatkräftiger Hilfe im Alltag der Kita.",
    donationImage: "/sachspende.jpg",
    donationTitle: "Sachspenden",
    donationText: "Sachspenden stimmen wir gemeinsam mit den Mitarbeitenden der Kita ab und verteilen sie je nach Bedarf in den Gruppen. Gibt es aktuell keinen Bedarf, verkaufen wir die Spenden auf einem Flohmarkt, um den Kindern und der Kita auf anderem Weg etwas Gutes zu tun.",
    moneyImage: "/geldspende.jpg",
    moneyTitle: "Geldspenden",
    moneyText: "Wie werden Spenden eingesetzt? Zum Beispiel für Ausflüge, Feste, besondere Anschaffungen oder Aktionen für die Kinder.\nBei jeder Geldspende können wir Ihnen eine Spendenquittung ausstellen!\nBankverbindung:\nBärenstarke Kita-Freunde e.V.i.\nIBAN: DE45255914130066284400\nBIC: GENODEF1BCK\nVolksbank in Schaumburg und Nienburg eG\n\nPayPal:\nbaerenstarke-kitafreunde@web.de",
    participationImage: "/mitmachen.jpeg",
    participationTitle: "Mitmachen",
    participationText: "Mitmachen kann jede*r: Eltern, Großeltern, Angehörige und alle, die unsere Kita unterstützen möchten. Du kannst bei Aktionen und Festen helfen, eigene Ideen einbringen, Materialien organisieren oder als Mitglied den Verein stärken. Gemeinsam gestalten wir den Kita-Alltag bunter, lebendiger und ein Stückchen leichter für die Kinder und das Team.",
    supportNote: "Ob Spielsachen, ein kleiner Geldbetrag oder persönliche Unterstützung – es gibt viele Wege, unsere Kita zu stärken. Materielle Spenden können dort eingesetzt werden, wo sie den Alltag der Kinder bereichern, oder bei Aktionen wie einem Flohmarkt in finanzielle Hilfe für Projekte verwandelt werden. Finanzielle Beiträge ermöglichen uns zum Beispiel besondere Anschaffungen, Ausflüge oder Feste, die sonst nicht möglich wären. Und wer lieber selbst mit anpackt, ist genauso willkommen: beim Planen und Durchführen von Aktionen, beim Organisieren im Hintergrund oder als aktives Vereinsmitglied. Jede Form der Unterstützung zählt und macht die Kita Bärenstark ein Stückchen reicher an Möglichkeiten.",
    goalsText: "Unser Ziel ist es die Kita über die reguläre Ausstattung hinaus zu fördern und Projekte zu ermöglichen, die den Alltag der Kinder bereichern. Ob neue Spielgeräte, Ausflüge, kreative Materialien oder Feste – wir möchten dazu beitragen, dass die Kita ein Ort bleibt, an dem Kinder sich wohlfühlen, entdecken und wachsen können.\nDer Förderverein lebt vom Mitmachen und Mitgestalten: Jede Idee, jede helfende Hand und jeder Beitrag zählt. Gemeinsam schaffen wir Dinge, die allein nicht möglich wären – für unsere Kinder und ihre Zukunft.\nHaben wir Ihr Interesse geweckt?",
    goalsHighlight: "Werden Sie Teil unseres Fördervereins, BÄRENSTARKE Kita-Freunde e.V.”! Wir freuen uns auf Sie!",
    membershipText: "Wenn Sie Mitglied in unserem Förderverein werden möchten, können Sie hier das Anmeldeformular herunterladen, ausdrucken und ausgefüllt in der Kita abgeben.",
    eventsText: "04.03.2026 16 Uhr Mitgliederversammlung im Kita - Container",
    eventsImage: "/mgv04032026.jpeg",
    sponsorsText: "Werden Sie unser erster Sponsor!",
    contactText: "Erste Vorsitzende: Annika Ehlers\nTel: +49 1525 3954293\nE-Mail: Baerenstarke-kitafreunde@web.de\nFörderverein Bärenstarke Kita-Freunde e.V., Wasserweg 2, 31737 Krankenhagen\n\nBei jeder Geldspende können wir Ihnen eine Spendenquittung ausstellen!\nBankverbindung:\nBärenstarke Kita-Freunde e.V.i.\nIBAN: DE45255914130066284400\nBIC: GENODEF1BCK\nVolksbank in Schaumburg und Nienburg eG\n\nPayPal:\nbaerenstarke-kitafreunde@web.de"
};

const PUBLIC_ROOT_FILES = new Set([
    "Background.jpg",
    "Beitrittserklärung.pdf",
    "Eisbär grün mit Hand ohne BG.png",
    "geldspende.jpg",
    "gruppenbild.jpg",
    "index.html",
    "impressum.html",
    "datenschutz.html",
    "Koala gelb mit Hand - ohne BG.png",
    "mgv04032026.jpeg",
    "mitmachen.jpeg",
    "Panda blau mit Hand - o hne BG.png",
    "sachspende.jpg",
    "Waschbär rot mit Hand - ohne BG.png",
    "admin.html"
]);

if (!SESSION_SECRET || !ADMIN_PASSWORD_HASH) {
    throw new Error("SESSION_SECRET und ADMIN_PASSWORD_HASH müssen in der .env gesetzt sein.");
}

fs.mkdirSync(DATA_DIR, { recursive: true });
fs.mkdirSync(UPLOADS_DIR, { recursive: true });
fs.mkdirSync(SESSIONS_DIR, { recursive: true });

if (!fs.existsSync(CONTENT_FILE)) {
    fs.writeFileSync(CONTENT_FILE, JSON.stringify(DEFAULT_CONTENT, null, 2));
}

function readContent() {
    const raw = fs.readFileSync(CONTENT_FILE, "utf8");
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_CONTENT, ...parsed };
}

function writeContent(content) {
    fs.writeFileSync(CONTENT_FILE, JSON.stringify(content, null, 2));
}

function verifyPassword(password, storedValue) {
    const parts = String(storedValue).split(":");
    if (parts.length !== 2) {
        return false;
    }

    const salt = parts[0];
    const storedHash = Buffer.from(parts[1], "hex");
    const calculatedHash = crypto.scryptSync(String(password), salt, storedHash.length);

    return crypto.timingSafeEqual(storedHash, calculatedHash);
}

function isSafeImagePath(value) {
    return typeof value === "string"
        && value.length > 0
        && value.length <= 500
        && /^\/[A-Za-z0-9._\-\/% ]+$/.test(value)
        && !value.includes("..");
}

function sanitizeContent(input) {
    const sanitized = {};

    Object.keys(CONTENT_SCHEMA).forEach((key) => {
        const fieldType = CONTENT_SCHEMA[key];
        const value = input[key];

        if (typeof value !== "string") {
            throw new Error(`Ungültiger Wert für ${key}.`);
        }

        const trimmed = value.trim();

        if (fieldType === "image") {
            if (!isSafeImagePath(trimmed)) {
                throw new Error(`Ungültiger Bildpfad für ${key}.`);
            }
            sanitized[key] = trimmed;
            return;
        }

        if (!trimmed) {
            throw new Error(`Das Feld ${key} darf nicht leer sein.`);
        }

        if (trimmed.length > 5000) {
            throw new Error(`Das Feld ${key} ist zu lang.`);
        }

        sanitized[key] = trimmed;
    });

    return sanitized;
}

function ensureAuthenticated(req, res, next) {
    if (req.session && req.session.isAuthenticated) {
        return next();
    }

    return res.status(401).json({ error: "Nicht angemeldet." });
}

function sendRootFile(res, filename) {
    return res.sendFile(path.join(ROOT_DIR, filename));
}

function isTrustedOrigin(req) {
    const origin = req.get("origin");
    const referer = req.get("referer");
    const host = req.get("host");

    if (!host) {
        return false;
    }

    const candidates = [origin, referer].filter(Boolean);

    if (candidates.length === 0) {
        return true;
    }

    return candidates.every((value) => {
        try {
            const parsed = new URL(value);
            return parsed.host === host;
        } catch (_error) {
            return false;
        }
    });
}

function requireSameOrigin(req, res, next) {
    if (!isTrustedOrigin(req)) {
        return res.status(403).json({ error: "Ungültige Herkunft der Anfrage." });
    }

    return next();
}

const upload = multer({
    storage: multer.diskStorage({
        destination: function (_req, _file, cb) {
            cb(null, UPLOADS_DIR);
        },
        filename: function (_req, file, cb) {
            const ext = path.extname(file.originalname).toLowerCase();
            cb(null, `${Date.now()}-${crypto.randomBytes(8).toString("hex")}${ext}`);
        }
    }),
    limits: {
        fileSize: 5 * 1024 * 1024
    },
    fileFilter: function (_req, file, cb) {
        const ext = path.extname(file.originalname).toLowerCase();
        if (!file.mimetype.startsWith("image/") || ![".jpg", ".jpeg", ".png", ".webp", ".gif"].includes(ext)) {
            cb(new Error("Es sind nur Bild-Uploads erlaubt."));
            return;
        }

        cb(null, true);
    }
});

app.disable("x-powered-by");
app.set("trust proxy", 1);

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: false }));
app.use(session({
    store: new FileStore({
        path: SESSIONS_DIR,
        retries: 0
    }),
    name: "kita.sid",
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        sameSite: "lax",
        secure: IS_PRODUCTION,
        maxAge: 1000 * 60 * 60 * 8
    }
}));

app.use(function (_req, res, next) {
    res.setHeader("X-Frame-Options", "SAMEORIGIN");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    res.setHeader("Content-Security-Policy", "default-src 'self'; img-src 'self' data: blob:; style-src 'self' https://fonts.googleapis.com 'unsafe-inline'; font-src 'self' https://fonts.gstatic.com; script-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'self'; form-action 'self'");
    if (IS_PRODUCTION) {
        res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
    }
    next();
});

app.use("/assets", express.static(path.join(ROOT_DIR, "assets")));
app.use("/uploads", express.static(UPLOADS_DIR, {
    fallthrough: false,
    index: false,
    maxAge: IS_PRODUCTION ? "7d" : 0
}));

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Zu viele Login-Versuche. Bitte später erneut versuchen." }
});

app.get("/", function (_req, res) {
    sendRootFile(res, "index.html");
});

app.get("/admin", function (_req, res) {
    sendRootFile(res, "admin.html");
});

app.get("/api/content", function (_req, res) {
    res.json(readContent());
});

app.get("/api/auth/session", function (req, res) {
    res.json({
        authenticated: Boolean(req.session && req.session.isAuthenticated),
        username: req.session && req.session.isAuthenticated ? ADMIN_USERNAME : null
    });
});

app.post("/api/auth/login", loginLimiter, requireSameOrigin, function (req, res) {
    const username = String(req.body.username || "").trim();
    const password = String(req.body.password || "");

    if (username !== ADMIN_USERNAME || !verifyPassword(password, ADMIN_PASSWORD_HASH)) {
        return res.status(401).json({ error: "Login fehlgeschlagen." });
    }

    req.session.regenerate(function (error) {
        if (error) {
            return res.status(500).json({ error: "Session konnte nicht erstellt werden." });
        }

        req.session.isAuthenticated = true;
        req.session.username = ADMIN_USERNAME;
        return res.json({ success: true });
    });
});

app.post("/api/auth/logout", requireSameOrigin, function (req, res) {
    if (!req.session) {
        return res.json({ success: true });
    }

    req.session.destroy(function () {
        res.clearCookie("kita.sid");
        res.json({ success: true });
    });
});

app.get("/api/admin/content", ensureAuthenticated, function (_req, res) {
    res.setHeader("Cache-Control", "no-store");
    res.json(readContent());
});

app.put("/api/admin/content", ensureAuthenticated, requireSameOrigin, function (req, res) {
    try {
        const sanitized = sanitizeContent(req.body);
        writeContent(sanitized);
        res.json({ success: true });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.post("/api/admin/upload", ensureAuthenticated, requireSameOrigin, function (req, res, next) {
    upload.single("image")(req, res, function (error) {
        if (error) {
            return res.status(400).json({ error: error.message });
        }

        return next();
    });
}, function (req, res) {
    if (!req.file) {
        return res.status(400).json({ error: "Keine Datei erhalten." });
    }

    res.json({
        success: true,
        path: `/uploads/${req.file.filename}`
    });
});

app.get("/:filename", function (req, res, next) {
    const filename = req.params.filename;
    if (!PUBLIC_ROOT_FILES.has(filename)) {
        return next();
    }

    return sendRootFile(res, filename);
});

app.use(function (_req, res) {
    res.status(404).send("Not found");
});

app.listen(PORT, function () {
    console.log(`Kita server listening on http://localhost:${PORT}`);
});
