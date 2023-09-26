import asyncHandler from "express-async-handler";
import jwt from "jsonwebtoken";
import User from "../models/userModel.js";

const protect = asyncHandler(async (req,res,next) => {
    let token ; 
    token = req.cookies.jwt;
    console.log(token)
    if(token){
        try {
            const decodedToken = jwt.verify(token,process.env.JWT_SECRET);
            req.user = await User.FindbyId(decodedToken.userId).select('-password');
            next();
        } catch (error) {
            res.status(401);
            throw new Error('Not Authorized ,Invalid Token ')
        }
    }else{
        res.status(401);
        throw new Error('Not authorized, No token')
    }
})

export {protect}