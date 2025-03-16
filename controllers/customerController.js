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
let CustomerRole;
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

	const Customer = await Customer.create({
		name,
		email,
		password,
		rollNumber
	});
	return Customer;
};

const newCustomer = tryCatch(async (req, res, next) => {
	const { name, email, password } = req.body;

	if (!name || !email || !password ) {
		return next(new ErrorHandler("Please fill all fields", 404));
	}

	try {
		let Customer;
		if (email[0] === "2") {
			Customer = await createCustomer(name, email, password);
		} 
		else {
			const seller = await Seller.create({
				storeName,
				ownerName,
				email,
				password,
				address,
				contactNumber,
				operatingHours
			});
			Customer = seller;
			console.log(Customer);
		}
		sendToken(res, Customer, 200, `Welcome to GCSHOP`);
	} 
	catch (error) {
		console.error("Error creating Customer:", error);
		return next(new ErrorHandler("An error occurred while creating the Customer", 500));
	}
});

const login = tryCatch(async (req, res, next) => {
	const { email, password, toRemember } = req.body;
	if (!email || !password) {
		return next(new ErrorHandler("Please fill all the fields", 404));
	}

	let Customer;
	if (email[0] === "2") Customer = await Customer.findOne({ email }).select("+password");
	else Customer = await Teacher.findOne({ email }).select("+password");

	if (!Customer) return next(new ErrorHandler("Invalid credentials", 404));
	const isMatch = await bcrypt.compare(password, Customer.password);
	if (!isMatch) return next(new ErrorHandler("Invalid credentials", 401));

	CustomerRole = Customer.role;
	if(toRemember) sendToken(res, Customer, 200, `Welcome back, ${Customer.name}`);
	return res.status(200).json({ success: true, message: `Welcome back, ${Customer.name}`, Customer: Customer });
});

const forgetPassword = tryCatch(async (req, res, next) => {
	const { email } = req.body;
	if (!email) return next(new ErrorHandler("Please fill all the fields", 404));

	const Customer = await Customer.findOne({ email }).select("+password");
	if (!Customer) return next(new ErrorHandler("Customer do not exists", 404));

	sendOTP(email, "Forget Password", next);
	return res.status(200).json({ success: true });
});

const setNewPassword = tryCatch(async (req, res, next) => {
	const { email, password } = req.body;
	if (!email || !password) return next(new ErrorHandler("Please fill all the fields", 404));

	const Customer = await Customer.findOne({ email });
	if (!Customer) return next(new ErrorHandler("Customer do not exists", 404));
	Customer.password = password;
	await Customer.save();
	return res.status(200).json({ success: true, Customer: Customer, message: "Password has been updated." });
});

const getMyProfile = tryCatch(async (req, res) => {
	let Customer;
	if (CustomerRole === "customer") Customer = await Customer.findById(req.Customer);
	else Customer = await Seller.findById(req.Customer);
	return res.status(200).json({
		success: true,
		Customer,
	});
});

const getOtherProfile = tryCatch(async (req, res, next) => {
	const { CustomerName, role } = req.query; // Access query parameters

	// Check if CustomerName or role is missing
	if (!CustomerName || !role) {
		return next(new ErrorHandler("Incomplete query: CustomerName and role are required.", 400));
	}

	console.log(`Fetching profile for CustomerName: ${CustomerName}, role: ${role}`);

	// Fetch Customer based on role
	let Customer;
	if (role === "customer") {
		Customer = await Customer.findOne({ CustomerName });
	} else if (role === "seller") {
		Customer = await Seller.findOne({ CustomerName });
	}

	// Check if Customer exists
	if (!Customer) {
		return next(new ErrorHandler("Customer not found with the given Customername.", 404));
	}

	// Send the Customer data as a response
	res.status(200).json({
		success: true,
		Customer,
	});
});

const getAllOtherProfile = tryCatch(async (req, res, next) => {
	const { CustomerName, role } = req.query; // Access query parameters

	// Check if CustomerName or role is missing
	if (!CustomerName || !role) {
		return next(new ErrorHandler("Incomplete query: CustomerName and role are required.", 400));
	}

	console.log(`Fetching profiles starting with CustomerName: ${CustomerName}, role: ${role}`);

	// Define the regex for "starts with"
	const regex = new RegExp(`^${CustomerName}`, "i"); // Case-insensitive regex

	// Fetch Customers based on role
	let Customers;
	if (role === "customer") {
		Customers = await Customer.find({ CustomerName: regex }); // Find Customers whose Customernames start with `CustomerName`
	} else if (role === "seller") {
		Customers = await Seller.find({ CustomerName: regex }); // Find Seller whose Customernames start with `CustomerName`
	} else {
		return next(new ErrorHandler("Invalid role provided.", 400));
	}

	// Check if Customers exist
	if (!Customers || Customers.length === 0) {
		return next(new ErrorHandler("No Customers found with the given Customername prefix.", 404));
	}

	// Send the Customer data as a response
	res.status(200).json({
		success: true,
		Customers,
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
	let Customer;
	if (CustomerRole === "customer") Customer = await Customer.findById(req.Customer);
	else Customer = await Seller.findById(req.Customer);

	if (!Customer) return next(new ErrorHandler("Customer / Seller not found", 404));

	Customer.username = newUserName;
	await Customer.save();

	return res.status(200).json({ success: true });
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
	verifyAnswer
};
