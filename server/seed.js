const { db, initDb } = require('./db');

const seed = async () => {
    await initDb();

    db.run('PRAGMA foreign_keys = OFF');

    // Standard Sizes
    const sizes = [
        { name: 'XS', type: 'apparel' }, { name: 'S', type: 'apparel' }, { name: 'M', type: 'apparel' },
        { name: 'L', type: 'apparel' }, { name: 'XL', type: 'apparel' }, { name: 'XXL', type: 'apparel' },
        { name: '6', type: 'shoes' }, { name: '7', type: 'shoes' }, { name: '8', type: 'shoes' },
        { name: '9', type: 'shoes' }, { name: '10', type: 'shoes' }, { name: '11', type: 'shoes' }, { name: '12', type: 'shoes' },
        { name: 'Small', type: 'bags' }, { name: 'Medium', type: 'bags' }, { name: 'Large', type: 'bags' }, { name: 'One Size', type: 'bags' }
    ];

    // Standard Colors
    const colors = [
        { name: 'Midnight Black', hex: '#121212' },
        { name: 'Arctic White', hex: '#F0F8FF' },
        { name: 'Ruby Red', hex: '#E0115F' },
        { name: 'Ocean Blue', hex: '#0077BE' },
        { name: 'Forest Green', hex: '#228B22' },
        { name: 'Desert Sand', hex: '#EDC9AF' },
        { name: 'Royal Gold', hex: '#D4AF37' },
        { name: 'Silver Mist', hex: '#C0C0C0' },
        { name: 'Lavender', hex: '#E6E6FA' },
        { name: 'Rose Quartz', hex: '#F7CAC9' }
    ];

    const parentCategories = [
        { id: 1, name: 'Apparel', icon: 'Shirt', description: 'Premium clothing for every occasion.', banner_image: 'https://images.unsplash.com/photo-1445205170230-053b830c6039?auto=format&fit=crop&q=80&w=1200&h=400', parent_id: null },
        { id: 2, name: 'Accessories', icon: 'Gem', description: 'The perfect finishing touches.', banner_image: 'https://images.unsplash.com/photo-1512163143273-bde0e3cc7407?auto=format&fit=crop&q=80&w=1200&h=400', parent_id: null },
        { id: 3, name: 'Footwear', icon: 'Footprints', description: 'Step out in style and comfort.', banner_image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=1200&h=400', parent_id: null },
        { id: 4, name: 'Bags', icon: 'ShoppingBag', description: 'Elegance you can carry.', banner_image: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&q=80&w=1200&h=400', parent_id: null },
    ];

    const subCategories = [
        { id: 5, name: 'Jackets & Coats', icon: null, description: 'Outerwear for all seasons.', banner_image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&q=80&w=1200&h=400', parent_id: 1, type: 'apparel' },
        { id: 6, name: 'Dresses', icon: null, description: 'Elegant and casual dresses.', banner_image: 'https://images.unsplash.com/photo-1485230895905-ec40ba36b9bc?auto=format&fit=crop&q=80&w=1200&h=400', parent_id: 1, type: 'apparel' },
        { id: 7, name: 'Jewelry', icon: null, description: 'Timeless pieces for you.', banner_image: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&q=80&w=1200&h=400', parent_id: 2, type: 'bags' }, // Jewelry uses bag-like sizes (One Size)
        { id: 8, name: 'Watches', icon: null, description: 'Precision and luxury.', banner_image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=1200&h=400', parent_id: 2, type: 'bags' },
        { id: 9, name: 'Sneakers', icon: null, description: 'Streetwear essentials.', banner_image: 'https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&q=80&w=1200&h=400', parent_id: 3, type: 'shoes' },
        { id: 10, name: 'Handbags', icon: null, description: 'Signature handbags.', banner_image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&q=80&w=1200&h=400', parent_id: 4, type: 'bags' },
    ];

    const collections = [
        { id: 1, name: 'Winter 2026', description: 'Embrace the cold with our latest seasonal arrivals.', banner_image: 'https://images.unsplash.com/photo-1478479405421-ce83c92fb3ba?auto=format&fit=crop&q=80&w=1200&h=500' },
        { id: 2, name: 'Spring 2026', description: 'Fresh looks for a fresh new start.', banner_image: 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&q=80&w=1200&h=500' },
        { id: 3, name: 'Modern Essentials', description: 'The foundation of a timeless wardrobe.', banner_image: 'https://images.unsplash.com/photo-1516762689617-e1cffcef479d?auto=format&fit=crop&q=80&w=1200&h=500' },
        { id: 4, name: 'Noir Archive', description: 'A monochromatic exploration of form and silhouette.', banner_image: 'https://images.unsplash.com/photo-1550614000-4895a10e1bfd?auto=format&fit=crop&q=80&w=1200&h=500' },
    ];

    const productNames = {
        5: ['Quilted', 'Over-sized', 'Tailored', 'Minimalist', 'Luxe'], // Jackets
        6: ['Evening', 'Midi', 'Cocktail', 'Summer', 'Wrap'], // Dresses
        7: ['Crystalline', 'Amethyst', 'Obsidian', 'Diamond', 'Opal'], // Jewelry
        8: ['Aviator', 'Diver', 'Chronograph', 'Quartz', 'Lunar'], // Watches
        9: ['Tech', 'Retro', 'Prime', 'Elevate', 'Aero'], // Sneakers
        10: ['Tote', 'Clutch', 'Backpack', 'Satchel', 'Hobo'] // Handbags
    };

    const prefixes = ['Urban', 'Heritage', 'Alpine', 'Zenith', 'Velvet', 'Midnight', 'Ethereal', 'Nomad', 'Apex', 'Vanguard'];

    db.serialize(() => {
        // 1. Standard Sizes & Colors
        const sizeStmt = db.prepare(`INSERT INTO sizes (name, category_type) VALUES (?, ?)`);
        sizes.forEach(s => sizeStmt.run(s.name, s.type));
        sizeStmt.finalize();

        const colorStmt = db.prepare(`INSERT INTO colors (name, hex_code) VALUES (?, ?)`);
        colors.forEach(c => colorStmt.run(c.name, c.hex));
        colorStmt.finalize();

        // 2. Categories, Collections, & Promotions (Parents)
        const catStmt = db.prepare(`INSERT INTO categories (id, name, icon, description, banner_image, parent_id) VALUES (?, ?, ?, ?, ?, ?)`);
        [...parentCategories, ...subCategories].forEach(c => catStmt.run(c.id, c.name, c.icon, c.description, c.banner_image, c.parent_id));
        catStmt.finalize();

        const collStmt = db.prepare(`INSERT INTO collections (id, name, description, banner_image) VALUES (?, ?, ?, ?)`);
        collections.forEach(c => collStmt.run(c.id, c.name, c.description, c.banner_image));
        collStmt.finalize();

        db.run(`INSERT INTO promotions (id, title, subtitle, description, promo_type, discount_value, coupon_code, is_active) VALUES (1, 'SEASONAL SALE', 'Up to 50% Off', 'Celebrate the season with incredible savings on our top picks.', 'percent', 50, 'SEASON50', 1)`);
        db.run(`INSERT INTO promotions (id, title, subtitle, description, promo_type, discount_value, coupon_code, is_active) VALUES (2, 'EXCLUSIVE DROP', 'Members Only Deal', 'Get early access and 15% off the new collection.', 'percent', 15, 'MEMBER15', 1)`);

        // 3. Users (Level 0 Parent for social features)
        const userStmt = db.prepare(`INSERT INTO users (device_id, username, email, phone_number, is_confirmed, avatar_url) VALUES (?, ?, ?, ?, 1, ?)`);
        for (let i = 1; i <= 50; i++) {
            const username = `User_${i}`;
            userStmt.run(`user-${i}`, username, `user${i}@example.com`, `+1-555-${1000 + i}`, `https://api.dicebear.com/7.x/avataaars/svg?seed=user${i}`);
        }
        userStmt.finalize();

        // 4. Mass Products (200+)
        const prodStmt = db.prepare(`INSERT INTO products (id, collection_id, name, description, price, badge) VALUES (?, ?, ?, ?, ?, ?)`);
        const pcStmt = db.prepare(`INSERT INTO product_categories (product_id, category_id, is_primary) VALUES (?, ?, ?)`);
        const imgStmt = db.prepare(`INSERT INTO product_images (product_id, image_path, is_primary) VALUES (?, ?, ?)`);
        const varStmt = db.prepare(`INSERT INTO product_variants (product_id, size_id, color_id, stock_quantity) VALUES (?, ?, ?, ?)`);

        // Helper to fetch IDs after inserts
        db.all(`SELECT id, category_type FROM sizes`, [], (err, allSizes) => {
            db.all(`SELECT id FROM colors`, [], (err, allColors) => {

                for (let i = 1; i <= 210; i++) {
                    const subCat = subCategories[i % subCategories.length];
                    const collection = collections[i % collections.length];
                    const prefix = prefixes[i % prefixes.length];
                    const baseName = productNames[subCat.id][i % productNames[subCat.id].length];
                    const name = `${prefix} ${baseName} ${subCat.name.replace(' & ', ' ').replace('s', '')}`;
                    const price = parseFloat((30 + Math.random() * 970).toFixed(2));
                    const badge = i % 15 === 0 ? 'Trending' : (i % 25 === 0 ? 'Limited' : null);

                    prodStmt.run(i, collection.id, name, `Premium quality ${name} designed for the modern fashion enthusiast.`, price, badge);
                    pcStmt.run(i, subCat.id, 1);
                    imgStmt.run(i, `https://picsum.photos/seed/fashion${i}/800/800`, 1);

                    // Variants (Normalize Sizes/Colors)
                    const relevantSizes = allSizes.filter(s => s.category_type === subCat.type);
                    const pickedColors = allColors.sort(() => 0.5 - Math.random()).slice(0, 2);
                    const pickedSizes = relevantSizes.sort(() => 0.5 - Math.random()).slice(0, 3);

                    pickedColors.forEach(c => {
                        pickedSizes.forEach(s => {
                            varStmt.run(i, s.id, c.id, Math.floor(Math.random() * 50));
                        });
                    });
                }

                prodStmt.finalize();
                pcStmt.finalize();
                imgStmt.finalize();
                varStmt.finalize();

                // 5. Mass Reviews (1000+) & Social Proof
                const reviewStmt = db.prepare(`INSERT INTO reviews (product_id, collection_id, promotion_id, device_id, rating, comment, likes_count) VALUES (?, ?, ?, ?, ?, ?, ?)`);
                const comments = ["Absolutely stunning!", "Best purchase ever.", "Quality is top-notch.", "Highly recommend.", "Perfect fit.", "A bit pricey but worth it.", "Love the color!", "Shipping was fast.", "Good customer service.", "Will buy again."];

                for (let i = 1; i <= 1000; i++) {
                    const rating = Math.floor(Math.random() * 2) + 4; // 4-5 stars
                    const comment = comments[i % comments.length];
                    const userId = `user-${Math.floor(Math.random() * 50) + 1}`;
                    const likes = Math.floor(Math.random() * 100);

                    if (i <= 800) { // Product reviews
                        reviewStmt.run(Math.floor(Math.random() * 210) + 1, null, null, userId, rating, comment, likes);
                    } else if (i <= 950) { // Collection reviews
                        reviewStmt.run(null, (i % 4) + 1, null, userId, rating, `I love this collection! ${comment}`, likes);
                    } else { // Promotion reviews
                        reviewStmt.run(null, null, (i % 2) + 1, userId, rating, `Great offer! ${comment}`, likes);
                    }
                }
                reviewStmt.finalize();

                // 6. Bulk Likes (5000+)
                const pLikeStmt = db.prepare(`INSERT OR IGNORE INTO product_likes (user_id, product_id) VALUES (?, ?)`);
                const cLikeStmt = db.prepare(`INSERT OR IGNORE INTO collection_likes (user_id, collection_id) VALUES (?, ?)`);

                for (let i = 1; i <= 5000; i++) {
                    const userId = `user-${Math.floor(Math.random() * 50) + 1}`;
                    if (i % 10 !== 0) {
                        pLikeStmt.run(userId, Math.floor(Math.random() * 210) + 1);
                    } else {
                        cLikeStmt.run(userId, Math.floor(Math.random() * 4) + 1);
                    }
                }

                pLikeStmt.finalize();
                cLikeStmt.finalize(() => {
                    // 7. Hero
                    db.run(`INSERT INTO hero_products (product_id, detail_text, display_order) VALUES (10, 'Signature Evening Elegance', 1)`);
                    db.run(`INSERT INTO hero_products (product_id, detail_text, display_order) VALUES (25, 'Modern Streetwear Precision', 2)`);
                    db.run(`INSERT INTO hero_products (product_id, detail_text, display_order) VALUES (40, 'Timeless Luxury Accessories', 3)`);

                    // Update average ratings/counts
                    db.serialize(() => {
                        db.run(`UPDATE products SET 
                            average_rating = (SELECT IFNULL(AVG(rating), 0) FROM reviews WHERE product_id = products.id),
                            review_count = (SELECT COUNT(*) FROM reviews WHERE product_id = products.id)`);

                        db.run(`UPDATE collections SET 
                            average_rating = (SELECT IFNULL(AVG(rating), 0) FROM reviews WHERE collection_id = collections.id),
                            review_count = (SELECT COUNT(*) FROM reviews WHERE collection_id = collections.id)`);

                        db.run(`UPDATE promotions SET 
                            average_rating = (SELECT IFNULL(AVG(rating), 0) FROM reviews WHERE promotion_id = promotions.id),
                            review_count = (SELECT COUNT(*) FROM reviews WHERE promotion_id = promotions.id)`, () => {
                            console.log('✅ Mass seeding complete: 210 products, 1000 reviews, 5000 likes.');
                            db.run('PRAGMA foreign_keys = ON', () => {
                                process.exit(0);
                            });
                        });
                    });
                });
            });
        });
    });
};

seed().catch(err => {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
});
