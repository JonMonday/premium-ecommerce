const { db, initDb } = require('./db');

// Seed database with products, categories (with subcategories), users, reviews, hero products, and promotions
const seed = async () => {
    await initDb();

    // Top-level categories (parents)
    const parentCategories = [
        { id: 1, name: 'Computers & Accessories', icon: 'Laptop', parent_id: null },
        { id: 2, name: 'Video Games', icon: 'Gamepad', parent_id: null },
        { id: 3, name: 'Toys & Games', icon: 'ToyBox', parent_id: null },
        { id: 4, name: 'Electronics', icon: 'Cpu', parent_id: null },
        { id: 5, name: 'Home & Kitchen', icon: 'Home', parent_id: null },
        { id: 6, name: 'Fashion', icon: 'Shirt', parent_id: null },
    ];

    // Subcategories (children)
    const subCategories = [
        { id: 7, name: 'Laptops', icon: null, parent_id: 1 },
        { id: 8, name: 'Keyboards', icon: null, parent_id: 1 },

        { id: 9, name: 'VR', icon: null, parent_id: 2 },
        { id: 10, name: 'Consoles', icon: null, parent_id: 2 },

        { id: 11, name: 'Headphones', icon: null, parent_id: 4 },
        { id: 12, name: 'Smart Watches', icon: null, parent_id: 4 },

        { id: 13, name: 'Coffee & Espresso', icon: null, parent_id: 5 },
        { id: 14, name: 'Home Decor', icon: null, parent_id: 5 },

        { id: 15, name: 'Jackets', icon: null, parent_id: 6 },
    ];

    const categories = [...parentCategories, ...subCategories];
    const leafCategoryIds = subCategories.map((c) => c.id);

    const uniqueProducts = [
        {
            id: 1,
            name: 'ZenBook Pro Ultra',
            description:
                'Designed for productivity and creatives. Featuring a 4K OLED display and a high-end processor.',
            price: 1899.99,
            primaryCategoryId: 7,
            images: [
                {
                    path: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&q=80&w=600&h=600',
                    is_primary: 1,
                    sort_order: 0,
                },
                {
                    path: 'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?auto=format&fit=crop&q=80&w=600&h=600',
                    is_primary: 0,
                    sort_order: 1,
                },
            ],
            rating: 4.9,
            reviews: 1240,
            badge: '#1 in Computers',
        },
        {
            id: 2,
            name: 'Aether Noise-Canceling Headphones',
            description:
                'Pure sound with 30+ hours battery and industry-leading noise cancellation.',
            price: 349.0,
            primaryCategoryId: 11,
            images: [
                {
                    path: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=600&h=600',
                    is_primary: 1,
                    sort_order: 0,
                },
                {
                    path: 'https://images.unsplash.com/photo-1546435770-a3e426ff472b?auto=format&fit=crop&q=80&w=600&h=600',
                    is_primary: 0,
                    sort_order: 1,
                },
            ],
            rating: 4.8,
            reviews: 850,
            badge: 'Must Have',
        },
        {
            id: 3,
            name: 'Artisan Barista Espresso Machine',
            description:
                'Cafe-quality espresso at home with precision temperature control and steam wand.',
            price: 599.5,
            primaryCategoryId: 13,
            images: [
                {
                    path: 'https://images.unsplash.com/photo-1510551310160-589462daf284?auto=format&fit=crop&q=80&w=600&h=600',
                    is_primary: 1,
                    sort_order: 0,
                },
                {
                    path: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&q=80&w=600&h=600',
                    is_primary: 0,
                    sort_order: 1,
                },
            ],
            rating: 4.7,
            reviews: 430,
            badge: 'Top Gift',
        },
        {
            id: 4,
            name: 'Nova Core Smart Watch S7',
            description:
                'Advanced health sensors, GPS, and a stunning Sapphire glass display.',
            price: 299.0,
            primaryCategoryId: 12,
            images: [
                {
                    path: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=600&h=600',
                    is_primary: 1,
                    sort_order: 0,
                },
            ],
            rating: 4.6,
            reviews: 2100,
            badge: 'New Arrival',
        },
        {
            id: 5,
            name: 'QuestMaster VR Pro 3',
            description:
                'Wireless VR with high-resolution lenses and spatial audio for immersive gaming.',
            price: 499.0,
            primaryCategoryId: 9,
            images: [
                {
                    path: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&q=80&w=600&h=600',
                    is_primary: 1,
                    sort_order: 0,
                },
            ],
            rating: 4.9,
            reviews: 670,
            badge: 'Best in Gaming',
        },
        {
            id: 6,
            name: 'Mechanical Force RGB Keyboard',
            description:
                'Custom tactile switches and per-key RGB lighting built for gamers.',
            price: 129.99,
            primaryCategoryId: 8,
            images: [
                {
                    path: 'https://images.unsplash.com/photo-1511467687858-23d96c32e4ae?auto=format&fit=crop&q=80&w=600&h=600',
                    is_primary: 1,
                    sort_order: 0,
                },
            ],
            rating: 4.5,
            reviews: 1200,
            badge: null,
        },
        {
            id: 7,
            name: 'Leather Knight Signature Jacket',
            description:
                'Handcrafted full-grain leather jacket with a timeless silhouette.',
            price: 450.0,
            primaryCategoryId: 15,
            images: [
                {
                    path: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&q=80&w=600&h=600',
                    is_primary: 1,
                    sort_order: 0,
                },
            ],
            rating: 4.9,
            reviews: 150,
            badge: 'Luxury Select',
        },
        {
            id: 8,
            name: 'Velvet Dream Sofa Cushion Set',
            description:
                'Soft velvet cushions in jewel tones. Perfect pop of color for boutique living.',
            price: 75.0,
            primaryCategoryId: 14,
            images: [
                {
                    path: 'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?auto=format&fit=crop&q=80&w=600&h=600',
                    is_primary: 1,
                    sort_order: 0,
                },
            ],
            rating: 4.4,
            reviews: 80,
            badge: null,
        },
    ];

    // Add more fillers to reach 35 products
    for (let i = 9; i <= 35; i++) {
        const cat = leafCategoryIds[i % leafCategoryIds.length];
        uniqueProducts.push({
            id: i,
            name: `Premium Item #${i}`,
            description:
                `A high-quality boutique item from our curated collection. Item ${i} represents peak craftsmanship and design.`,
            price: parseFloat((20 + Math.random() * 200).toFixed(2)),
            primaryCategoryId: cat,
            images: [
                { path: `https://picsum.photos/seed/prod${i}/600/600`, is_primary: 1, sort_order: 0 },
                ...(i % 3 === 0
                    ? [{ path: `https://picsum.photos/seed/prod${i}-b/600/600`, is_primary: 0, sort_order: 1 }]
                    : []),
            ],
            rating: parseFloat((4 + Math.random()).toFixed(1)),
            reviews: Math.floor(Math.random() * 500),
            badge: i % 7 === 0 ? 'Trending' : null,
        });
    }

    const users = [
        {
            device_id: 'user-01',
            username: 'Alex Sterling',
            email: 'alex@example.com',
            phone_number: '123-456-7890',
            is_confirmed: 1,
            avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
            location: 'London, UK',
        },
        {
            device_id: 'user-02',
            username: 'Sophia Valentine',
            email: 'sophia@example.com',
            phone_number: '234-567-8901',
            is_confirmed: 1,
            avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka',
            location: 'Paris, FR',
        },
        {
            device_id: 'user-03',
            username: 'Marco Rossi',
            email: 'marco@example.com',
            phone_number: '345-678-9012',
            is_confirmed: 1,
            avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aiden',
            location: 'Milan, IT',
        },
        {
            device_id: 'user-04',
            username: 'Elena Gilbert',
            email: 'elena@example.com',
            phone_number: '456-789-0123',
            is_confirmed: 1,
            avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Zoe',
            location: 'New York, USA',
        },
    ];

    const reviews = [
        {
            product_id: 1,
            device_id: 'user-01',
            rating: 5,
            comment:
                'Absolutely breathtaking performance. Worth every penny.',
            likes_count: 125,
        },
        {
            product_id: 2,
            device_id: 'user-02',
            rating: 5,
            comment:
                'Noise canceling is on another level. Super premium build.',
            likes_count: 98,
        },
        {
            product_id: 3,
            device_id: 'user-03',
            rating: 5,
            comment:
                'Cafe-quality at home. Easy to clean and looks stunning.',
            likes_count: 110,
        },
        {
            product_id: 4,
            device_id: 'user-04',
            rating: 4,
            comment:
                'Great watch, battery lasts for days even with GPS.',
            likes_count: 45,
        },
    ];

    const heroProducts = [
        { product_id: 1, detail_text: 'M3 Max Chip | 128GB Unified Memory', display_order: 1, is_active: 1 },
        { product_id: 2, detail_text: '40mm Drivers | 60h Battery Life', display_order: 2, is_active: 1 },
        { product_id: 3, detail_text: 'Barista-grade Pressure | Steam Wand', display_order: 3, is_active: 1 },
    ];

    const promotions = [
        {
            id: 1,
            title: 'New Year Mega Sale 🎉',
            subtitle: 'Up to 20% off selected items',
            description: 'Fresh year, fresh gear. Limited time discounts on top picks.',
            image_path:
                'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&q=80&w=1200&h=500',
            promo_type: 'percent',
            discount_value: 20,
            coupon_code: 'NY2026',
            start_at: null,
            end_at: null,
            priority: 10,
            is_active: 1,
        },
        {
            id: 2,
            title: 'Electronics Flash Deal ⚡',
            subtitle: 'Headphones + Watches specials',
            description: 'Blink and it’s gone. Best deals for your daily tech.',
            image_path:
                'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=1200&h=500',
            promo_type: 'percent',
            discount_value: 15,
            coupon_code: null,
            start_at: null,
            end_at: null,
            priority: 5,
            is_active: 1,
        },
    ];

    const promoCategoryLinks = [
        { promotion_id: 2, category_id: 4 }, // Electronics (parent)
        { promotion_id: 2, category_id: 11 }, // Headphones (sub)
        { promotion_id: 2, category_id: 12 }, // Watches (sub)
    ];

    const promoProductLinks = [
        { promotion_id: 1, product_id: 1 },
        { promotion_id: 1, product_id: 2 },
        { promotion_id: 2, product_id: 2 },
        { promotion_id: 2, product_id: 4 },
    ];

    db.serialize(() => {
        // categories
        const categoryStmt = db.prepare(`INSERT INTO categories (id, name, icon, parent_id) VALUES (?, ?, ?, ?)`);
        categories.forEach((c) => categoryStmt.run(c.id, c.name, c.icon, c.parent_id));
        categoryStmt.finalize();

        // products, category links, images
        const productStmt = db.prepare(
            `INSERT INTO products (id, name, description, price, average_rating, review_count, badge) VALUES (?, ?, ?, ?, ?, ?, ?)`
        );
        const pcStmt = db.prepare(
            `INSERT INTO product_categories (product_id, category_id, is_primary) VALUES (?, ?, ?)`
        );
        const imageStmt = db.prepare(
            `INSERT INTO product_images (product_id, image_path, is_primary, sort_order) VALUES (?, ?, ?, ?)`
        );

        uniqueProducts.forEach((p) => {
            productStmt.run(p.id, p.name, p.description, p.price, p.rating, p.reviews, p.badge);

            // primary category
            pcStmt.run(p.id, p.primaryCategoryId, 1);

            // image rows
            p.images.forEach((img) => {
                imageStmt.run(p.id, img.path, img.is_primary ? 1 : 0, img.sort_order ?? 0);
            });
        });

        productStmt.finalize();
        pcStmt.finalize();
        imageStmt.finalize();

        // users
        const userStmt = db.prepare(
            `INSERT INTO users (device_id, username, email, phone_number, is_confirmed, avatar_url, location) VALUES (?, ?, ?, ?, ?, ?, ?)`
        );
        users.forEach((u) =>
            userStmt.run(u.device_id, u.username, u.email, u.phone_number, u.is_confirmed, u.avatar_url, u.location)
        );
        userStmt.finalize();

        // reviews
        const reviewStmt = db.prepare(`INSERT INTO reviews (product_id, device_id, rating, comment, likes_count) VALUES (?, ?, ?, ?, ?)`);
        reviews.forEach((r) => reviewStmt.run(r.product_id, r.device_id, r.rating, r.comment, r.likes_count));
        reviewStmt.finalize();

        // hero products
        const heroStmt = db.prepare(`INSERT INTO hero_products (product_id, detail_text, display_order, is_active) VALUES (?, ?, ?, ?)`);
        heroProducts.forEach((hp) => heroStmt.run(hp.product_id, hp.detail_text, hp.display_order, hp.is_active));
        heroStmt.finalize();

        // promotions
        const promoStmt = db.prepare(
            `INSERT INTO promotions (id, title, subtitle, description, image_path, promo_type, discount_value, coupon_code, start_at, end_at, priority, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        );
        promotions.forEach((pr) =>
            promoStmt.run(
                pr.id,
                pr.title,
                pr.subtitle,
                pr.description,
                pr.image_path,
                pr.promo_type,
                pr.discount_value,
                pr.coupon_code,
                pr.start_at,
                pr.end_at,
                pr.priority,
                pr.is_active
            )
        );
        promoStmt.finalize();

        const promoCatStmt = db.prepare(`INSERT INTO promotion_categories (promotion_id, category_id) VALUES (?, ?)`);
        promoCategoryLinks.forEach((x) => promoCatStmt.run(x.promotion_id, x.category_id));
        promoCatStmt.finalize();

        const promoProdStmt = db.prepare(`INSERT INTO promotion_products (promotion_id, product_id) VALUES (?, ?)`);
        promoProductLinks.forEach((x) => promoProdStmt.run(x.promotion_id, x.product_id));
        promoProdStmt.finalize(() => {
            console.log('✅ Database seeded with categories (incl subcategories), products (multi-images), reviews, hero products, and promotions!');
            process.exit(0);
        });
    });
};

seed().catch((err) => {
    console.error(err);
    process.exit(1);
});
