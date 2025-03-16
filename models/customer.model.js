const mongoose = require("mongoose");

const CustomerSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: true 
    },
    email: { 
        type: String, 
        required: true, 
        unique: true 
    },
    password: { 
        type: String, 
        required: true 
    },
    orderHistory: [
        { 
            type: mongoose.Schema.Types.ObjectId, 
            ref: "Order" 
        }
    ],
    createdAt: { 
        type: Date, 
        default: Date.now 
    }
});

module.exports = mongoose.model("Customer", CustomerSchema);
