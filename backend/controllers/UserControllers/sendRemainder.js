import Booking from "../../models/BookHostelModel/BookHostelModel.js";

async function sendReminderEmails() {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
      const bookings = await Booking.find({
        date: { $lte: thirtyDaysAgo },
        notified: false,
       });
  
      if (bookings.length === 0) {
        console.log('No reminder emails to send.');
        return;
      }
  
      console.log(`Sending ${bookings.length} reminder emails...`);
      
      for (const booking of bookings) {
        const mailOptions = {
          from: process.env.EMAIL_USER,
          to: booking.userEmail,
          subject: 'Reminder: Your Booking',
          html: `<p>Hi ${booking.userName}, <br> This is a reminder for your booking made 30 days ago.</p>`,
        };
  
        const sentMessage = await transporter.sendMail(mailOptions);
        booking.notified = true;
        await booking.save();
        console.log(`Reminder email sent to ${booking.userEmail}`);
      }
      console.log('All reminder emails sent.');
    } catch (error) {
      console.error('Error sending reminder emails:', error);
    }
  }
export default sendReminderEmails