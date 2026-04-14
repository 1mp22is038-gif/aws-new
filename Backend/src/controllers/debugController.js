const db = require('../../db');

const getDebugOrders = async (req, res, next) => {
    try {
        const query = `
            SELECT o.id, o."userId", o.total, o."createdAt",
                   u.name as "userName", u.email as "userEmail",
                   oi.id as "itemId", oi."productId", oi.quantity, oi.price, oi.subtotal,
                   p.name as "productName", p."imageUrl"
            FROM "Order" o
            JOIN "User" u ON o."userId" = u.id
            JOIN "OrderItem" oi ON oi."orderId" = o.id
            JOIN "Product" p ON oi."productId" = p.id
        `;
        const { rows } = await db.query(query);
        res.status(200).json(rows);
    } catch (e) {
        next(e);
    }
};

const getDebugProducts = async (req, res, next) => {
    try {
        const { rows } = await db.query('SELECT * FROM "Product"');
        res.status(200).json(rows);
    } catch (e) {
        next(e);
    }
};

const getDebugUsers = async (req, res, next) => {
    try {
        const { rows } = await db.query('SELECT id, name, email, phone, "isVerified", "createdAt" FROM "User"');
        res.status(200).json(rows);
    } catch (e) {
        next(e);
    }
};

module.exports = { getDebugOrders, getDebugProducts, getDebugUsers };
