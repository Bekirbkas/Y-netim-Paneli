import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("apartman.db");

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS residents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    apartment_no TEXT NOT NULL,
    name TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS income_categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE
  );

  CREATE TABLE IF NOT EXISTS income_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    resident_id INTEGER NOT NULL,
    category_id INTEGER NOT NULL,
    month INTEGER NOT NULL, -- 1-12
    year INTEGER NOT NULL,
    amount REAL DEFAULT 0,
    status TEXT DEFAULT 'pending', -- 'paid', 'exempt', 'pending'
    FOREIGN KEY (resident_id) REFERENCES residents(id),
    FOREIGN KEY (category_id) REFERENCES income_categories(id)
  );

  CREATE TABLE IF NOT EXISTS expenses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    description TEXT NOT NULL,
    amount REAL NOT NULL
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
  );
`);

// Seed initial data if empty
const residentCount = db.prepare("SELECT COUNT(*) as count FROM residents").get() as { count: number };
if (residentCount.count === 0) {
  const residents = [
    "RECEP AKDOĞAN", "HASAN ÇOBAN", "GÜLSÜM TURHAN", "GÜLŞAH DOĞAN", "EKREM OKUMUŞ",
    "ÜNAL YEŞİLDAL", "İBRAHİM AKAR", "RECEP ŞANAL", "ADEM BİTİGEN", "MUTLU İPEK",
    "İBRAHİM ARSLAN", "SAİT YILMAZ", "MUSTAFA KAŞ", "SEDAT GENCER", "ÖZLEM ULU",
    "DÖNDÜ DEMİR", "RECEP ALTUĞ", "ŞAMBAZ ALTAN KAYMAZ", "ŞABAN TURHAN", "ALİ KOÇER"
  ];

  const insertResident = db.prepare("INSERT INTO residents (apartment_no, name) VALUES (?, ?)");
  residents.forEach((name, index) => {
    insertResident.run((index + 1).toString(), name);
  });

  const insertCategory = db.prepare("INSERT INTO income_categories (name) VALUES (?)");
  ["Aidat", "Asansör Revizyon", "Kamera Bakım"].forEach(cat => insertCategory.run(cat));

  db.prepare("INSERT INTO settings (key, value) VALUES (?, ?)").run("carryover", "3925");
}

async function startServer() {
  const app = express();
  app.use(express.json());

  // API Routes
  app.get("/api/data", (req, res) => {
    const residents = db.prepare("SELECT * FROM residents ORDER BY CAST(apartment_no AS INTEGER)").all();
    const categories = db.prepare("SELECT * FROM income_categories").all();
    const incomeRecords = db.prepare("SELECT * FROM income_records WHERE year = 2026").all();
    const expenses = db.prepare("SELECT * FROM expenses ORDER BY date DESC").all();
    const carryover = db.prepare("SELECT value FROM settings WHERE key = 'carryover'").get() as { value: string };

    res.json({ residents, categories, incomeRecords, expenses, carryover: parseFloat(carryover?.value || "0") });
  });

  app.post("/api/income", (req, res) => {
    const { resident_id, category_id, month, year, amount, status } = req.body;
    const existing = db.prepare("SELECT id FROM income_records WHERE resident_id = ? AND category_id = ? AND month = ? AND year = ?").get(resident_id, category_id, month, year) as { id: number };

    if (existing) {
      db.prepare("UPDATE income_records SET amount = ?, status = ? WHERE id = ?").run(amount, status, existing.id);
    } else {
      db.prepare("INSERT INTO income_records (resident_id, category_id, month, year, amount, status) VALUES (?, ?, ?, ?, ?, ?)").run(resident_id, category_id, month, year, amount, status);
    }
    res.json({ success: true });
  });

  app.delete("/api/income/:id", (req, res) => {
    db.prepare("DELETE FROM income_records WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  app.post("/api/expense", (req, res) => {
    const { date, description, amount } = req.body;
    db.prepare("INSERT INTO expenses (date, description, amount) VALUES (?, ?, ?)").run(date, description, amount);
    res.json({ success: true });
  });

  app.delete("/api/expense/:id", (req, res) => {
    db.prepare("DELETE FROM expenses WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  app.put("/api/expense/:id", (req, res) => {
    const { date, description, amount } = req.body;
    db.prepare("UPDATE expenses SET date = ?, description = ?, amount = ? WHERE id = ?").run(date, description, amount, req.params.id);
    res.json({ success: true });
  });

  app.post("/api/income-category", (req, res) => {
    const { name } = req.body;
    try {
      db.prepare("INSERT INTO income_categories (name) VALUES (?)").run(name);
      res.json({ success: true });
    } catch (e) {
      res.status(400).json({ error: "Kategori zaten mevcut" });
    }
  });

  app.post("/api/settings/carryover", (req, res) => {
    const { value } = req.body;
    db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)").run("carryover", value.toString());
    res.json({ success: true });
  });

  app.put("/api/resident/:id", (req, res) => {
    const { name } = req.body;
    db.prepare("UPDATE residents SET name = ? WHERE id = ?").run(name, req.params.id);
    res.json({ success: true });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  const PORT = 3000;
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
