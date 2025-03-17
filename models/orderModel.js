import { hash } from 'bcrypt';
import mongoose, { Types } from 'mongoose';
import validator from 'validator';

const OrderSchema = new mongoose.Schema({
    customer: { 
        type: Types.ObjectId, 
        ref: "Student", 
        required: true 
    },
    seller: { 
        type: Types.ObjectId, 
        ref: "Seller", 
        required: true 
    },
    products: [
        {
            product: { type: Types.ObjectId, ref: "Product" },
            quantity: { type: Number, required: true }
        }
    ],
    totalAmount: { 
        type: Number, 
        required: true 
    },
    status: { 
        type: String, 
        enum: ["Shipped", "Delivered", "Cancelled"], 
        default: "Pending" 
    },
    paymentMethod: { 
        type: String, 
        enum: ["UPI", "Card", "Cash"], 
        required: true 
    },
    createdAt: { 
        type: Date, 
        default: Date.now 
    }
});

const Order = mongoose.model('Order', OrderSchema);
export default Order;