const express = require('express');
const router = express.Router();
const { getDebugOrders, getDebugProducts, getDebugUsers } = require('../controllers/debugController');

router.get('/orders', getDebugOrders);
router.get('/products', getDebugProducts);
router.get('/users', getDebugUsers);

module.exports = router;
