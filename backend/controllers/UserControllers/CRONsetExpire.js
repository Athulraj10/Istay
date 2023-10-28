import Booking from "../../models/BookHostelModel/BookHostelModel.js";

async function updateExpiredBookings() {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
      const result = await Booking.updateMany(
        {
          expirationDate: { $lte: thirtyDaysAgo },
          status: 'active',
        },
        { $set: { status: 'expired' } }
      );
  
      console.log('Expired bookings updated. Modified:', result.nModified);
    } catch (error) {
      console.error('Error updating expired bookings:', error);
    }
  }
export default updateExpiredBookings
  
  