import Products from '../models/productsModel.js';
import Seller from '../models/sellerModel.js';
import { tryCatch } from '../middlewares/error.js';
import { ErrorHandler } from '../utils/utility.js';

const getAllProducts = tryCatch(async(req, res) => {
    const allProducts = await Products.find();
    return res.status(200).json({ success: true, products: allProducts });
});

const getThisProduct = tryCatch(async(req, res, next) => {
    const name = req.params.name;
    const product = await Products.find({name});
    if(!product) return next(new ErrorHandler("Incorrect Product name", 404));
    return res.status(200).json({ success: true, product: product });
});

const createProduct = tryCatch(async(req, res, next)=>{
    const { name, description, price, stock, category , sellerId} = req.body;
    if(!name || !description || !price || !stock || !category || !sellerId)
        return next(new ErrorHandler("Insufficient input",404));

    // find the seller
    const seller = await Seller.findById(sellerId);
    if(!seller) return next(new ErrorHandler("Wrong seller id", 404));

    const reqData = {
        name, description, price, stock, category 
    };

    // create new product
    const newProduct = await Products.create(reqData);
    seller.products.push(newProduct._id);
    await seller.save();

    return res.status(200).json({ success: true, data: newProduct });
});


export { getAllProducts, getThisProduct, createProduct }