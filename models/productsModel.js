import { hash } from 'bcrypt';
import mongoose, { Types } from 'mongoose';
import validator from 'validator';

const ProductSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: true 
    },
    description: { 
        type: String 
    },
    price: { 
        type: Number, 
        required: true 
    },
    stock: { 
        type: Number, 
        required: true 
    },
    category: { 
        type: String,
        required: true 
    },
    images: [
        { 
            type: String 
        }
    ],
    createdAt: { 
        type: Date, 
        default: Date.now 
    }
});

const Product = mongoose.model('Seller', ProductSchema);
export default Product;
