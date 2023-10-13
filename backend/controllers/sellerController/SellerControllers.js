import asyncHandler from "express-async-handler";;
import nodemailer from "nodemailer";
import { sessionSecret, emailUser, NewAppPassword } from "../../config/config.js";
import Seller from '../../models/SellerModel/SellerModel.js'
import OTP from '../../models/OTPModel.js'
import generateToken from "../../utils/generateToken.js";
import Hostel from "../../models/SellerModel/HostelModel.js";

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
        console.log(error);
      } else {
        console.log("email successfully", info.response);
      }
    });
  } catch (error) {
    console.log(error.message);
  }
};

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
    console.log(error.message);
  }
};

// -------------------seller Authentication---------------------------
// @desc Auth user/set token
// access Public
// route POST// /api/users
const authSeller = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const seller = await Seller.findOne({ email });
  if (!seller) {
    return res.status(401).json({
      message: "Invalid Email or Password",
    });
  }
  if (seller && (await seller.matchPassword(password))) {
    // Assuming generateToken is a valid function
    const token = generateToken(res, seller._id); // Pass res as the first argument
    
    return res.status(201).json({
      _id: seller._id,
      name: seller.name,
      email: seller.email,
      token, // Send the token back to the client
    });
  }
  // If the password doesn't match
  return res.status(401).json({
    message: "Invalid Email or Password",
  });
});

// -------------------Register New seller---------------------------
//@desc createing new  user
//access Public
//route POST// /api/register
const registerSeller = asyncHandler(async (req, res) => {
  const { name, email, password, mobile } = req.body;
  const sellerExists = await Seller.findOne({ email });

  if (sellerExists) {
    const error = new Error("Seller Already Exists");
    res.status(400);
    error.status = 400;
    throw error;
  }

  // If seller does not exist, create a new seller
  const sellerRegister = await Seller.create({
    name,
    email,
    password,
    mobile,
  });

  if(sellerRegister){
    generateToken(res,sellerRegister._id);
    res.status(201).json({
      _id:sellerRegister._id,
      name:sellerRegister.name,
      email:sellerRegister.email
    })
  }
});



// -------------------Forget Password Seller Verification---------------------------
//@desc Auth user/set token
//access Public
//route POST// /api/users
const sellerForget = asyncHandler(async (req, res) => {
  const { email } = req.body;
  console.log(req.body)
  const seller = await Seller.findOne({ email });
  if (!seller) {
    return res.status(401).json({
      message: "Invalid Email"
    });
  }
  if (seller) {
    let OTPgenerated = Math.floor(100000 + Math.random() * 900000);
    // sendForgetPassword(seller.name, seller.email, OTPgenerated);
    console.log(OTPgenerated);
    const saveOrNot = await OTPsaveFunction(seller.email, OTPgenerated);
    return res.json({
      email
    });
  }
});

// -----------------------------Verify OTP ---------------------------
const sellerVerifyOTP = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const otp = req.body.enteredOTP;
  try {
    const seller = await OTP.findOne({ email });
    if (!seller) {
      return res.json({ message: "Invalid Expired" });
    }
    if (seller) {
      const enterOTP = parseInt(otp);
      const databaseOTP = parseInt(seller.otp);
      if (enterOTP !== databaseOTP) {
        return res.status(401).json({ message: "Invalid OTP" });
      }
      if (enterOTP === databaseOTP) {
        return res.status(200).json({ seller: seller.email });
      }
    }
  } catch (error) {
    console.log(error.message);
  }
});

