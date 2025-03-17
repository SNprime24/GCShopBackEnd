import express from 'express'
import {
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
	updateUserName,
	verifyAnswer
} from '../controllers/customerController.js'
import { isAuthenticated } from '../middlewares/auth.js';
import { emailValidator, otpValidator, validate } from '../lib/validator.js';

const router = express.Router();

router.post('/verifyOTP', otpValidator(), validate, confirmOTP);

// user must not be logged in
// router.post('/verifyEmail', emailValidator(), validate, emailVerification);
// router.post('/verifyEmail', emailVerification);
router.post('/new', newCustomer);
router.post('/login', login);
router.post('/forgetPassword', forgetPassword);
router.post('/setPassword', setNewPassword);
router.post('/verifyAnswer', verifyAnswer);

// user must be logged in
// router.use(isAuthenticated); 
router.get("/me", getMyProfile);
router.get("/other", getOtherProfile);
router.get("/allOther",getAllOtherProfile);
router.get("/updateUserName",updateUserName);
router.get("/logOut", logOut);

export default router;