const express = require('express');
const multer = require('multer');
const XLSX = require('xlsx');
const Student = require('../models/StudentModel');
const PDFDocument = require('pdfkit'); // Import PDFKit
const { Readable } = require('stream');
const { response } = require('../routes/StudentRoute');
const { serialize } = require('v8');


const upload = multer();

//creating a function that converts number date from excel to proper yyyy-mm-dd format date. cause excel is converting date into number date format.

const convertExcelDateToYYYYMMDD = (serialDate)=>{
    const utcDays = serialDate - 25569; //Excel uses 1900-01-01 as a base date.
    const millisecondsInADay = 86400000; //Number of millisecons in a day
    const date = new Date(utcDays * millisecondsInADay);

    //formatting the date to yyyy-mm-dd.

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); //month is 0-indexed.
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
}



const BulkPost = async (req, res) => {
    try {
        const workbook = XLSX.read(req.file.buffer);
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet); // Read data from the worksheet

        // Extract the mobile number from the request body
        const isRegisteredBy = req.body.isRegisteredBy; // Make sure this is sent from the frontend
        let slipId;

         // Array to hold the saved students
         const savedStudents = [];
         

         //Loop through each student in the JSON data

         for (const student of jsonData) {

            // if (student.dob){
            //     student.dob =  convertExcelDateToYYYYMMDD(student.dob);
            // }
            
            slipId = student.name.slice(0,3) + String(student.srn).slice(0,5)

            const {srn, aadhar} = student; //extract the unq keys
            



            let existingStudent = await Student.findOne({
                $or: [{ srn: srn }, { aadhar: aadhar }]
            });
    
            if (existingStudent) {
    
                //update the existing student's data
                existingStudent = await Student.findByIdAndUpdate(
                    existingStudent._id,
                    {...student, isRegisteredBy, slipId}, //update with new data and isRegisteredBy
                    {new: true} // Return the updated document
                );
            } else {
    
                const newStudent = new Student ({
                    ...student, 
                    isRegisteredBy,
                    slipId
                });
    
                await newStudent.save();
                savedStudents.push({student: newStudent, action: 'Created'});
            }
    
         }

         //Attempt to find a student by 'srn or aadhar'

         

        // Save each student to the database
//         for (const student of jsonData) {
//             const newStudent = new Student({
//                 ...student, // Spread the student data
//                 isRegisteredBy: isRegisteredBy // Include the mobile number
//             });
//             await newStudent.save();
//             savedStudents.push(newStudent);
            
//         }
// //___________________________________________________________________________

        
        res.status(200).json({ success: true, message: 'Students uploaded successfully!',  data: savedStudents });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Failed to upload students.' });
    }
};

module.exports = {
    BulkPost
};
