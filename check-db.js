const sqlite3 = require('sqlite3');
const db = new sqlite3.Database('server/ecommerce.db');

db.get("SELECT count(*) as count FROM products", (err, row) => {
    console.log("Products:", row.count);
    db.get("SELECT count(*) as count FROM reviews", (err, row) => {
        console.log("Reviews:", row.count);
        db.get("SELECT count(*) as count FROM product_likes", (err, row1) => {
            db.get("SELECT count(*) as count FROM collection_likes", (err, row2) => {
                console.log("Likes:", row1.count + row2.count);
                db.get("SELECT count(*) as count FROM users WHERE username IS NOT NULL", (err, row) => {
                    console.log("Registered Users:", row.count);
                    process.exit(0);
                });
            });
        });
    });
});
