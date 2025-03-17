import Customer from '../models/customerModel.js';
import Seller from '../models/sellerModel.js';
import Order from '../models/orderModel.js';
import { tryCatch } from '../middlewares/error.js';
import { ErrorHandler } from '../utils/utility.js';

const getAllOrders = tryCatch(async(req, res) => {
    const allOrders = await Order.find();
    return res.status(200).json({ success: true, orders: allOrders });
});

const getOrderBySeller = tryCatch(async (req, res, next) => {
    const { seller } = req.params;
    const orders = await Order.find({ seller }).populate("products.product");
    if (orders.length === 0) {
        return next(new ErrorHandler("No orders found for this seller", 404));
    }
    return res.status(200).json({ success: true, orders });
});

const getOrderByCustomer = tryCatch(async (req, res, next) => {
    const { customer } = req.params;
    const orders = await Order.find({ customer }).populate("products.product");
    if(orders.length === 0) {
        return next(new ErrorHandler("No orders found for this customer", 404));
    }
    return res.status(200).json({ success: true, orders });
});


const createOrder = tryCatch(async (req, res, next) => {
    const { customer, seller, products, paymentMethod } = req.body;

    // Validate required fields
    if (!customer || !seller || !products || products.length === 0 || !paymentMethod) {
        return next(new ErrorHandler("All fields are required", 400));
    }

    // Validate payment method
    const validPaymentMethods = ["UPI", "Card", "Cash"];
    if (!validPaymentMethods.includes(paymentMethod)) {
        return next(new ErrorHandler("Invalid payment method", 400));
    }

    // Fetch product details to calculate total amount
    let totalAmount = 0;
    for (const item of products) {
        const product = await Product.findById(item.product);
        if (!product) {
            return next(new ErrorHandler(`Product with ID ${item.product} not found`, 404));
        }
        totalAmount += product.price * item.quantity;
    }

    // Create the order
    const order = new Order({
        customer,
        seller,
        products,
        totalAmount,
        paymentMethod
    });

    await order.save();

    return res.status(201).json({
        success: true,
        message: "Order placed successfully",
        order
    });
});



export { getAllOrders , getOrderBySeller, getOrderByCustomer, createOrder }