import { hash } from 'bcrypt';
import mongoose, { Types } from 'mongoose';
import validator from 'validator';

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
		required: [true, "Please provide your email"],
		unique: true,
		lowercase: true,
		validate: [validator.isEmail, "Please provide a valid email"],
	},
	username: {
		type: String,
		unique: true,
		default: function () {
			const emailPart = this.email.toLowerCase().split("@")[0];
			return emailPart;
		},
	},
    password: {
		type: String,
		required: [true, "Please provide a password"],
		minlength: 8,
		select: false,
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
            type: Types.ObjectId, 
            ref: "Product" 
        }
    ],
    transactionHistory: [
        { 
            type: Types.ObjectId, 
            ref: "Order" 
        }
    ],
    role: {
        type: String,
        enum: ['admin', 'seller', 'customer'],
        default: 'seller'
    },
    createdAt: { 
        type: Date, 
        default: Date.now 
    }
});

SellerSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();  
    this.password = await hash(this.password, 10);
  });

const Seller = mongoose.model('Seller', SellerSchema);
export default Seller;

