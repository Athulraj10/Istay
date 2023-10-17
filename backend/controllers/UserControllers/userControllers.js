import mongoose from 'mongoose'; // Import mongoose

import asyncHnadler from "express-async-handler";
import User from "../../models/UserModels/userModel.js";
import OTP from "../../models/OTPModel.js";
import genereateToken from "../../utils/generateToken.js";
import nodemailer from "nodemailer";
import {
  sessionSecret,
  emailUser,
  NewAppPassword,
} from "../../config/config.js";
import Hostel from "../../models/SellerModel/HostelModel.js";
import { Stripe } from "stripe";
import Booking from "../../models/BookHostelModel/BookHostelModel.js";
import HostelReview from '../../models/SellerModel/Review.js';
//@desc forgetOTP
//access Public
//route POST// users/forget
// -------------------------SENT OTP NodeMailer---------------------------------------
const sendForgetPassword = async (name, email, OTP) => {
  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      requireTLS: true,
      auth: {
        user: emailUser,
        pass: NewAppPassword,
      },
    });
    const mailOptions = {
      from: emailUser,
      to: email,
      subject: "Reset your Password",
      html: `<p>Hi ${name}, <br> Did you requsted for a Password reset...?<br>If Yes...<br> Your OTP For reset password is ${OTP}`,
    };
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error(error);
      } else {
        console.error("email successfully", info.response);
      }
    });
  } catch (error) {
    console.error(error.message);
  }
};

const singleHostelFinding = async (hostelId) => {
  try {
    const findHostel = await Hostel.findById({ _id: hostelId });
    if (findHostel) {
      return findHostel;
    } else {
      return false;
    }
  } catch (error) {
    console.error(error);
  }
};

const aggregateBookingWithHostel = async (userId) => {
  try {
    const result = await Booking.aggregate([
      {
        $match: { user: new mongoose.Types.ObjectId(userId) }
      },
      {
        $lookup: {
          from: 'hostels', // Name of the Hostel collection
          localField: 'hostel',
          foreignField: '_id',
          as: 'hostelDetails'
        }
      },
      {
        $unwind: '$hostelDetails'
      },
      {
        $lookup: {
          from: 'sellers', // Name of the Sellers collection
          localField: 'hostelDetails.seller',
          foreignField: '_id',
          as: 'sellerDetails'
        }
      },
      {
        $group: {
          _id: '$_id',
          user: { $first: '$user' },
          hostel: { $first: '$hostel' },
          paymentMethod: { $first: '$paymentMethod' },
          paymentVia: { $first: '$paymentVia' },
          totalAmount: { $first: '$totalAmount' },
          hostelDetails: { $first: '$hostelDetails' },
          sellerDetails: { $first: '$sellerDetails' }
        }
      }
    ]);

    return result;

  } catch (error) {
    console.log(error);
  }
}

// async function getUserBookings(userId) {
//   return new Promise((resolve, reject) => {
//     Booking.aggregate([
//       {
//         $match: {
//           user: new ObjectId(userId)
//         }
//       },
//       {
//         $lookup: {
//           from: 'User', // Replace with the actual collection name for users
//           localField: 'user',
//           foreignField: '_id',
//           as: 'user'
//         }
//       },
//       {
//         $lookup: {
//           from: 'Hostel', // Replace with the actual collection name for hostels
//           localField: 'hostel',
//           foreignField: '_id',
//           as: 'hostel'
//         }
//       }
//     ]).exec((err, result) => {
//       if (err) {
//         reject(err);
//       } else {
//         resolve(result);
//       }
//     });
//   });
// }


// -------------------Save OTP with UserEmail---------------------------
const OTPsaveFunction = async (email, otp) => {
  try {
    const existingOTP = await OTP.findOne({ email });
    if (existingOTP) {
      await OTP.deleteOne({ email });
    }
    const saveOTP = new OTP({
      email: email,
      otp: otp,
    });
    const OTPsaved = await saveOTP.save();
    return;
  } catch (error) {
    console.error(error.message);
  }
};

