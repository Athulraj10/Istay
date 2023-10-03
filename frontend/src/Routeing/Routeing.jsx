import React from 'react'
import { Route,Routes } from 'react-router-dom'

// --------------User Panel-----------
import HomeScreen from '../components/Users/Screens/HomeScreen'
import LoginScreen from '../components/Users/Screens/LoginScreen'
import RegisterScreen from '../components/Users/Screens/RegisterScreen'
import OTPScreen from '../components/Users/Screens/OTPScreen'
import ForgetScreenPassword from '../components/Users/Screens/ForgetScreenPassword'
import ResetPassword from '../components/Users/Screens/ResetPasswordScreen'


// --------------Sellers Panel-----------
import SellerLoginScreen from '../components/Sellers/Screens/SellerLoginScreen'
import SellerRegisterScreen from '../components/Sellers/Screens/SellerRegisterScreen'
import SellerDashboardScreen from '../components/Sellers/Screens/SellerHomeScreen'
import SellerOTPScreen from '../components/Sellers/Screens/SellerOTPScreen'
import SellerForgetScreenPassword  from '../components/Sellers/Screens/SellerForgetScreenPassword'
import SellerResetPassword from '../components/Sellers/Screens/SellerResetPasswordScreen'





// --------------Admin  Panel-----------


const Routeing = () => {
  return (
    <Routes>
        <Route path='/register' element={<RegisterScreen/>}/>
        <Route path='/login' element={<LoginScreen/>}/>
        <Route path='/' element={<HomeScreen/>}/>
        <Route path='/forget' element={<ForgetScreenPassword/>}/>
        <Route path='/OTP' element={<OTPScreen/>}/>
        <Route path='/resetPassword' element={<ResetPassword/>}/>


{/* -----------Seller Routes---------- */}
        <Route path='/sellers/register' element={<SellerRegisterScreen/>}/>
        <Route path='/sellers/login' element={<SellerLoginScreen/>}/>
        <Route path='/sellers/dashboard' element={<SellerDashboardScreen/>}/>
        <Route path='/sellers/forget' element={<SellerForgetScreenPassword/>}/>
        <Route path='/sellers/OTP' element={<SellerOTPScreen/>}/>
        <Route path='/sellers/resetPassword' element={<SellerResetPassword/>}/>

{/* ------------Admin Panel--------- */}

    </Routes>
  )
}

export default Routeing