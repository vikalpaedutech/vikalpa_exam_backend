import axios from "axios";

export const sendOtp = async (req, res) => {


    console.log('hello otp')
  const { phone, otp } = req.body;

  if (!phone || !otp) {
    return res.status(400).json({ status: "Failed", message: "Missing phone or OTP" });
  }

  const smsText = `Dear user, your OTP for Vikalpa Account Sign-up is: ${otp}. Please do not share it with anyone. Vikalpa.`;

  const smsUrl = `http://sms.gooadvert.com/api/mt/SendSMS?APIKey=e3744d6493af43768cc71287368c1293&senderid=VIKLPA&channel=Trans&DCS=0&flashsms=0&number=${phone}&text=${encodeURIComponent(smsText)}&route=5&PEId=1401539030000072375`;

  try {
    const response = await axios.get(smsUrl);
    return res.status(200).json({ status: "Success", response: response.data });
  } catch (error) {
    console.error("OTP Sending Error:", error.message);
    return res.status(500).json({ status: "Failed", message: error.message });
  }
};
