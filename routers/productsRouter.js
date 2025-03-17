import express from 'express'
import {
    getAllProducts, 
    getThisProduct, 
    createProduct } from '../controllers/productsController.js'

const router = express.Router();
router.get('/allProducts', getAllProducts);
router.get('/thisProduct/:name', getThisProduct);
router.post('/createProduct', createProduct);

export default router;