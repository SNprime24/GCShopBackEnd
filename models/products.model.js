const mongoose = require("mongoose");

const ProductSchema = new mongoose.Schema({
    seller: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "Seller", 
        required: true 
    },
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

module.exports = mongoose.model("Product", ProductSchema);