// -------------------User Authentication---------------------------
//@desc Auth user/set token
//access Public
//route POST// /api/users
const authUser = asyncHnadler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) {
    res.status(401).json({
      message: "Invalid Email or Password",
    });
    throw new Error("Invalid Email or Password");
  }
  if (user && (await user.matchPassword(password))) {
    genereateToken(res, user._id);
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
    });
  } else {
    res.status(401);
    throw new Error("Invalid Email or Password");
  }
});

// -------------------Register New User---------------------------
//@desc createing new  user
//access Public
//route POST// /api/register
const registerUser = asyncHnadler(async (req, res) => {
  const { userName, email, password, mobile } = req.body;
  const userExists = await User.findOne({ email });
  if (userExists) {
    res.status(400);
    throw new Error(" User already Exists");
  }
  const userRegister = await User.create({
    name: userName,
    email,
    password,
    mobile,
  });

  if (userRegister) {
    genereateToken(res, userRegister._id);
    res.status(201).json({
      _id: userRegister._id,
      name: userRegister.name,
      email: userRegister.email,
    });
  }
});

// -------------------Forget Password User Verification---------------------------
//@desc Auth user/set token
//access Public
//route POST// /api/users
const forget = asyncHnadler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email: email });
  if (!user) {
    return res.status(401).json({
      message: "Invalid Email",
    });
  }
  if (user) {
    let OTPgenerated = Math.floor(100000 + Math.random() * 900000);
    sendForgetPassword(user.name, user.email, OTPgenerated);
    console.log(OTPgenerated);
    const saveOrNot = await OTPsaveFunction(user.email, OTPgenerated);
    return res.json({
      email,
    });
  }
});

// -----------------------------Verify OTP ---------------------------
const verifyOTP = asyncHnadler(async (req, res) => {
  const { email } = req.body;
  const otp = req.body.enteredOTP;
  try {
    const user = await OTP.findOne({ email });
    if (!user) {
      return res.json({ message: "Invalid Expired" });
    }
    if (user) {
      const enterOTP = parseInt(otp);
      const databaseOTP = parseInt(user.otp);
      if (enterOTP !== databaseOTP) {
        return res.status(401).json({ message: "Invalid OTP" });
      }
      if (enterOTP === databaseOTP) {
        return res.json({ user: user.email });
      }
    }
  } catch (error) {
    console.log(error.message);
  }
});

