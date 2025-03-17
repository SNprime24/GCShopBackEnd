import bcrypt, { hash } from "bcrypt";
import multer from "multer";
import Customer from "../models/customerModel.js";
import Seller from "../models/sellerModel.js";
import dotenv from "dotenv";
import { cookieOption, sendToken } from "../utils/features.js";
import { tryCatch } from "../middlewares/error.js";
import { ErrorHandler, sendEmail } from "../utils/utility.js";

dotenv.config();
const emailTokens = {};
let customerRole;
const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
	if (file.mimetype.startsWith("image")) {
		cb(null, true);
	} else {
		cb(new AppError("Not an image! Please upload only images.", 400), false);
	}
};

const upload = multer({
	storage: multerStorage,
	fileFilter: multerFilter,
});

const uploadCustomerPhoto = upload.single("photo");

const resizeCustomerPhoto = tryCatch(async (req, res, next) => {
	if (!req.file) return next();

	req.file.filename = `Customer-${req.Customer.id}-${Date.now()}.jpeg`;

	await sharp(req.file.buffer)
		.resize(500, 500)
		.toFormat("jpeg")
		.jpeg({ quality: 90 })
		.toFile(`public/img/Customers/${req.file.filename}`);

	next();
});

const sendOTP = async (email, message, next) => {
	const otp = Math.floor(100000 + Math.random() * 900000).toString();
	const expirationTime = new Date(Date.now() + 2 * 60 * 60 * 1000);
	const sharedToken = `${otp}`;
	console.log(otp);
	try {
		await sendEmail(email, message, sharedToken);
		emailTokens[email] = { otp, expirationTime };
	} catch (error) {
		next(new ErrorHandler("Failed to send OTP email", 500));
	}
};

const emailVerification = tryCatch(async (req, res, next) => {
	const { email, resetting } = req.body;
	if (!email) return next(new ErrorHandler("Please fill your email", 404));
	let secretQuestion = "";

	if (resetting) {
		const Customer = await Customer.findOne({ email });
		if (!Customer) return next(new ErrorHandler("Customer do not exists", 404));
		secretQuestion = Customer.secretQuestion;
	}

	let role;

	if (email[0] === "2") role = "customer";
	else role = "seller";

	sendOTP(email, "Email Verification", next);
	res.status(200).json({
		success: true,
		role: role,
		secretQuestion: secretQuestion,
		message: "An OTP has been sent to your email.",
	});
});

const confirmOTP = tryCatch(async (req, res, next) => {
	// const { email, resetting, otp, secretAnswer } = req.body;
	const { email, resetting, otp } = req.body;
	if (!email || !otp) return next(new ErrorHandler("Please fill all fields", 404));

	// if (resetting && !secretAnswer) return next(new ErrorHandler("Please fill secret answer", 404));

	const Customer = await Customer.findOne({ email });
	// if (resetting && secretAnswer !== Customer.secretAnswer)
	// 	return next(new ErrorHandler("Please give coreect answer", 404));

	const sharedOTP = emailTokens[email];

	if (sharedOTP && sharedOTP.otp == otp && Date.now() < sharedOTP.expirationTime) {
		return res.status(200).json({ success: true, message: "OTP has been successfully verified." });
	} else if (sharedOTP && sharedOTP.otp != otp) {
		return res.status(400).json({ success: false, message: "Incorrect OTP entered." });
	} else return res.status(400).json({ success: false, message: "OTP expired." });
});

const verifyAnswer = tryCatch(async (req, res, next) => {
	const { email, resetting} = req.body;
	if (!email) return next(new ErrorHandler("Please fill all fields", 404));

	const Customer = await Customer.findOne({ email });
	return res.status(200).json({ success: true, message: "Answer verified successfully." });
});

async function createCustomer(name, email, password) {
	const index = email.indexOf("@");
	const rollNumber = email.slice(0, index);
	const rollNumberCheck = rollNumber.slice(5) * 1;

	const customer = await Customer.create({
		name,
		email,
		password,
		rollNumber
	});
	return customer;
};

const newCustomer = tryCatch(async (req, res, next) => {
    const { name, email, password, storeName, ownerName, address, contactNumber, operatingHours } = req.body;

    if (!name || !email || !password) {
        return next(new ErrorHandler("Please fill all fields", 400));
    }

    try {
        let customer;  // Declare Customer before using it

        if (email[0] === "2") {
            // If email starts with '2', create a regular customer
            customer = await createCustomer(name, email, password);
        } else {
            // Ensure seller fields are provided
            if (!storeName || !ownerName || !address || !contactNumber || !operatingHours) {
                return next(new ErrorHandler("Missing seller information", 400));
            }

            // Create a seller
            customer = await Seller.create({
                storeName,
                ownerName,
                email,
                password,
                address,
                contactNumber,
                operatingHours
            });
        }

        console.log("Customer Created:", customer);
        sendToken(res, customer, 200, `Welcome to GCSHOP`);
    } 
    catch (error) {
        console.error("Error creating Customer:", error);
        return next(new ErrorHandler("An error occurred while creating the Customer", 500));
    }
});

// const newCustomer = tryCatch(async (req, res, next) => {
// 	const { name, email, password } = req.body;
// 	console.log("Hello");

// 	if (!name || !email || !password ) {
// 		return next(new ErrorHandler("Please fill all fields", 404));
// 	}

