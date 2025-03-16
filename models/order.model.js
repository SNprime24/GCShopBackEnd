const mongoose = require("mongoose");

const OrderSchema = new mongoose.Schema({
    customer: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "Student", 
        required: true 
    },
    seller: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "Seller", 
        required: true 
    },
    products: [
        {
            product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
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

module.exports = mongoose.model("Order", OrderSchema);