// ----------------------------Reset Password-------------
const resetPassword = asyncHnadler(async (req, res) => {
  const { userId, password } = req.body;
  try {
    const user = await User.findOne({ email: userId });
    if (!user) {
      return res
        .status(404)
        .json({ message: "Something Wrong Please Try Again" });
    }
    if (user) {
      user.password = password;
      await user.save();
      res.status(200).json({ message: "Password reset successfully" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server Error" });
  }
});
// ----------------------------FindAccommodation-------------
const findAccommodation = asyncHnadler(async (req, res) => {
  try {
    const hostels = await Hostel.find({ isBlock: { $ne: true } });

    if (!hostels) {
      return res
        .status(404)
        .json({ message: "Something Wrong Please Try Again" });
    }
    if (hostels) {
      res.status(200).json({ data: hostels });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server Error" });
  }
});
// ----------------------------singlePageView hostel-------------
const singlePageView = asyncHnadler(async (req, res) => {
  try {
    const hostel = await Hostel.find({ _id: req.body.id });
    const review = await HostelReview.find({ hostel: req.body.id });
    console.log(review)
    if (!hostel) {
      return res.status(404).json({ message: "Something Wrong Please Try Again" });
    }
    if (hostel) {
      const responseData = {
        data: hostel,
        review: review || null, // Send review data if available, or null if not
      };
      res.status(200).json(responseData);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server Error" });
  }
});

// ----------------------------singlePageView hostel-------------
const bookHostel = asyncHnadler(async (req, res) => {
  try {
    const { userId, hostel } = req.body;
    const key = process.env.STRIPE_KEY;
    const stripe = new Stripe(key);
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "inr",
            product_data: {
              name: hostel.hostelName,
            },
            // unit_amount: hostel.price * 100,
            unit_amount: 10 * 100,
          },
          quantity: 1,
        },
      ],
      // success_url: `http://localhost:3000/bookingConfirmation?details=${details}`,
      success_url: `http://localhost:3000/bookingConfirmation?userId=${userId}&hostel=${hostel._id}`,
      cancel_url: `http://localhost:3000/login`,
    });
    res.json({ id: session.id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server Error" });
  }
});

// ----------------------------Stripe Booking -------------
const bookingConfirmation = asyncHnadler(async (req, res) => {
  const { userId, hostelId } = req.query;
  try {
    const hostelDatas = await singleHostelFinding(hostelId);
    let price = parseFloat(hostelDatas.price);
    let extraPrice = parseFloat(hostelDatas.extraPrice);
    let sellerId = hostelDatas.seller
    let totalAmount = price + extraPrice;

    if (userId && hostelId) {
      const conformBooking = new Booking({
        user: userId,
        hostel: hostelId,
        seller: sellerId,
        date: new Date(),
        totalAmount: totalAmount,
        paymentMethod: "Card",
        paymentVia: "Stripe",

      });
      const booked = await conformBooking.save();
      if (booked) {
        res
          .status(200)
          .json({ bookingCompleted: true, hostelData: hostelDatas,bookedDetails:booked });
      } else {
        res.status(404).json({ bookingCompleted: false });
      }
    }
  } catch (error) {
    console.error(error);
  }
});

// ----------------------------user mY booking-------------
const myBookings = asyncHnadler(async(req,res)=>{
  const userId = req.query.token;
  const response =await aggregateBookingWithHostel(userId)
  try {
    if(response){
     return res.status(200).json({
        allDetails:response
      })
    }
  } catch (error) {
    console.error(error)
  }
} )
const addReview = asyncHnadler(async(req,res)=>{
  const {userId,hostelId,description}= req.body
  try {
    const review = new HostelReview({
      user:userId,
      hostel:hostelId,
      content:description
    })
    if (req.files) {
      const uploadedFiles = req.files;
      let fileUrls = [];
      for (let file of uploadedFiles) {
        const filePath = file.filename;
        fileUrls.push(filePath);
      }
      review.images = fileUrls;
    }
    const hostelReviewAdded = await review.save();
    if(!hostelReviewAdded){
      return res.status(404).json({review:false,message:'Internal Error'})
    }
    if(hostelReviewAdded){
      return res.status(200).json({review:true,message:'Review Added Successfully'})
    }
  } catch (error) {
    console.error(error)
  }
})











// --------------------------Logout clearing JWT---------------------------
//@desc logout USer
//access Public
//route POST// /api/logout
const logoutUser = asyncHnadler(async (req, res) => {
  res.cookie("jwt", "", {
    httpOnly: true,
    expires: new Date(0),
    secure: false, // Set to true if you're using HTTPS
    sameSite: "none", // Set to "none" for cross-site cookies
  });

  res.status(200).json({ message: "User Logout" });
});

// ---------------------------Get User Profile---------------------------
//@desc get user profile
//access Private
//route POST// /api/users/profile
const getUserProfile = asyncHnadler(async (req, res) => {
  const userDetails = {
    name: req.user.name,
    email: req.user.email,
    user_id: req.user._id,
  };
  res.status(200).json({ message: "User profile" });
});

// ---------------------------Update User Profile---------------------------
//@desc get update user profile
//access Private
//route PUT// /api/users/profile
const updateUserProfile = asyncHnadler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (user) {
    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;
    if (req.body.password) {
      user.password = req.body.password;
    }

    const updatedUser = await user.save();
    res.status(200).json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
    });
  } else {
    res.status(404);
    throw new Error("User Not Found");
  }
});

export {
  authUser,
  registerUser,
  logoutUser,
  forget,
  getUserProfile,
  updateUserProfile,
  verifyOTP,
  resetPassword,
  findAccommodation,
  singlePageView,
  bookHostel,
  bookingConfirmation,
  myBookings,addReview
};
