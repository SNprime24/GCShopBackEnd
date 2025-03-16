import { hash } from 'bcrypt';
import mongoose, { Types } from 'mongoose';
import validator from 'validator';

const CustomerSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: true 
    },
    email: { 
        type: String,
        required: [true, 'Please provide your email'],
        unique: true,
        lowercase: true,
        validate: [validator.isEmail, 'Please provide a valid email'],
    },
    rollNumber: {
        type: String,
        required: [true, "Please provide a roll number"],
        unique: true,
    },
    password: { 
        type: String,
        required: [true, 'Please provide a password'],
        minlength: 8,
        select: false 
    },
    username :{
        type : String,
        unique : true,
        default : function(){
        const namePart = this.name.toLowerCase().split(' ');
        const emailPart = this.email.toLowerCase().split('@')[0];
        return `${namePart.join('_')}_${emailPart}`;
        }
    },
    orderHistory: [
        { 
            type: Types.ObjectId, 
            ref: "Order" 
        }
    ],
    role: {
        type: String,
        enum: ['admin', 'seller', 'customer'],
        default: 'customer'
    },
    createdAt: { 
        type: Date, 
        default: Date.now 
    }
});

// using middleware will help in not saving the confirm password
CustomerSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();  
    this.password = await hash(this.password, 10);
  });

const Customer = mongoose.model('Customer', CustomerSchema);
export default Customer;
