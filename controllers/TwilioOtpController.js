// require('dotenv').config();
// const twilio = require("twilio");

// const accountSid = "ACd92bc12166dbcaaacb896e7b5877bbb1"; // Your actual SID
// const authToken = "033638ece3ea6eeb5ee7be7fa51ca570"; // Your actual token
// const client = twilio(accountSid, authToken);

// async function createService() {
//   try {
//     const service = await client.verify.v2.services.create({
//       friendlyName: "My First Verify Service",
//     });
//     console.log('Service SID:', service.sid);
//   } catch (error) {
//     console.error("Error creating service:", error.message);
//   }
// }

// async function sendSms() {
//   try {
//     const message = await client.messages.create({
//       body: "Hello! This is a test message from your Twilio application.", // Your message here
//       from: "VAb1d4d03598637144840b9641487731bc", // Replace with your Twilio phone number
//       to: "+918191839118", // Replace with your personal phone number
//     });
//     console.log('Message sent! SID:', message.sid);
//   } catch (error) {
//     console.error("Error sending message:", error.message);
//   }
// }

// // Call the functions to execute them
// createService();
// sendSms();

// module.exports = { createService, sendSms };
