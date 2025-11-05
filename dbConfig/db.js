//Connection to data base.

import mongoose from "mongoose";
import { DB_NAME } from "../constant.js";

//Below Api connects to database;

const connectDb = async () => {

console.log(process.env.MONGODB_URI)
    try {
        
      const  connectionToDb = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
      
      console.log(`Mongo Db Connected: ${connectionToDb.connection.host}`);
        
    } catch (error) {

        console.log(`Error: ${error.message}`);

        process.exit(1)
        
    };
};

export default connectDb;