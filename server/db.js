const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'ecommerce.db');
const db = new sqlite3.Database(dbPath);

// Enforce FK constraints (SQLite keeps this OFF by default unless you enable it)
db.serialize(() => {
  db.run('PRAGMA foreign_keys = ON');
});

const initDb = () => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Drop existing tables to ensure schema updates
      // (Real apps should use migrations; this is fine for a scratch project.)
      db.run(`DROP TABLE IF EXISTS order_items`);
      db.run(`DROP TABLE IF EXISTS orders`);
      db.run(`DROP TABLE IF EXISTS reviews`);
      db.run(`DROP TABLE IF EXISTS promotion_categories`);
      db.run(`DROP TABLE IF EXISTS promotion_products`);
      db.run(`DROP TABLE IF EXISTS promotions`);
      db.run(`DROP TABLE IF EXISTS hero_products`);
      db.run(`DROP TABLE IF EXISTS product_images`);
      db.run(`DROP TABLE IF EXISTS product_categories`);
      db.run(`DROP TABLE IF EXISTS products`);
      db.run(`DROP TABLE IF EXISTS users`);
      db.run(`DROP TABLE IF EXISTS categories`);

      // Categories table (supports parent/child: categories + subcategories)
      db.run(`CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        icon TEXT,
        parent_id INTEGER,
        FOREIGN KEY (parent_id) REFERENCES categories (id) ON DELETE CASCADE
      )`);

      db.run(`CREATE INDEX IF NOT EXISTS idx_categories_parent ON categories(parent_id)`);

      // Users table (Device ID tracking)
      db.run(`CREATE TABLE IF NOT EXISTS users (
        device_id TEXT PRIMARY KEY,
        username TEXT NOT NULL,
        email TEXT NOT NULL,
        phone_number TEXT NOT NULL,
        avatar_url TEXT,
        location TEXT,
        is_confirmed INTEGER DEFAULT 0,
        confirmation_token TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);

      // Products table
      db.run(`CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        price REAL NOT NULL,
        average_rating REAL DEFAULT 0,
        review_count INTEGER DEFAULT 0,
        badge TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);

      // Product <-> Categories (supports primary category + extra tags)
      db.run(`CREATE TABLE IF NOT EXISTS product_categories (
        product_id INTEGER NOT NULL,
        category_id INTEGER NOT NULL,
        is_primary INTEGER DEFAULT 0,
        PRIMARY KEY (product_id, category_id),
        FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE,
        FOREIGN KEY (category_id) REFERENCES categories (id) ON DELETE CASCADE
      )`);

      db.run(`CREATE INDEX IF NOT EXISTS idx_product_categories_category ON product_categories(category_id)`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_product_categories_product ON product_categories(product_id)`);

      // Product Images table (multiple images per product)
      db.run(`CREATE TABLE IF NOT EXISTS product_images (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id INTEGER NOT NULL,
        image_path TEXT NOT NULL,
        is_primary INTEGER DEFAULT 0,
        sort_order INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE
      )`);

      db.run(`CREATE INDEX IF NOT EXISTS idx_images_product ON product_images(product_id)`);

      // Reviews table (Linked to users via device_id)
      db.run(`CREATE TABLE IF NOT EXISTS reviews (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id INTEGER,
        device_id TEXT,
        rating INTEGER,
        comment TEXT,
        likes_count INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE,
        FOREIGN KEY (device_id) REFERENCES users (device_id) ON DELETE SET NULL
      )`);

      // Orders table (Linked to users via device_id)
      db.run(`CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        device_id TEXT,
        total_amount REAL NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (device_id) REFERENCES users (device_id) ON DELETE SET NULL
      )`);

      // Hero Products table
      db.run(`CREATE TABLE IF NOT EXISTS hero_products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id INTEGER,
        detail_text TEXT,
        display_order INTEGER DEFAULT 0,
        is_active INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE
      )`);

      // Promotions (banners / deals shown on client)
      db.run(`CREATE TABLE IF NOT EXISTS promotions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        subtitle TEXT,
        description TEXT,
        image_path TEXT,
        promo_type TEXT NOT NULL,          -- "percent" | "fixed" | "bogo" | etc
        discount_value REAL DEFAULT 0,      -- 15 => 15% if promo_type="percent"
        coupon_code TEXT,
        start_at DATETIME,
        end_at DATETIME,
        priority INTEGER DEFAULT 0,
        is_active INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);

      // Promo targets (optional)
      db.run(`CREATE TABLE IF NOT EXISTS promotion_products (
        promotion_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        PRIMARY KEY (promotion_id, product_id),
        FOREIGN KEY (promotion_id) REFERENCES promotions (id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE
      )`);

      db.run(`CREATE TABLE IF NOT EXISTS promotion_categories (
        promotion_id INTEGER NOT NULL,
        category_id INTEGER NOT NULL,
        PRIMARY KEY (promotion_id, category_id),
        FOREIGN KEY (promotion_id) REFERENCES promotions (id) ON DELETE CASCADE,
        FOREIGN KEY (category_id) REFERENCES categories (id) ON DELETE CASCADE
      )`);

      db.run(`CREATE INDEX IF NOT EXISTS idx_promotions_active_dates ON promotions(is_active, start_at, end_at)`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_promo_products ON promotion_products(product_id)`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_promo_categories ON promotion_categories(category_id)`);

      // Order items table
      db.run(`CREATE TABLE IF NOT EXISTS order_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id INTEGER,
        product_id INTEGER,
        quantity INTEGER,
        price REAL,
        FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE SET NULL
      )`, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  });
};

module.exports = { db, initDb };
