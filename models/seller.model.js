const mongoose = require("mongoose");

const SellerSchema = new mongoose.Schema({
    storeName: { 
        type: String, 
        required : true,
    },
    ownerName: { 
        type: String, 
        required: true 
    },
    email: { 
        type: String, 
        required: true,
    },
    password: { 
        type: String, 
        required: true,
    },
    address: { 
        type: String, 
    },
    contactNumber: { 
        type: String,  
    },
    operatingHours: { 
        type: String, 
    },
    products: [
        { 
            type: mongoose.Schema.Types.ObjectId, 
            ref: "Product" 
        }
    ],
    transactionHistory: [
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

module.exports = mongoose.model("Seller", SellerSchema);
