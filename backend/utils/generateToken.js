import jwt from "jsonwebtoken";
const genereateToken = (res,userId)=>{
    const token = jwt.sign({userId},process.env.JWT_SECRET,{
        expiresIn:'14d'
    });

    res.cookie('jwt', token ,{
        httpOnly:true,
        secure:process.env.NODE_ENV !== 'development',
        sameSite : 'strict',
        maxAge : 14 * 24 * 60 * 1000
    })
}
export default genereateToken;