const twilio = require('twilio');
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);


const sendNotification = async (req, res) =>{

   
    try {
       
        const {mobile, message} = req.body;
        
        const response = await client.messages.create({
            body:message,
            from: process.env.TWILIO_PHONE_NUMBER || '+19705281597',
            to: "+91"+mobile,
        });
        res.status(200).json({success:true, response});
        
    } catch (error) {
        res.status(500).json({success: false, message: error.message});

        
    }
};

module.exports = {sendNotification};
