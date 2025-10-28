// // db.js
// require('dotenv').config();
// const mongoose = require('mongoose');

// async function connectDb() {

//     console.log("hello connection db")
//   // Agar already connected, return existing connection
//   if (mongoose.connection.readyState === 1) {
//     console.log('MongoDB already connected to:', mongoose.connection.host);
//     return mongoose.connection;
//   }

//   const uri = process.env.MONGO_URI;
//   console.log(uri)
//   if (!uri) throw new Error('MONGO_URI not defined in .env');

//   try {
//     await mongoose.connect(uri, {
//       useNewUrlParser: true,
//       useUnifiedTopology: true,
//       serverSelectionTimeoutMS: 50000,
//       socketTimeoutMS: 45000,
//       maxPoolSize: 50,
//       bufferCommands: false
//     });
//     console.log('MongoDB connected successfully:', mongoose.connection.host);
//     return mongoose.connection;
//   } catch (err) {
//     console.error('MongoDB connection error:', err.message);
//     process.exit(1);
//   }
// }

// module.exports = connectDb;
