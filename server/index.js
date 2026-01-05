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

// ---------- Users & Auth ----------

/**
 * Identify or register a user by device_id
 * Returns existing user or creates a placeholder
 */
app.post('/api/users/identify', async (req, res) => {
    const { device_id, username, email, phone_number, avatar_url, location } = req.body;

    if (!device_id) return res.status(400).json({ error: 'Device ID required' });

    try {
        let user = await dbGet(`SELECT * FROM users WHERE device_id = ?`, [device_id]);

        if (!user && (email || phone_number)) {
            // Auto-register if details provided
            await dbRun(
                `INSERT INTO users (device_id, username, email, phone_number, avatar_url, location, is_confirmed)
                 VALUES (?, ?, ?, ?, ?, ?, 1)`,
                [device_id, username || `User_${device_id.slice(-4)}`, email || null, phone_number || null, avatar_url || null, location || null]
            );
            user = await dbGet(`SELECT * FROM users WHERE device_id = ?`, [device_id]);
        }

        res.json(user || { device_id });
    } catch (err) {
        console.error('User identify error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * Request OTP (Generates 6-digit code)
 */
app.post('/api/auth/otp-request', async (req, res) => {
    const { email, phone_number, device_id } = req.body;
    if (!email && !phone_number) return res.status(400).json({ error: 'Email or phone required' });

    try {
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiry = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 mins

        // Update or create user
        let user = await dbGet(`SELECT * FROM users WHERE email = ? OR phone_number = ?`, [email, phone_number]);

        if (user) {
            await dbRun(`UPDATE users SET otp = ?, otp_expiry = ? WHERE id = ?`, [otp, expiry, user.id]);
        } else {
            const devId = device_id || `dev-${Math.random().toString(36).slice(2, 9)}`;
            await dbRun(
                `INSERT INTO users (device_id, email, phone_number, otp, otp_expiry, username) VALUES (?, ?, ?, ?, ?, ?)`,
                [devId, email || null, phone_number || null, otp, expiry, email || phone_number]
            );
        }

        console.log(`🔑 OTP for ${email || phone_number}: ${otp}`); // For frontend simulation
        res.json({ message: 'OTP sent successfully', otp }); // Returning OTP for easy dev
    } catch (err) {
        console.error('OTP request error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * Verify OTP
 */
app.post('/api/auth/otp-verify', async (req, res) => {
    const { email, phone_number, otp } = req.body;

    try {
        const user = await dbGet(
            `SELECT * FROM users WHERE (email = ? OR phone_number = ?) AND otp = ? AND otp_expiry > CURRENT_TIMESTAMP`,
            [email, phone_number, otp]
        );

        if (!user) return res.status(400).json({ error: 'Invalid or expired OTP' });

        // Clear OTP
        await dbRun(`UPDATE users SET otp = NULL, otp_expiry = NULL, is_confirmed = 1 WHERE id = ?`, [user.id]);

        res.json({ success: true, user });
    } catch (err) {
        console.error('OTP verify error:', err);
        res.status(500).json({ error: 'Server error' });
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
            `SELECT c.id, c.name, c.icon, c.description, c.banner_image,
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
            `SELECT id, name, icon, description, banner_image
       FROM categories
       WHERE parent_id IS NULL
       ORDER BY name ASC`
        );
        const children = await dbAll(
            `SELECT id, name, icon, description, banner_image, parent_id
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
            `SELECT id, name, icon, description, banner_image, parent_id
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
        const categoryId = req.query.category_id ? parseInt(req.query.category_id, 10) : null;
        const subcategoryId = req.query.subcategory_id ? parseInt(req.query.subcategory_id, 10) : null;
        const collectionId = req.query.collection_id ? parseInt(req.query.collection_id, 10) : null;

        const filterId = subcategoryId || categoryId;
        const where = [];
        const params = [];

        if (search) {
            where.push(`(p.name LIKE ? OR p.description LIKE ?)`);
            params.push(`%${search}%`, `%${search}%`);
        }
        if (collectionId) {
            where.push(`p.collection_id = ?`);
            params.push(collectionId);
        }

        let cte = '';
        if (filterId) {
            cte = `WITH RECURSIVE descendants(id) AS (SELECT id FROM categories WHERE id = ? UNION ALL SELECT c.id FROM categories c JOIN descendants d ON c.parent_id = d.id)`;
            params.unshift(filterId);
            where.push(`EXISTS (SELECT 1 FROM product_categories pc2 WHERE pc2.product_id = p.id AND pc2.category_id IN (SELECT id FROM descendants))`);
        }

        let orderBy = `p.review_count DESC, p.average_rating DESC`;
        if (sort === 'price_asc') orderBy = `p.price ASC`;
        if (sort === 'price_desc') orderBy = `p.price DESC`;
        if (sort === 'newest') orderBy = `p.created_at DESC`;

        const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

        const countRow = await dbGet(`${cte} SELECT COUNT(DISTINCT p.id) AS totalItems FROM products p ${whereSql}`, params);
        const totalItems = countRow?.totalItems || 0;
        const totalPages = Math.ceil(totalItems / limit) || 1;

        const rows = await dbAll(
            `${cte}
            SELECT p.*, coll.name as collection_name,
                (SELECT image_path FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1) as image,
                (SELECT promo.id || '||' || promo.title || '||' || promo.promo_type || '||' || promo.discount_value
                 FROM promotions promo
                 LEFT JOIN promotion_products pp ON pp.promotion_id = promo.id
                 LEFT JOIN promotion_categories pc ON pc.promotion_id = promo.id
                 LEFT JOIN product_categories pcat ON pcat.category_id = pc.category_id
                 WHERE (pp.product_id = p.id OR pcat.product_id = p.id)
                   AND promo.is_active = 1
                 LIMIT 1) as promo_info
            FROM products p
            LEFT JOIN collections coll ON coll.id = p.collection_id
            ${whereSql}
            ORDER BY ${orderBy}
            LIMIT ? OFFSET ?`,
            [...params, limit, offset]
        );

        const items = rows.map(r => {
            let promotion = null;
            let discountedPrice = r.price;

            if (r.promo_info) {
                const [id, title, type, val] = r.promo_info.split('||');
                promotion = { id: Number(id), title, type, value: Number(val) };
                if (type === 'percent') discountedPrice = r.price * (1 - promotion.value / 100);
                else discountedPrice = Math.max(0, r.price - promotion.value);
            }

            return {
                ...r,
                promotion,
                discounted_price: Number(discountedPrice.toFixed(2))
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

// ---------- Collections ----------
app.get('/api/collections', async (req, res) => {
    try {
        const rows = await dbAll(
            `SELECT * FROM collections WHERE is_active = 1 ORDER BY id DESC`
        );
        res.json(rows);
    } catch (err) {
        console.error('Collections error:', err);
        res.status(500).json({ error: 'Database error' });
    }
});

app.get('/api/collections/:id/products', async (req, res) => {
    try {
        const collId = Number(req.params.id);
        const rows = await dbAll(
            `SELECT p.*,
               (SELECT image_path FROM product_images pi WHERE pi.product_id = p.id AND pi.is_primary = 1 LIMIT 1) as image
             FROM products p
             WHERE p.collection_id = ?`,
            [collId]
        );
        res.json(rows);
    } catch (err) {
        console.error('Collection products error:', err);
        res.status(500).json({ error: 'Database error' });
    }
});

// ---------- Product Detail + Reviews (for ProductPage) ----------

// GET /api/products/:id  (single product + all images + variants)
app.get('/api/products/:id', async (req, res) => {
    try {
        const id = Number(req.params.id);

        const row = await dbGet(
            `SELECT p.*, coll.name as collection_name,
                (SELECT GROUP_CONCAT(image_path) FROM product_images WHERE product_id = p.id) as images_csv,
                (SELECT promo.id || '||' || promo.title || '||' || promo.promo_type || '||' || promo.discount_value
                 FROM promotions promo
                 LEFT JOIN promotion_products pp ON pp.promotion_id = promo.id
                 LEFT JOIN promotion_categories pc ON pc.promotion_id = promo.id
                 LEFT JOIN product_categories pcat ON pcat.category_id = pc.category_id
                 WHERE (pp.product_id = p.id OR pcat.product_id = p.id)
                   AND promo.is_active = 1
                 LIMIT 1) as promo_info
            FROM products p
            LEFT JOIN collections coll ON coll.id = p.collection_id
            WHERE p.id = ?`,
            [id]
        );

        if (!row) return res.status(404).json({ error: "Product not found" });

        const variants = await dbAll(
            `SELECT v.id, v.stock_quantity, s.name as size, c.name as color, c.hex_code
             FROM product_variants v
             JOIN sizes s ON s.id = v.size_id
             JOIN colors c ON c.id = v.color_id
             WHERE v.product_id = ?`,
            [id]
        );

        let promotion = null;
        let discountedPrice = row.price;

        if (row.promo_info) {
            const [pid, title, type, val] = row.promo_info.split('||');
            promotion = { id: Number(pid), title, type, value: Number(val) };
            if (type === 'percent') discountedPrice = row.price * (1 - promotion.value / 100);
            else discountedPrice = Math.max(0, row.price - promotion.value);
        }

        res.json({
            ...row,
            images: (row.images_csv ? row.images_csv.split(',') : []),
            variants,
            promotion,
            discounted_price: Number(discountedPrice.toFixed(2))
        });
    } catch (err) {
        console.error("Product detail error:", err);
        res.status(500).json({ error: "Database error" });
    }
});


// ---------- Wishlist & Likes ----------

/**
 * Toggle Wishlist (Product only)
 */
app.post('/api/wishlist/toggle', async (req, res) => {
    const { device_id, product_id } = req.body;
    if (!device_id || !product_id) return res.status(400).json({ error: 'device_id and product_id required' });

    try {
        const existing = await dbGet(`SELECT 1 FROM wishlists WHERE user_id = ? AND product_id = ?`, [device_id, product_id]);
        if (existing) {
            await dbRun(`DELETE FROM wishlists WHERE user_id = ? AND product_id = ?`, [device_id, product_id]);
            res.json({ action: 'removed' });
        } else {
            await dbRun(`INSERT INTO wishlists (user_id, product_id) VALUES (?, ?)`, [device_id, product_id]);
            res.json({ action: 'added' });
        }
    } catch (err) {
        console.error('Wishlist toggle error:', err);
        res.status(500).json({ error: 'Database error' });
    }
});

app.get('/api/wishlist/:deviceId', async (req, res) => {
    try {
        const rows = await dbAll(
            `SELECT p.*, (SELECT image_path FROM product_images pi WHERE pi.product_id = p.id AND pi.is_primary = 1 LIMIT 1) as image
             FROM products p
             JOIN wishlists w ON w.product_id = p.id
             WHERE w.user_id = ?`,
            [req.params.deviceId]
        );
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: 'Database error' });
    }
});

/**
 * Toggle Likes (Product or Collection)
 */
app.post('/api/likes/toggle', async (req, res) => {
    const { device_id, product_id, collection_id } = req.body;
    if (!device_id || (!product_id && !collection_id)) return res.status(400).json({ error: 'device_id and (product_id or collection_id) required' });

    try {
        if (product_id) {
            const existing = await dbGet(`SELECT 1 FROM product_likes WHERE user_id = ? AND product_id = ?`, [device_id, product_id]);
            if (existing) {
                await dbRun(`DELETE FROM product_likes WHERE user_id = ? AND product_id = ?`, [device_id, product_id]);
                res.json({ action: 'unliked', type: 'product' });
            } else {
                await dbRun(`INSERT INTO product_likes (user_id, product_id) VALUES (?, ?)`, [device_id, product_id]);
                res.json({ action: 'liked', type: 'product' });
            }
        } else {
            const existing = await dbGet(`SELECT 1 FROM collection_likes WHERE user_id = ? AND collection_id = ?`, [device_id, collection_id]);
            if (existing) {
                await dbRun(`DELETE FROM collection_likes WHERE user_id = ? AND collection_id = ?`, [device_id, collection_id]);
                res.json({ action: 'unliked', type: 'collection' });
            } else {
                await dbRun(`INSERT INTO collection_likes (user_id, collection_id) VALUES (?, ?)`, [device_id, collection_id]);
                res.json({ action: 'liked', type: 'collection' });
            }
        }
    } catch (err) {
        res.status(500).json({ error: 'Database error' });
    }
});

app.get('/api/likes/:deviceId', async (req, res) => {
    try {
        const products = await dbAll(`SELECT product_id FROM product_likes WHERE user_id = ?`, [req.params.deviceId]);
        const collections = await dbAll(`SELECT collection_id FROM collection_likes WHERE user_id = ?`, [req.params.deviceId]);
        res.json({ products: products.map(p => p.product_id), collections: collections.map(c => c.collection_id) });
    } catch (err) {
        res.status(500).json({ error: 'Database error' });
    }
});

// ---------- Reviews ----------

/**
 * Generic Review Submission (Supports product, collection, promotion)
 */
app.post('/api/reviews', async (req, res) => {
    try {
        const { device_id, rating, comment, product_id, collection_id, promotion_id } = req.body;

        if (!device_id) return res.status(401).json({ error: "device_id required" });
        if (!rating || rating < 1 || rating > 5) return res.status(400).json({ error: "rating must be 1-5" });
        if (!(product_id || collection_id || promotion_id)) return res.status(400).json({ error: "entity id required" });

        await dbRun(
            `INSERT INTO reviews (product_id, collection_id, promotion_id, device_id, rating, comment, likes_count)
             VALUES (?, ?, ?, ?, ?, ?, 0)`,
            [product_id || null, collection_id || null, promotion_id || null, device_id, rating, comment]
        );

        // Update target entity stats
        if (product_id) {
            const agg = await dbGet(`SELECT AVG(rating) as avg, COUNT(*) as cnt FROM reviews WHERE product_id = ?`, [product_id]);
            await dbRun(`UPDATE products SET average_rating = ?, review_count = ? WHERE id = ?`, [agg.avg || 0, agg.cnt || 0, product_id]);
        } else if (collection_id) {
            const agg = await dbGet(`SELECT AVG(rating) as avg, COUNT(*) as cnt FROM reviews WHERE collection_id = ?`, [collection_id]);
            await dbRun(`UPDATE collections SET average_rating = ?, review_count = ? WHERE id = ?`, [agg.avg || 0, agg.cnt || 0, collection_id]);
        } else if (promotion_id) {
            const agg = await dbGet(`SELECT AVG(rating) as avg, COUNT(*) as cnt FROM reviews WHERE promotion_id = ?`, [promotion_id]);
            await dbRun(`UPDATE promotions SET average_rating = ?, review_count = ? WHERE id = ?`, [agg.avg || 0, agg.cnt || 0, promotion_id]);
        }

        res.json({ ok: true });
    } catch (err) {
        console.error("Review error:", err);
        res.status(500).json({ error: "Database error" });
    }
});

// GET reviews for any entity
app.get('/api/reviews', async (req, res) => {
    const { product_id, collection_id, promotion_id } = req.query;
    try {
        let sql = `SELECT r.*, u.username, u.avatar_url FROM reviews r JOIN users u ON u.device_id = r.device_id WHERE `;
        let params = [];
        if (product_id) { sql += `r.product_id = ?`; params.push(product_id); }
        else if (collection_id) { sql += `r.collection_id = ?`; params.push(collection_id); }
        else if (promotion_id) { sql += `r.promotion_id = ?`; params.push(promotion_id); }
        else return res.status(400).json({ error: 'entity id required' });

        const rows = await dbAll(sql + ` ORDER BY r.likes_count DESC, r.created_at DESC`, params);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: 'Database error' });
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