// 	try {
// 		let Customer;
// 		if (email[0] === "2") {
// 			Customer = await createCustomer(name, email, password);
// 		} 
// 		else {
// 			const seller = await Seller.create({
// 				storeName,
// 				ownerName,
// 				email,
// 				password,
// 				address,
// 				contactNumber,
// 				operatingHours
// 			});
// 			Customer = seller;
// 			console.log(Customer);
// 		}
// 		sendToken(res, Customer, 200, `Welcome to GCSHOP`);
// 	} 
// 	catch (error) {
// 		console.error("Error creating Customer:", error);
// 		return next(new ErrorHandler("An error occurred while creating the Customer", 500));
// 	}
// });

const login = tryCatch(async (req, res, next) => {
	const { email, password, toRemember } = req.body;
	if (!email || !password) {
		return next(new ErrorHandler("Please fill all the fields", 404));
	}

	let customer;
	if (email[0] === "2") customer = await Customer.findOne({ email }).select("+password");
	else customer = await Teacher.findOne({ email }).select("+password");

	if (!customer) return next(new ErrorHandler("Invalid credentials", 404));
	const isMatch = await bcrypt.compare(password, customer.password);
	if (!isMatch) return next(new ErrorHandler("Invalid credentials", 401));

	customerRole = customer.role;
	if(toRemember) sendToken(res, customer, 200, `Welcome back, ${customer.name}`);
	return res.status(200).json({ success: true, message: `Welcome back, ${customer.name}`, customer: customer });
});

const forgetPassword = tryCatch(async (req, res, next) => {
	const { email } = req.body;
	if (!email) return next(new ErrorHandler("Please fill all the fields", 404));

	const customer = await Customer.findOne({ email }).select("+password");
	if (!customer) return next(new ErrorHandler("Customer do not exists", 404));

	sendOTP(email, "Forget Password", next);
	return res.status(200).json({ success: true });
});

const setNewPassword = tryCatch(async (req, res, next) => {
	const { email, password } = req.body;
	if (!email || !password) return next(new ErrorHandler("Please fill all the fields", 404));

	const customer = await Customer.findOne({ email });
	if (!customer) return next(new ErrorHandler("Customer do not exists", 404));
	customer.password = password;
	await customer.save();
	return res.status(200).json({ success: true, customer: customer, message: "Password has been updated." });
});

const getMyProfile = tryCatch(async (req, res) => {
	let customer;
	if (customerRole === "customer") customer = await Customer.findById(req.Customer);
	else customer = await Seller.findById(req.customer);
	return res.status(200).json({
		success: true,
		customer,
	});
});

const getOtherProfile = tryCatch(async (req, res, next) => {
	const { customerName, role } = req.query; // Access query parameters

	// Check if CustomerName or role is missing
	if (!customerName || !role) {
		return next(new ErrorHandler("Incomplete query: CustomerName and role are required.", 400));
	}

	console.log(`Fetching profile for CustomerName: ${customerName}, role: ${role}`);

	// Fetch Customer based on role
	let customer;
	if (role === "customer") {
		customer = await Customer.findOne({ customerName });
	} else if (role === "seller") {
		customer = await Seller.findOne({ customerName });
	}

	// Check if Customer exists
	if (!customer) {
		return next(new ErrorHandler("Customer not found with the given Customername.", 404));
	}

	// Send the Customer data as a response
	res.status(200).json({
		success: true,
		customer,
	});
});

const getAllOtherProfile = tryCatch(async (req, res, next) => {
	const { customerName, role } = req.query; // Access query parameters

	// Check if CustomerName or role is missing
	if (!customerName || !role) {
		return next(new ErrorHandler("Incomplete query: CustomerName and role are required.", 400));
	}

	console.log(`Fetching profiles starting with CustomerName: ${customerName}, role: ${role}`);

	// Define the regex for "starts with"
	const regex = new RegExp(`^${customerName}`, "i"); // Case-insensitive regex

	// Fetch Customers based on role
	let customers;
	if (role === "customer") {
		customers = await Customer.find({ customerName: regex }); // Find Customers whose Customernames start with `CustomerName`
	} else if (role === "seller") {
		customers = await Seller.find({ customerName: regex }); // Find Seller whose Customernames start with `CustomerName`
	} else {
		return next(new ErrorHandler("Invalid role provided.", 400));
	}

	// Check if Customers exist
	if (!customers || customers.length === 0) {
		return next(new ErrorHandler("No Customers found with the given Customername prefix.", 404));
	}

	// Send the Customer data as a response
	res.status(200).json({
		success: true,
		customers,
	});
});

const logOut = tryCatch(async (req, res) => {
	return res
		.status(200)
		.cookie("token", "", { ...cookieOption, maxAge: 0 })
		.json({
			success: true,
			message: "Logged out successfully",
		});
});

const updateUserName = tryCatch(async (req, res) => {
	const newUserName = req.body;
	let customer;
	if (customerRole === "customer") Customer = await Customer.findById(req.Customer);
	else customer = await Seller.findById(req.customer);

	if (!customer) return next(new ErrorHandler("Customer / Seller not found", 404));

	customer.username = newUserName;
	await customer.save();

	return res.status(200).json({ success: true });
});

const addToCart = tryCatch(async(req,res)=>{
	const customer = await Customer.findById(req.customer);
	if(!customer) return next(new ErrorHandler("Customer not found",404));
	const { productID, quantity } = req.body;
    if (!productID || !quantity) return next(new ErrorHandler("Product ID and quantity are required", 400));

    customer.cart.push({ productID, quantity });
    await customer.save();

    return res.status(200).json({ success: true, cart: customer.cart });
});

export {
	newCustomer,
	login,
	forgetPassword,
	setNewPassword,
	getMyProfile,
	getOtherProfile,
	getAllOtherProfile,
	logOut,
	emailVerification,
	confirmOTP,
	uploadCustomerPhoto,
	resizeCustomerPhoto,
	updateUserName,
	verifyAnswer,
	addToCart
};