// ----------------------------Reset Password-------------
const sellersResetPassword = asyncHandler(async (req, res) => {
  const { userId, password } = req.body;
  console.log(req.body)
  try {
    const seller = await Seller.findOne({ email: userId });
    if (!seller) {
      return res
        .status(404)
        .json({ message: "Something Wrong Please Try Again" });
    }
    if (seller) {
      seller.password = password;
      await seller.save();
      res.status(200).json({ message: "Password reset successfully" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server Error" });
  }
});

// ----------------------------List seller Hostels-------------
const listHostels =  asyncHandler(async(req,res) =>{
  try {
    const sellerID = req.body.sellerId;
    if(sellerID){
      const listHostels = await Hostel.find({seller:sellerID});
      res.status(200).json({data:listHostels})
    }
      } catch (error) {
    console.log("listHostelAdmin");
    res.status(500).json({
      message: "Hostel List Error",
    });
  }
})

// ----------------------------Edit Hostels Data senting Part-------------
const editHostel = asyncHandler(async(req,res) => {
    const id = req.body._id
    try {
      const hostelDetails = await Hostel.findOne({_id:id})
      res.status(200).json({data:hostelDetails})
    } catch (error) {
      console.log(error)
    }
})

// ----------------------------editHostel Details Hostel data receiving part-------------
const editHostelDetails = asyncHandler(async (req, res) => {
  const formDataObject = req.body;
  try {
    if (!formDataObject) {
      return res
        .status(400)
        .json({ message: "Bad request. Request body is empty." });
    }

    const hostel = await Hostel.findOne({ _id: formDataObject.id });

    if (!hostel) {
      return res.status(404).json({ message: "Hostel not found." });
    }

    const editedDetails = {
      seller: formDataObject.sellerID,
      category: formDataObject.category,
      hostelName: formDataObject.hostelName,
      mainLocation: formDataObject.mainLocation,
      description: formDataObject.descriptions,
      fullDetails: formDataObject.fullDetails,
      contactNumber: formDataObject.contactNumber,
      mapLink: formDataObject.mapLink,
      additionalAboutHostel: formDataObject.additionalAboutHostel,
      nearByLocation: formDataObject.nearByLocation,
      restrictions: formDataObject.restrictions,
      descriptionAboutHostel: formDataObject.descriptionAboutHostel,
      guestProfile: formDataObject.guestProfile,
      price: formDataObject.price,
      extraPrice: formDataObject.extraPrice,
      totalBedInRoom: formDataObject.totalBedInRoom,
      bedAvailableNow: formDataObject.bedAvailableNow,
      Wifi: formDataObject.Wifi,
      food: formDataObject.food,
      parking: formDataObject.parking,
      drinkingWater: formDataObject.drinkingWater,
    };

    if (req.files && req.files.length > 0) {
      const uploadedFiles = req.files;
      let fileUrls = [];
      for (let file of uploadedFiles) {
        const filePath = file.filename;
        fileUrls.push(filePath);
      }
      editedDetails.images = fileUrls;
    }

    // Update the hostel document with editedDetails
    const updatedHostel = await Hostel.findOneAndUpdate(
      { _id: formDataObject.id },
      editedDetails,
      { new: true } // Return the updated document
    );

    if (updatedHostel) {
      return res.status(200).json({
        hostelUpdated: true,
        updatedHostel,
      });
    } else {
      return res.status(500).json({ message: "Failed to update hostel." });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error." });
  }
});

// ----------------------------Seller Add Hostel-------------
const addHostelDetails = asyncHandler(async (req, res) => {
  
  console.log("sellerHostelAddingfucntion")
  console.log(req.body)
  // .map((file) => file.path);
  console.log('seller Add Hostel')
  const formDataObject = req.body;
  // ---------save value to database--------
  try {
    if (!formDataObject) {
      return res
        .status(404)
        .json({ message: "Something Wrong Please Try Again" });
    }

    if (formDataObject) {
      const hostelData = new Hostel({
        seller:formDataObject.sellerID,
        category: formDataObject.category,
        hostelName: formDataObject.hostelName,
        mainLocation: formDataObject.mainLocation,
        description: formDataObject.descriptions,
        fullDetails: formDataObject.fullDetails,
        contactNumber: formDataObject.contactNumber,
        mapLink: formDataObject.mapLink,
        additionalAboutHostel: formDataObject.additionalAboutHostel,
        nearByLocation: formDataObject.nearByLocation,
        restrictions: formDataObject.restrictions,
        descriptionAboutHostel: formDataObject.descriptionAboutHostel,
        guestProfile: formDataObject.guestProfile,
        price: formDataObject.price,
        extraPrice: formDataObject.extraPrice,
        totalBedInRoom: formDataObject.totalBedInRoom,
        bedAvailableNow: formDataObject.bedAvailableNow,
        Wifi: formDataObject.Wifi,
        food: formDataObject.food,
        parking: formDataObject.parking,
        drinkingWater: formDataObject.drinkingWater,
      });
      if (req.files) {
        const uploadedFiles = req.files;
        let fileUrls = [];
        for (let file of uploadedFiles) {
          const filePath = file.filename;
          fileUrls.push(filePath);
        }
        hostelData.images = fileUrls;
      }
      const hosteldetails = await hostelData.save();
  
      if (hosteldetails) {
        return res.status(201).json({
          hostelAdded: true,
        });
      }
      if (!hosteldetails) {
        return res
          .status(404)
          .json({ message: "Something Wrong Please Try Again" });
      }
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Some Field Missing or Server Error" });
  }
});

// --------------------------Logout clearing JWT---------------------------
//@desc logout USer
//access Public
//route POST// /api/logout
const logoutSeller = asyncHandler(async (req, res) => {
  console.log("logout");
  // Set the SameSite attribute to None and Secure to true for cross-site cookies
  res.cookie("jwt", "", {
    httpOnly: true,
    expires: new Date(0),
    secure: false, // Set to true if you're using HTTPS
    sameSite: "none", // Set to "none" for cross-site cookies
  });

  res.status(200).json({ status: "User Logout" });
});



// ---------------------------Get User Profile---------------------------
//@desc get user profile
//access Private
//route POST// /api/users/profile
// const getUserProfile = asyncHandler(async (req, res) => {
//   // console.log(req.user)
//   const userDetails = {
//     name: req.user.name,
//     email: req.user.email,
//     user_id: req.user._id,
//   };
//   // console.log(userDetails)
//   res.status(200).json({ message: "User profile" });
// });



// ---------------------------Update User Profile---------------------------
//@desc get update user profile
//access Private
//route PUT// /api/users/profile
// const updateUserProfile = asyncHandler(async (req, res) => {
//   const user = await User.findById(req.user._id);
//   // console.log(user)
//   if (user) {
//     // console.log(req.body)
//     user.name = req.body.name || user.name;
//     user.email = req.body.email || user.email;
//     if (req.body.password) {
//       user.password = req.body.password;
//     }
//     const updatedUser = await user.save();
//     res.status(200).json({
//       _id: updatedUser._id,
//       name: updatedUser.name,
//       email: updatedUser.email,
//     });
//   } else {
//     res.status(404);
//     throw new Error("User Not Found");
//   }
// });

export {
  authSeller,
  registerSeller,
  logoutSeller,
  sellerForget,
  // getUserProfile,
  // updateUserProfile,
  sellerVerifyOTP,
  sellersResetPassword,


  // LIST HOSTEL
  listHostels,
  editHostel,
  editHostelDetails,
  addHostelDetails
};
