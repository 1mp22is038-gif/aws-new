const db = require('../../db');
const { SNSClient, PublishCommand } = require("@aws-sdk/client-sns");

const sns = new SNSClient({ region: "ap-south-1" });

const createOrder = async (req, res, next) => {
    const client = await db.pool.connect();
    try {
        const { items } = req.body; 
        const userId = req.user.id; 

        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ error: 'Cart is empty or invalid' });
        }

        let total = 0;
        const validItems = [];

        // 1. Validate all products first and calculate subtotals
        for (const item of items) {
            const productId = parseInt(item.productId, 10);
            const quantity = parseInt(item.quantity, 10);

            if (!productId || !quantity || quantity <= 0) continue;

            const { rows } = await client.query('SELECT * FROM "Product" WHERE id = $1', [productId]);
            const product = rows[0];
            
            if (!product) {
                return res.status(404).json({ error: `Product with ID ${productId} not found` });
            }

            const subtotal = product.price * quantity;
            total += subtotal;

            validItems.push({
                productId,
                quantity,
                price: product.price,
                subtotal
            });

            // Debug logs requested by user
            console.log("--- Validate Item ---");
            console.log("Product:", product.name);
            console.log("Price:", product.price);
            console.log("Quantity:", quantity);
            console.log("Subtotal:", subtotal);
        }

        if (validItems.length === 0) {
            return res.status(400).json({ error: 'No valid items to place an order' });
        }

        // 2. Create Order and nested OrderItems in ONE atomic operation using pg transaction
        await client.query('BEGIN');
        const orderResult = await client.query(
            'INSERT INTO "Order" ("userId", total) VALUES ($1, $2) RETURNING id',
            [userId, total]
        );
        const orderId = orderResult.rows[0].id;

        for (const vItem of validItems) {
            await client.query(
                'INSERT INTO "OrderItem" ("orderId", "productId", quantity, price, subtotal) VALUES ($1, $2, $3, $4, $5)',
                [orderId, vItem.productId, vItem.quantity, vItem.price, vItem.subtotal]
            );
        }
        await client.query('COMMIT');

        // 3. Trigger SNS for automated email notification
        try {
            await sns.send(new PublishCommand({
                TopicArn: "arn:aws:sns:ap-south-1:505947591242:order-events",
                Message: JSON.stringify({
                    email: req.user.email,
                    orderId: orderId
                })
            }));
            console.log(`[SNS] Notification sent for Order ID: ${orderId}`);
        } catch (snsError) {
            console.error(`[SNS] Failed to send notification: ${snsError.message}`);
        }

        console.log(`[ORDER] Placed successfully! Order ID: ${orderId}, Total: ₹${total}`);
        res.status(201).json({ message: 'Order created', data: { id: orderId, total } });
    } catch (error) {
        await client.query('ROLLBACK');
        next(error);
    } finally {
        client.release();
    }
};

const getOrders = async (req, res, next) => {
    try {
        const userId = req.user.id;

        const query = `
            SELECT 
                o.id as "orderId",
                o."createdAt",
                u.name as "userName",
                p.name as "productName",
                oi.price,
                oi.quantity,
                oi.subtotal as total
            FROM "Order" o
            JOIN "User" u ON o."userId" = u.id
            JOIN "OrderItem" oi ON oi."orderId" = o.id
            JOIN "Product" p ON oi."productId" = p.id
            WHERE o."userId" = $1
            ORDER BY o."createdAt" DESC
        `;
        
        const { rows } = await db.query(query);

        res.status(200).json(rows);
    } catch (error) {
        next(error);
    }
};

module.exports = { createOrder, getOrders };
