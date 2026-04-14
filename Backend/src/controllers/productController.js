const db = require('../../db');

const getProducts = async (req, res, next) => {
    try {
        const { rows } = await db.query('SELECT * FROM "Product" ORDER BY id ASC');
        res.json(rows);
    } catch (error) {
        next(error);
    }
};

module.exports = { getProducts };
