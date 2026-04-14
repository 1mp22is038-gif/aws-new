const db = require('../db');

const initializeDatabase = async () => {
    console.log("Initializing database tables...");

    try {
        await db.query(`
            CREATE TABLE IF NOT EXISTS "User" (
                "id" SERIAL PRIMARY KEY,
                "name" VARCHAR(255) NOT NULL,
                "phone" VARCHAR(255) NOT NULL,
                "email" VARCHAR(255) UNIQUE NOT NULL,
                "password" VARCHAR(255) NOT NULL,
                "isVerified" BOOLEAN DEFAULT false,
                "otp" VARCHAR(255),
                "otpExpiresAt" TIMESTAMP,
                "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        await db.query(`
            CREATE TABLE IF NOT EXISTS "Product" (
                "id" SERIAL PRIMARY KEY,
                "name" VARCHAR(255) NOT NULL,
                "price" FLOAT NOT NULL,
                "imageUrl" VARCHAR(255)
            );
        `);

        await db.query(`
            CREATE TABLE IF NOT EXISTS "Order" (
                "id" SERIAL PRIMARY KEY,
                "userId" INT REFERENCES "User"("id"),
                "total" FLOAT DEFAULT 0.0,
                "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        await db.query(`
            CREATE TABLE IF NOT EXISTS "OrderItem" (
                "id" SERIAL PRIMARY KEY,
                "orderId" INT REFERENCES "Order"("id"),
                "productId" INT REFERENCES "Product"("id"),
                "quantity" INT NOT NULL,
                "price" FLOAT NOT NULL,
                "subtotal" FLOAT NOT NULL
            );
        `);

        console.log("Database tables initialized successfully.");
    } catch (error) {
        console.error("Error initializing database tables:", error);
        throw error;
    }
};

module.exports = initializeDatabase;
