const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { db } = require('./db');
const { sendConfirmationEmail } = require('./email');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(bodyParser.json());

// ---------- SQLite helpers ----------
const dbAll = (sql, params = []) =>
    new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => (err ? reject(err) : resolve(rows)));
    });

const dbGet = (sql, params = []) =>
    new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => (err ? reject(err) : resolve(row)));
    });

const dbRun = (sql, params = []) =>
    new Promise((resolve, reject) => {
        db.run(sql, params, function (err) {
            if (err) reject(err);
            else resolve(this);
        });
    });

// ---------- Users ----------
app.post('/api/users/identify', async (req, res) => {
    const { device_id, username, email, phone_number, avatar_url, location } = req.body;

    if (!device_id) return res.status(400).json({ error: 'Device ID required' });

    try {
        const user = await dbGet(`SELECT * FROM users WHERE device_id = ?`, [device_id]);
        if (user) return res.json(user);

        // Register new user (if any details were provided)
        if (username && email && phone_number) {
            const confirmationToken = Math.random().toString(36).substring(2, 15);

            await dbRun(
                `INSERT INTO users (device_id, username, email, phone_number, avatar_url, location, confirmation_token)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [device_id, username, email, phone_number, avatar_url || null, location || null, confirmationToken]
            );

            sendConfirmationEmail(email, confirmationToken);

            const newUser = await dbGet(`SELECT * FROM users WHERE device_id = ?`, [device_id]);
            return res.status(201).json(newUser);
        }

        return res.json({ device_id }); // not registered yet
    } catch (err) {
        console.error('User identify error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

app.get('/api/users/confirm/:token', async (req, res) => {
    const { token } = req.params;
    try {
        await dbRun(`UPDATE users SET is_confirmed = 1 WHERE confirmation_token = ?`, [token]);
        res.send('✅ Email confirmed successfully. You can now close this tab.');
    } catch (err) {
        console.error('Confirm error:', err);
        res.status(500).send('Server error');
    }
});

// ---------- Categories ----------
/**
 * GET /api/categories
 * Returns only top-level categories (parent_id IS NULL)
 */
app.get('/api/categories', async (req, res) => {
    try {
        const cats = await dbAll(
            `SELECT c.id, c.name, c.icon,
              EXISTS(SELECT 1 FROM categories sc WHERE sc.parent_id = c.id) AS has_children
       FROM categories c
       WHERE c.parent_id IS NULL
       ORDER BY c.name ASC`
        );
        res.json(cats);
    } catch (err) {
        console.error('Categories error:', err);
        res.status(500).json({ error: 'Database error' });
    }
});

/**
 * GET /api/categories/tree
 * Returns: [{ id, name, icon, subcategories: [...] }]
 */
app.get('/api/categories/tree', async (req, res) => {
    try {
        const parents = await dbAll(
            `SELECT id, name, icon
       FROM categories
       WHERE parent_id IS NULL
       ORDER BY name ASC`
        );
        const children = await dbAll(
            `SELECT id, name, icon, parent_id
       FROM categories
       WHERE parent_id IS NOT NULL
       ORDER BY name ASC`
        );

        const byParent = new Map();
        children.forEach((c) => {
            if (!byParent.has(c.parent_id)) byParent.set(c.parent_id, []);
            byParent.get(c.parent_id).push({ id: c.id, name: c.name, icon: c.icon, parent_id: c.parent_id });
        });

        const tree = parents.map((p) => ({
            ...p,
            subcategories: byParent.get(p.id) || [],
        }));

        res.json(tree);
    } catch (err) {
        console.error('Categories tree error:', err);
        res.status(500).json({ error: 'Database error' });
    }
});

/**
 * GET /api/categories/:id/subcategories
 * Returns children categories for a given parent category id
 */
app.get('/api/categories/:id/subcategories', async (req, res) => {
    const { id } = req.params;
    try {
        const rows = await dbAll(
            `SELECT id, name, icon, parent_id
       FROM categories
       WHERE parent_id = ?
       ORDER BY name ASC`,
            [id]
        );
        res.json(rows);
    } catch (err) {
        console.error('Subcategories error:', err);
        res.status(500).json({ error: 'Database error' });
    }
});

// ---------- Products (paginated + category/subcategory filters) ----------
app.get('/api/products', async (req, res) => {
    try {
        const page = Math.max(parseInt(req.query.page || '1', 10), 1);
        const limit = Math.min(Math.max(parseInt(req.query.limit || '30', 10), 1), 100);
        const offset = (page - 1) * limit;

        const sort = (req.query.sort || 'popular').toString();
        const search = (req.query.search || '').toString().trim();

        // Accept both names (old & new), but prefer *_id going forward
        const categoryId = req.query.category_id ? parseInt(req.query.category_id, 10) : null;
        const subcategoryId = req.query.subcategory_id ? parseInt(req.query.subcategory_id, 10) : null;

        // If you pass subcategory_id, that is the filter. Otherwise category_id.
        const filterId = subcategoryId || categoryId;

        const where = [];
        const params = [];

        if (search) {
            where.push(`(p.name LIKE ? OR p.description LIKE ?)`);
            params.push(`%${search}%`, `%${search}%`);
        }

        // category/subcategory filter (includes descendants via recursive CTE)
        let cte = '';
        if (filterId) {
            cte = `
        WITH RECURSIVE descendants(id) AS (
          SELECT id FROM categories WHERE id = ?
          UNION ALL
          SELECT c.id FROM categories c JOIN descendants d ON c.parent_id = d.id
        )
      `;
            params.unshift(filterId); // this must be first param for the CTE
            where.push(`
        EXISTS (
          SELECT 1
          FROM product_categories pc2
          WHERE pc2.product_id = p.id
            AND pc2.category_id IN (SELECT id FROM descendants)
        )
      `);
        }

        let orderBy = `p.review_count DESC, p.average_rating DESC`;
        if (sort === 'price_asc') orderBy = `p.price ASC`;
        if (sort === 'price_desc') orderBy = `p.price DESC`;
        if (sort === 'newest') orderBy = `p.created_at DESC`;

        const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

        // total count
        const countRow = await dbGet(
            `${cte}
       SELECT COUNT(DISTINCT p.id) AS totalItems
       FROM products p
       ${whereSql}`,
            params
        );

        const totalItems = countRow?.totalItems || 0;
        const totalPages = Math.max(Math.ceil(totalItems / limit), 1);

        // fetch page
        const rows = await dbAll(
            `${cte}
       SELECT
         p.id, p.name, p.description, p.price, p.average_rating, p.review_count, p.badge,
         pc.category_id AS primary_category_id,
         c.name AS primary_category_name,
         c.parent_id AS primary_category_parent_id,
         (SELECT pi2.image_path
          FROM product_images pi2
          WHERE pi2.product_id = p.id
          ORDER BY pi2.is_primary DESC, pi2.sort_order ASC, pi2.id ASC
          LIMIT 1) AS image,
         GROUP_CONCAT(pi.image_path) AS images_csv
       FROM products p
       LEFT JOIN product_categories pc ON pc.product_id = p.id AND pc.is_primary = 1
       LEFT JOIN categories c ON c.id = pc.category_id
       LEFT JOIN product_images pi ON pi.product_id = p.id
       ${whereSql}
       GROUP BY p.id
       ORDER BY ${orderBy}
       LIMIT ? OFFSET ?`,
            [...params, limit, offset]
        );

        const items = rows.map((r) => {
            const images = (r.images_csv ? r.images_csv.split(',') : []).filter(Boolean);
            return {
                id: r.id,
                name: r.name,
                description: r.description,
                price: r.price,
                average_rating: r.average_rating,
                review_count: r.review_count,
                badge: r.badge,
                primary_category_id: r.primary_category_id,
                primary_category_name: r.primary_category_name,
                primary_category_parent_id: r.primary_category_parent_id,
                image: r.image || images[0] || null,
                images,
            };
        });

        res.json({ items, page, limit, totalItems, totalPages });
    } catch (err) {
        console.error('Products error:', err);
        res.status(500).json({ error: 'Database error' });
    }
});

// ---------- Top Reviews ----------
app.get('/api/reviews/top', async (req, res) => {
    try {
        const reviews = await dbAll(
            `SELECT r.id, r.rating, r.comment, r.likes_count, r.created_at,
              u.username, u.avatar_url,
              p.name AS product_name, p.description AS product_description, p.price,
              (SELECT pi2.image_path
               FROM product_images pi2
               WHERE pi2.product_id = p.id
               ORDER BY pi2.is_primary DESC, pi2.sort_order ASC, pi2.id ASC
               LIMIT 1) AS product_image
       FROM reviews r
       JOIN users u ON r.device_id = u.device_id
       JOIN products p ON r.product_id = p.id
       ORDER BY r.likes_count DESC
       LIMIT 6`
        );

        res.json(reviews);
    } catch (err) {
        console.error('Reviews error:', err);
        res.status(500).json({ error: 'Database error' });
    }
});

// ---------- Hero Products ----------
app.get('/api/hero-products', async (req, res) => {
    try {
        const rows = await dbAll(
            `SELECT hp.id, hp.detail_text, hp.display_order, hp.is_active,
              p.id AS product_id, p.name, p.description, p.price, p.badge,
              c.name AS category_name,
              (SELECT pi2.image_path
               FROM product_images pi2
               WHERE pi2.product_id = p.id
               ORDER BY pi2.is_primary DESC, pi2.sort_order ASC, pi2.id ASC
               LIMIT 1) AS image
       FROM hero_products hp
       JOIN products p ON hp.product_id = p.id
       LEFT JOIN product_categories pc ON pc.product_id = p.id AND pc.is_primary = 1
       LEFT JOIN categories c ON c.id = pc.category_id
       WHERE hp.is_active = 1
       ORDER BY hp.display_order ASC`
        );

        res.json(
            rows.map((r) => ({
                id: r.id,
                detail_text: r.detail_text,
                display_order: r.display_order,
                is_active: r.is_active,
                product: {
                    id: r.product_id,
                    name: r.name,
                    description: r.description,
                    price: r.price,
                    badge: r.badge,
                    category: r.category_name,
                    image: r.image,
                },
            }))
        );
    } catch (err) {
        console.error('Hero products error:', err);
        res.status(500).json({ error: 'Database error' });
    }
});

// ---------- Promotions ----------
app.get('/api/promotions', async (req, res) => {
    try {
        const promos = await dbAll(
            `SELECT *
       FROM promotions
       WHERE is_active = 1
         AND (start_at IS NULL OR start_at <= CURRENT_TIMESTAMP)
         AND (end_at IS NULL OR end_at >= CURRENT_TIMESTAMP)
       ORDER BY priority DESC, created_at DESC`
        );
        res.json(promos);
    } catch (err) {
        console.error('Promotions error:', err);
        res.status(500).json({ error: 'Database error' });
    }
});

// ---------- Product Detail + Reviews (for ProductPage) ----------

// GET /api/products/:id  (single product + all images)
app.get('/api/products/:id', async (req, res) => {
    try {
        const id = Number(req.params.id);

        const row = await dbGet(
            `SELECT
         p.id, p.name, p.description, p.price, p.average_rating, p.review_count, p.badge,
         pc.category_id AS primary_category_id,
         c.name AS primary_category_name,
         c.parent_id AS primary_category_parent_id,
         GROUP_CONCAT(pi.image_path) AS images_csv
       FROM products p
       LEFT JOIN product_categories pc ON pc.product_id = p.id AND pc.is_primary = 1
       LEFT JOIN categories c ON c.id = pc.category_id
       LEFT JOIN product_images pi ON pi.product_id = p.id
       WHERE p.id = ?
       GROUP BY p.id`,
            [id]
        );

        if (!row) return res.status(404).json({ error: "Product not found" });

        const images = (row.images_csv ? row.images_csv.split(",") : []).filter(Boolean);

        res.json({
            id: row.id,
            name: row.name,
            description: row.description,
            price: row.price,
            average_rating: row.average_rating,
            review_count: row.review_count,
            badge: row.badge,
            primary_category_id: row.primary_category_id,
            primary_category_name: row.primary_category_name,
            primary_category_parent_id: row.primary_category_parent_id,
            images,
        });
    } catch (err) {
        console.error("Product detail error:", err);
        res.status(500).json({ error: "Database error" });
    }
});

// GET /api/products/:id/reviews
app.get('/api/products/:id/reviews', async (req, res) => {
    try {
        const productId = Number(req.params.id);

        const rows = await dbAll(
            `SELECT r.id, r.rating, r.comment, r.likes_count, r.created_at,
              u.username, u.avatar_url
       FROM reviews r
       JOIN users u ON u.device_id = r.device_id
       WHERE r.product_id = ?
       ORDER BY r.likes_count DESC, r.created_at DESC`,
            [productId]
        );

        res.json(rows);
    } catch (err) {
        console.error("Product reviews error:", err);
        res.status(500).json({ error: "Database error" });
    }
});

// POST /api/products/:id/reviews  (registered users only)
app.post('/api/products/:id/reviews', async (req, res) => {
    try {
        const productId = Number(req.params.id);
        const { device_id, rating, comment } = req.body;

        if (!device_id) return res.status(401).json({ error: "device_id required" });
        if (!rating || rating < 1 || rating > 5) return res.status(400).json({ error: "rating must be 1-5" });
        if (!comment || !String(comment).trim()) return res.status(400).json({ error: "comment required" });

        // must be registered
        const u = await dbGet(`SELECT device_id FROM users WHERE device_id = ?`, [device_id]);
        if (!u) return res.status(401).json({ error: "User not registered" });

        await dbRun(
            `INSERT INTO reviews (product_id, device_id, rating, comment, likes_count)
       VALUES (?, ?, ?, ?, 0)`,
            [productId, device_id, rating, comment]
        );

        // refresh rating + count on product
        const agg = await dbGet(
            `SELECT AVG(rating) AS avg_rating, COUNT(*) AS cnt
       FROM reviews
       WHERE product_id = ?`,
            [productId]
        );

        await dbRun(
            `UPDATE products
       SET average_rating = ?, review_count = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
            [Number(agg.avg_rating || 0), Number(agg.cnt || 0), productId]
        );

        res.json({ ok: true });
    } catch (err) {
        console.error("Create review error:", err);
        res.status(500).json({ error: "Database error" });
    }
});

// POST /api/reviews/:id/like  (registered users only)
app.post('/api/reviews/:id/like', async (req, res) => {
    try {
        const reviewId = Number(req.params.id);
        const { device_id } = req.body;

        if (!device_id) return res.status(401).json({ error: "device_id required" });

        const u = await dbGet(`SELECT device_id FROM users WHERE device_id = ?`, [device_id]);
        if (!u) return res.status(401).json({ error: "User not registered" });

        await dbRun(`UPDATE reviews SET likes_count = likes_count + 1 WHERE id = ?`, [reviewId]);
        res.json({ ok: true });
    } catch (err) {
        console.error("Like error:", err);
        res.status(500).json({ error: "Database error" });
    }
});

// GET /api/products/:id/related  (same primary category)
app.get('/api/products/:id/related', async (req, res) => {
    try {
        const id = Number(req.params.id);
        const limit = Math.min(Math.max(Number(req.query.limit || 8), 1), 24);

        const catRow = await dbGet(
            `SELECT category_id AS primary_category_id
       FROM product_categories
       WHERE product_id = ? AND is_primary = 1
       LIMIT 1`,
            [id]
        );

        if (!catRow?.primary_category_id) return res.json([]);

        const rows = await dbAll(
            `SELECT
         p.id, p.name, p.description, p.price, p.average_rating, p.review_count, p.badge,
         GROUP_CONCAT(pi.image_path) AS images_csv
       FROM products p
       JOIN product_categories pc ON pc.product_id = p.id AND pc.is_primary = 1
       LEFT JOIN product_images pi ON pi.product_id = p.id
       WHERE pc.category_id = ? AND p.id != ?
       GROUP BY p.id
       ORDER BY p.review_count DESC, p.average_rating DESC, p.created_at DESC
       LIMIT ?`,
            [catRow.primary_category_id, id, limit]
        );

        const items = rows.map((r) => ({
            ...r,
            images: (r.images_csv ? r.images_csv.split(",") : []).filter(Boolean),
        }));

        res.json(items);
    } catch (err) {
        console.error("Related error:", err);
        res.status(500).json({ error: "Database error" });
    }
});


app.listen(PORT, () => {
    console.log(`✅ Server running at http://localhost:${PORT}`);
});
