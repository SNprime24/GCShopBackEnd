import express from 'express';
import {
    getAllOrders, 
    getOrderBySeller, 
    getOrderByCustomer, 
    createOrder 
} from '../controllers/orderController.js';

const router = express.Router();

router.get('/allOrders', getAllOrders);
router.get('/sellerOrder/:seller', getOrderBySeller);
router.get('/customerOrder/:customer', getOrderByCustomer);
router.post('/createOrder', createOrder);

export default router;
