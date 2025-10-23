const mongoose = require('mongoose');
const Student = require('../models/StudentModel');

// Aggregation for 8th Class Dashboard with sorting




const GetDataFor8Dashboard = async (req, res) => {
    try {
        const districts = [
            "Yamunanagar", "Sonipat", "Sirsa", "Rohtak", "Rewari", "Panipat",
            "Panchkula", "Palwal", "Nuh Mewat", "Mahendragarh", "Kurukshetra",
            "Karnal", "Kaithal", "Jind", "Jhajjar", "Hisar", "Gurugram",
            "Fatehabad", "Faridabad", "Charkhi Dadri", "Bhiwani", "Ambala"
        ];

        const blocks = ["Sadhaura","Radaur","Saraswati Nagar","Jagadhri","Chhachhrauli","Bilaspur","Sonipat","Rai","Mundlana","Kharkhoda","Kathura","Gohana","Ganaur","Sirsa","Rania","Odhan","Nathusari Chopta","Ellenabad","Dabwali","Baragudha","Sampla","Rohtak","Meham","Lakhan Majra","Kalanaur","Rewari","Nahar","Khol At Rewari","Jatusana","Bawal","Samalkha","Panipat","Madlauda","Israna","Bapauli","Raipur Rani","Pinjore","Morni Hills","Barwala [Panchkula]","Palwal","Hodal","Hathin","Hassanpur","Taoru","Punhana","Nuh","Nagina","Ferozepur Jhirka","Narnaul","Nangal Choudhary","Mahendragarh","Kanina","Ateli","Thanesar","Shahabad","Pehowa","Ladwa","Babain","Nissing At Chirao","Nilokheri","Karnal","Indri","Gharaunda","Assandh","Siwan","Rajaund","Pundri","Kalayat","Kaithal","Guhla At Cheeka","Uchana","Safidon","Pillu Khera","Narwana","Julana","Jind","Alewa","Salhawas","Matan Hail","Jhajjar","Beri","Bahadurgarh","Uklana","Narnaund","Hisar - II","Hisar - I","Hansi","Bass (Hansi-II)","Barwala Hisar","Agroha","Adampur","Sohna","Pataudi","Gurgaon","Farukh Nagar","Tohana","Ratia","Jakhal","Fatehabad","Bhuna","Bhattu Kalan","Faridabad","Ballabgarh","Dadri","Baund Kalan","Badhra","Tosham","Siwani","Loharu","Kairu","Bhiwani","Behal","Bawani Khera","Shehzadpur","Saha","Naraingarh","Barara","Ambala-II (Cantt)","Ambala-I (City)"]

        const students = await Student.aggregate([
            {
                $match: {
                    isRegisteredBy: { $ne: "" },
                    grade: "8",
                    isVerified: {$ne: "Rejected"},
                    district: { $in: districts }, // Filter for districts in the array
                    block: { $in: blocks }       // Filter for blocks in the array
                }
            },
            {
                $group: {
                    _id: {
                        district: "$district",
                        block: "$block",
                        school: "$school"
                    },
                    count: { 
                        $sum: {
                            $cond: [
                                { $eq: ["$schoolCode", "zero"] },
                                0, // If schoolCode is "ZERO", count as zero
                                1  // Otherwise, count normally
                            ]
                        }
                    },
                    admitCardCount: { $sum: { $cond: ["$admitCard1", 1, 0] } },
                    admitCardCount2: { $sum: { $cond: ["$admitCard2", 1, 0] } },
                    admitCardCount3: { $sum: { $cond: ["$admitCard3", 1, 0] } },
                    resultStatusCount1: { $sum: { $cond: ["$resultStatus1", 1, 0] } },
                    resultStatusCount2: { $sum: { $cond: ["$resultStatus2", 1, 0] } },
                    resultStatusCount3: { $sum: { $cond: ["$resultStatus3", 1, 0] } },
                    qualifiedCount1: { $sum: { $cond: ["$isQualifiedL1", 1, 0] } },
                    qualifiedCount2: { $sum: { $cond: ["$isQualifiedL2", 1, 0] } },
                    qualifiedCount3: { $sum: { $cond: ["$isQualifiedL3", 1, 0] } }
                }
            },
            {
                $sort: { "_id.school": 1, count: -1 }
            },
            {
                $group: {
                    _id: {
                        district: "$_id.district",
                        block: "$_id.block"
                    },
                    schools: {
                        $push: {
                            school: "$_id.school",
                            count: "$count",
                            admitCardCount: "$admitCardCount",
                            admitCardCount2: "$admitCardCount2",
                            admitCardCount3: "$admitCardCount3",
                            resultStatusCount1: "$resultStatusCount1",
                            resultStatusCount2: "$resultStatusCount2",
                            resultStatusCount3: "$resultStatusCount3",
                            qualifiedCount1: "$qualifiedCount1",
                            qualifiedCount2: "$qualifiedCount2",
                            qualifiedCount3: "$qualifiedCount3"
                        }
                    },
                    blockCount: { $sum: "$count" },
                    totalAdmitCardCount: { $sum: "$admitCardCount" },
                    totalAdmitCardCount2: { $sum: "$admitCardCount2" },
                    totalAdmitCardCount3: { $sum: "$admitCardCount3" },
                    totalResultStatusCount1: { $sum: "$resultStatusCount1" },
                    totalResultStatusCount2: { $sum: "$resultStatusCount2" },
                    totalResultStatusCount3: { $sum: "$resultStatusCount3" },
                    totalQualifiedCount1: { $sum: "$qualifiedCount1" },
                    totalQualifiedCount2: { $sum: "$qualifiedCount2" },
                    totalQualifiedCount3: { $sum: "$qualifiedCount3" }
                }
            },
            {
                $sort: { "_id.block": 1, blockCount: -1 }
            },
            {
                $group: {
                    _id: "$_id.district",
                    blocks: {
                        $push: {
                            block: "$_id.block",
                            blockCount: "$blockCount",
                            schools: "$schools",
                            totalAdmitCardCount: "$totalAdmitCardCount",
                            totalAdmitCardCount2: "$totalAdmitCardCount2",
                            totalAdmitCardCount3: "$totalAdmitCardCount3",
                            totalResultStatusCount1: "$totalResultStatusCount1",
                            totalResultStatusCount2: "$totalResultStatusCount2",
                            totalResultStatusCount3: "$totalResultStatusCount3",
                            totalQualifiedCount1: "$totalQualifiedCount1",
                            totalQualifiedCount2: "$totalQualifiedCount2",
                            totalQualifiedCount3: "$totalQualifiedCount3"
                        }
                    },
                    districtCount: { $sum: "$blockCount" },
                    totalAdmitCardCount: { $sum: "$totalAdmitCardCount" },
                    totalAdmitCardCount2: { $sum: "$totalAdmitCardCount2" },
                    totalAdmitCardCount3: { $sum: "$totalAdmitCardCount3" },
                    totalResultStatusCount1: { $sum: "$totalResultStatusCount1" },
                    totalResultStatusCount2: { $sum: "$totalResultStatusCount2" },
                    totalResultStatusCount3: { $sum: "$totalResultStatusCount3" },
                    totalQualifiedCount1: { $sum: "$totalQualifiedCount1" },
                    totalQualifiedCount2: { $sum: "$totalQualifiedCount2" },
                    totalQualifiedCount3: { $sum: "$totalQualifiedCount3" }
                }
            },
            {
                $sort: { districtCount: -1 }
            },
            {
                $project: {
                    _id: 0,
                    district: "$_id",
                    districtCount: 1,
                    blocks: 1,
                    totalAdmitCardCount: 1,
                    totalAdmitCardCount2: 1,
                    totalAdmitCardCount3: 1,
                    totalResultStatusCount1: 1,
                    totalResultStatusCount2: 1,
                    totalResultStatusCount3: 1,
                    totalQualifiedCount1: 1,
                    totalQualifiedCount2: 1,
                    totalQualifiedCount3: 1
                }
            }
        ]);

        res.status(200).json(students);

    } catch (error) {
        console.error("Error in GetDataFor8Dashboard:", error);
        res.status(500).json({ message: "Error fetching dashboard data", error });
    }
};





// Repeat the same structure with sorting for 10th Class Dashboard
const GetDataFor10Dashboard = async (req, res) => {
    try {
        const districts = [
            "Yamunanagar", "Sonipat", "Sirsa", "Rohtak", "Rewari", "Panipat",
            "Panchkula", "Palwal", "Nuh Mewat", "Mahendragarh", "Kurukshetra",
            "Karnal", "Kaithal", "Jind", "Jhajjar", "Hisar", "Gurugram",
            "Fatehabad", "Faridabad", "Charkhi Dadri", "Bhiwani", "Ambala"
        ];

        const blocks = ["Sadhaura","Radaur","Saraswati Nagar","Jagadhri","Chhachhrauli","Bilaspur","Sonipat","Rai","Mundlana","Kharkhoda","Kathura","Gohana","Ganaur","Sirsa","Rania","Odhan","Nathusari Chopta","Ellenabad","Dabwali","Baragudha","Sampla","Rohtak","Meham","Lakhan Majra","Kalanaur","Rewari","Nahar","Khol At Rewari","Jatusana","Bawal","Samalkha","Panipat","Madlauda","Israna","Bapauli","Raipur Rani","Pinjore","Morni Hills","Barwala [Panchkula]","Palwal","Hodal","Hathin","Hassanpur","Taoru","Punhana","Nuh","Nagina","Ferozepur Jhirka","Narnaul","Nangal Choudhary","Mahendragarh","Kanina","Ateli","Thanesar","Shahabad","Pehowa","Ladwa","Babain","Nissing At Chirao","Nilokheri","Karnal","Indri","Gharaunda","Assandh","Siwan","Rajaund","Pundri","Kalayat","Kaithal","Guhla At Cheeka","Uchana","Safidon","Pillu Khera","Narwana","Julana","Jind","Alewa","Salhawas","Matan Hail","Jhajjar","Beri","Bahadurgarh","Uklana","Narnaund","Hisar - II","Hisar - I","Hansi","Bass (Hansi-II)","Barwala Hisar","Agroha","Adampur","Sohna","Pataudi","Gurgaon","Farukh Nagar","Tohana","Ratia","Jakhal","Fatehabad","Bhuna","Bhattu Kalan","Faridabad","Ballabgarh","Dadri","Baund Kalan","Badhra","Tosham","Siwani","Loharu","Kairu","Bhiwani","Behal","Bawani Khera","Shehzadpur","Saha","Naraingarh","Barara","Ambala-II (Cantt)","Ambala-I (City)"]

        const students = await Student.aggregate([
            {
                $match: {
                    isRegisteredBy: { $ne: "" },
                    grade: "10",
                    isVerified: {$ne: "Rejected"},
                    district: { $in: districts }, // Filter for districts in the array
                    block: { $in: blocks }       // Filter for blocks in the array
                }
            },
            {
                $group: {
                    _id: {
                        district: "$district",
                        block: "$block",
                        school: "$school"
                    },
                    count: { 
                        $sum: {
                            $cond: [
                                { $eq: ["$schoolCode", "zero"] },
                                0, // If schoolCode is "ZERO", count as zero
                                1  // Otherwise, count normally
                            ]
                        }
                    },
                    admitCardCount: { $sum: { $cond: ["$admitCard1", 1, 0] } },
                    admitCardCount2: { $sum: { $cond: ["$admitCard2", 1, 0] } },
                    admitCardCount3: { $sum: { $cond: ["$admitCard3", 1, 0] } },
                    resultStatusCount1: { $sum: { $cond: ["$resultStatus1", 1, 0] } },
                    resultStatusCount2: { $sum: { $cond: ["$resultStatus2", 1, 0] } },
                    resultStatusCount3: { $sum: { $cond: ["$resultStatus3", 1, 0] } },
                    qualifiedCount1: { $sum: { $cond: ["$isQualifiedL1", 1, 0] } },
                    qualifiedCount2: { $sum: { $cond: ["$isQualifiedL2", 1, 0] } },
                    qualifiedCount3: { $sum: { $cond: ["$isQualifiedL3", 1, 0] } }
                }
            },
            {
                $sort: { "_id.school": 1, count: -1 }
            },
            {
                $group: {
                    _id: {
                        district: "$_id.district",
                        block: "$_id.block"
                    },
                    schools: {
                        $push: {
                            school: "$_id.school",
                            count: "$count",
                            admitCardCount: "$admitCardCount",
                            admitCardCount2: "$admitCardCount2",
                            admitCardCount3: "$admitCardCount3",
                            resultStatusCount1: "$resultStatusCount1",
                            resultStatusCount2: "$resultStatusCount2",
                            resultStatusCount3: "$resultStatusCount3",
                            qualifiedCount1: "$qualifiedCount1",
                            qualifiedCount2: "$qualifiedCount2",
                            qualifiedCount3: "$qualifiedCount3"
                        }
                    },
                    blockCount: { $sum: "$count" },
                    totalAdmitCardCount: { $sum: "$admitCardCount" },
                    totalAdmitCardCount2: { $sum: "$admitCardCount2" },
                    totalAdmitCardCount3: { $sum: "$admitCardCount3" },
                    totalResultStatusCount1: { $sum: "$resultStatusCount1" },
                    totalResultStatusCount2: { $sum: "$resultStatusCount2" },
                    totalResultStatusCount3: { $sum: "$resultStatusCount3" },
                    totalQualifiedCount1: { $sum: "$qualifiedCount1" },
                    totalQualifiedCount2: { $sum: "$qualifiedCount2" },
                    totalQualifiedCount3: { $sum: "$qualifiedCount3" }
                }
            },
            {
                $sort: { "_id.block": 1, blockCount: -1 }
            },
            {
                $group: {
                    _id: "$_id.district",
                    blocks: {
                        $push: {
                            block: "$_id.block",
                            blockCount: "$blockCount",
                            schools: "$schools",
                            totalAdmitCardCount: "$totalAdmitCardCount",
                            totalAdmitCardCount2: "$totalAdmitCardCount2",
                            totalAdmitCardCount3: "$totalAdmitCardCount3",
                            totalResultStatusCount1: "$totalResultStatusCount1",
                            totalResultStatusCount2: "$totalResultStatusCount2",
                            totalResultStatusCount3: "$totalResultStatusCount3",
                            totalQualifiedCount1: "$totalQualifiedCount1",
                            totalQualifiedCount2: "$totalQualifiedCount2",
                            totalQualifiedCount3: "$totalQualifiedCount3"
                        }
                    },
                    districtCount: { $sum: "$blockCount" },
                    totalAdmitCardCount: { $sum: "$totalAdmitCardCount" },
                    totalAdmitCardCount2: { $sum: "$totalAdmitCardCount2" },
                    totalAdmitCardCount3: { $sum: "$totalAdmitCardCount3" },
                    totalResultStatusCount1: { $sum: "$totalResultStatusCount1" },
                    totalResultStatusCount2: { $sum: "$totalResultStatusCount2" },
                    totalResultStatusCount3: { $sum: "$totalResultStatusCount3" },
                    totalQualifiedCount1: { $sum: "$totalQualifiedCount1" },
                    totalQualifiedCount2: { $sum: "$totalQualifiedCount2" },
                    totalQualifiedCount3: { $sum: "$totalQualifiedCount3" }
                }
            },
            {
                $sort: { districtCount: -1 }
            },
            {
                $project: {
                    _id: 0,
                    district: "$_id",
                    districtCount: 1,
                    blocks: 1,
                    totalAdmitCardCount: 1,
                    totalAdmitCardCount2: 1,
                    totalAdmitCardCount3: 1,
                    totalResultStatusCount1: 1,
                    totalResultStatusCount2: 1,
                    totalResultStatusCount3: 1,
                    totalQualifiedCount1: 1,
                    totalQualifiedCount2: 1,
                    totalQualifiedCount3: 1
                }
            }
        ]);

        res.status(200).json(students);

    } catch (error) {
        console.error("Error in GetDataFor8Dashboard:", error);
        res.status(500).json({ message: "Error fetching dashboard data", error });
    }
};


//Below query is the GetAll Student API...
// This api fetches all the data from the db. And used in dashboards.

//______________________________________________________________________________


const GetAllStudentData = async (req, res) => {
  
    try {
        console.log('i am inside try block')
        // Extract query parameters
        // const { srn, isRegisteredBy, isVerified, grade, district, block, school, name, father, isQualifiedL1,  L1examinationCenter, L2examinationCenter, admitCard1, attendancePdf } = req.query;

        // below updated
        const { srn, isRegisteredBy, isVerified, grade, district, block, school, name, father, isQualifiedL1, isQualifiedL2, isQualifiedL3, L1examinationCenter, L2examinationCenter, L3examinationCenter,  admitCard1, attendancePdf, Level3StudentsRoomNumber, super100L2ExamBatchDivision, gender, roomNo, isPresentInL2Examination, counsellingAttendance, finalShortListOrWaitListStudents, isPresentInL3Examination} = req.query;

        // Construct query object
        const query = {};
        if (srn) query.srn = srn;
        if (isRegisteredBy) query.isRegisteredBy = isRegisteredBy;
        if (isVerified) query.isVerified = isVerified;
        if (grade) query.grade = grade;
        if (district) query.district = district;
        if (block) query.block = block;
        if (school) query.school = school;
        if (name) query.name = name;
        if (father) query.father = father;
        if (L1examinationCenter) query.L1examinationCenter = L1examinationCenter;
        if (admitCard1) query.admitCard1 = admitCard1;
        if (isQualifiedL1) query.isQualifiedL1 = isQualifiedL1;
        if (isQualifiedL2) query.isQualifiedL2 = isQualifiedL2;
        if (isQualifiedL3) query.isQualifiedL3 = isQualifiedL3;
        if (L2examinationCenter) query.L2examinationCenter = L2examinationCenter;
        if (L3examinationCenter) query.L3examinationCenter = L3examinationCenter;
        if (attendancePdf) query.attendancePdf = attendancePdf;
        if (Level3StudentsRoomNumber) query.Level3StudentsRoomNumber = Level3StudentsRoomNumber;
        if (super100L2ExamBatchDivision) query.super100L2ExamBatchDivision = super100L2ExamBatchDivision;
        if (gender) query.gender = gender;
        if (roomNo) query.roomNo = roomNo;
        if (isPresentInL2Examination) query.isPresentInL2Examination = isPresentInL2Examination;
        if (counsellingAttendance) query.counsellingAttendance = counsellingAttendance;
        if (finalShortListOrWaitListStudents) query.finalShortListOrWaitListStudents = finalShortListOrWaitListStudents;
        if (isPresentInL3Examination) query.isPresentInL3Examination = isPresentInL3Examination;
        console.log("Querying with:", query); // Added log for debugging
        

        // Execute query
        const students = await Student.find(query);

        // If no students found, return a 404
        if (students.length === 0) {
            return res.status(404).json({ message: 'No student found' });
        }

        // Send all matched students
        res.status(200).json(students);
        // console.log(students)
        
        //console.log(students)
    } catch (error) {

        console.log('i am inside catch block')

        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};


//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^


//Apit to get data with room and bed number
const GetAllStudentDataWithRoomAndBedNo = async (req, res) => {
    try {
        console.log('i am inside try block');
        // Extract query parameters
        const { 
            srn, isRegisteredBy, isVerified, grade, district, block, school, 
            name, father, isQualifiedL1, isQualifiedL2, isQualifiedL3, 
            L1examinationCenter, L2examinationCenter, L3examinationCenter,  
            admitCard1, attendancePdf, Level3StudentsRoomNumber, 
            super100L2ExamBatchDivision, gender, roomNo 
        } = req.query;

        // Construct query object
        const query = {};
        if (srn) query.srn = srn;
        if (isRegisteredBy) query.isRegisteredBy = isRegisteredBy;
        if (isVerified) query.isVerified = isVerified;
        if (grade) query.grade = grade;
        if (district) query.district = district;
        if (block) query.block = block;
        if (school) query.school = school;
        if (name) query.name = name;
        if (father) query.father = father;
        if (L1examinationCenter) query.L1examinationCenter = L1examinationCenter;
        if (admitCard1) query.admitCard1 = admitCard1;
        if (isQualifiedL1) query.isQualifiedL1 = isQualifiedL1;
        if (isQualifiedL2) query.isQualifiedL2 = isQualifiedL2;
        if (isQualifiedL3) query.isQualifiedL3 = isQualifiedL3;
        if (L2examinationCenter) query.L2examinationCenter = L2examinationCenter;
        if (L3examinationCenter) query.L3examinationCenter = L3examinationCenter;
        if (attendancePdf) query.attendancePdf = attendancePdf;
        if (Level3StudentsRoomNumber) query.Level3StudentsRoomNumber = Level3StudentsRoomNumber;
        if (super100L2ExamBatchDivision) query.super100L2ExamBatchDivision = super100L2ExamBatchDivision;
        if (gender) query.gender = gender;
        if (roomNo) query.roomNo = roomNo;

        // console.log("Querying with:", query);

        // Execute query to get students
        const students = await Student.find(query);

        // If no students found, return a 404
        if (students.length === 0) {
            return res.status(404).json({ 
                message: 'No student found',
                data: [],
                roomStatistics: {
                    male: [],
                    female: []
                }
            });
        }

        // Get gender-wise room statistics
        const roomStats = await Student.aggregate([
            { $match: query }, // Apply the same filters
            { 
                $group: {
                    _id: {
                        roomNo: "$roomNo",
                        gender: "$gender"
                    },
                    count: { $sum: 1 }
                }
            },
            { 
                $project: {
                    roomNo: "$_id.roomNo",
                    gender: "$_id.gender",
                    count: 1,
                    _id: 0
                }
            },
            { $sort: { roomNo: 1 } }
        ]);

        // Organize results by gender
        const genderWiseRoomStats = {
            male: roomStats.filter(stat => stat.gender === 'Male' && stat.roomNo),
            female: roomStats.filter(stat => stat.gender === 'Female' && stat.roomNo)
        };

        // Send response with both students and room statistics
        res.status(200).json({
            message: 'Students retrieved successfully',
            data: students,
            roomStatistics: genderWiseRoomStats
        });

       // console.log(students);
    } catch (error) {
        console.log('i am inside catch block');
        console.error(error);
        res.status(500).json({ 
            message: 'Server error',
            error: error.message 
        });
    }
};



//Room stats
const GetRoomStatisticsByBatchDivision = async (req, res) => {
    try {
        // Extract query parameters
        const { super100L2ExamBatchDivision } = req.query;

        // Construct query object
        const query = {};
        if (super100L2ExamBatchDivision) {
            query.super100L2ExamBatchDivision = super100L2ExamBatchDivision;
        }

        // Fetch room statistics
        const roomStats = await Student.aggregate([
            { $match: query }, // Apply the batch division filter
            { 
                $group: {
                    _id: {
                        roomNo: "$roomNo",
                        gender: "$gender"
                    },
                    count: { $sum: 1 }
                }
            },
            { 
                $project: {
                    roomNo: "$_id.roomNo",
                    gender: "$_id.gender",
                    count: 1,
                    _id: 0
                }
            },
            { $sort: { roomNo: 1 } }
        ]);

        // Organize results by gender
        const genderWiseRoomStats = {
            male: roomStats.filter(stat => stat.gender === 'Male' && stat.roomNo),
            female: roomStats.filter(stat => stat.gender === 'Female' && stat.roomNo)
        };

        // Return the room statistics
        res.status(200).json({
            message: 'Room statistics retrieved successfully',
            roomStatistics: genderWiseRoomStats
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'Server error',
            error: error.message
        });
    }
};




//Counselling dashboard MB

// const GetDataFor8DashboardCounselling = async (req, res) => {
//     try {
//         const districts = [
//             "Yamunanagar", "Sonipat", "Sirsa", "Rohtak", "Rewari", "Panipat",
//             "Panchkula", "Palwal", "Nuh Mewat", "Mahendragarh", "Kurukshetra",
//             "Karnal", "Kaithal", "Jind", "Jhajjar", "Hisar", "Gurugram",
//             "Fatehabad", "Faridabad", "Charkhi Dadri", "Bhiwani", "Ambala"
//         ];

//         const blocks = ["Sadhaura","Radaur","Saraswati Nagar","Jagadhri","Chhachhrauli","Bilaspur","Sonipat","Rai","Mundlana","Kharkhoda","Kathura","Gohana","Ganaur","Sirsa","Rania","Odhan","Nathusari Chopta","Ellenabad","Dabwali","Baragudha","Sampla","Rohtak","Meham","Lakhan Majra","Kalanaur","Rewari","Nahar","Khol At Rewari","Jatusana","Bawal","Samalkha","Panipat","Madlauda","Israna","Bapauli","Raipur Rani","Pinjore","Morni Hills","Barwala [Panchkula]","Palwal","Hodal","Hathin","Hassanpur","Taoru","Punhana","Nuh","Nagina","Ferozepur Jhirka","Narnaul","Nangal Choudhary","Mahendragarh","Kanina","Ateli","Thanesar","Shahabad","Pehowa","Ladwa","Babain","Nissing At Chirao","Nilokheri","Karnal","Indri","Gharaunda","Assandh","Siwan","Rajaund","Pundri","Kalayat","Kaithal","Guhla At Cheeka","Uchana","Safidon","Pillu Khera","Narwana","Julana","Jind","Alewa","Salhawas","Matan Hail","Jhajjar","Beri","Bahadurgarh","Uklana","Narnaund","Hisar - II","Hisar - I","Hansi","Bass (Hansi-II)","Barwala Hisar","Agroha","Adampur","Sohna","Pataudi","Gurgaon","Farukh Nagar","Tohana","Ratia","Jakhal","Fatehabad","Bhuna","Bhattu Kalan","Faridabad","Ballabgarh","Dadri","Baund Kalan","Badhra","Tosham","Siwani","Loharu","Kairu","Bhiwani","Behal","Bawani Khera","Shehzadpur","Saha","Naraingarh","Barara","Ambala-II (Cantt)","Ambala-I (City)"]

//         const students = await Student.aggregate([
//             {
//                 $match: {
//                     finalShortListOrWaitListStudents: { $ne: "" },
//                     grade: "8",
//                     isVerified: {$ne: "Rejected"},
//                     district: { $in: districts }, // Filter for districts in the array
//                     block: { $in: blocks }       // Filter for blocks in the array
//                 }
//             },
//             {
//                 $group: {
//                     _id: {
//                         district: "$district",
//                         block: "$block",
//                         school: "$school"
//                     },
//                     count: { 
//                         $sum: {
//                             $cond: [
//                                 { $eq: ["$schoolCode", "zero"] },
//                                 0, // If schoolCode is "ZERO", count as zero
//                                 1  // Otherwise, count normally
//                             ]
//                         }
//                     },
//                     admitCardCount: { $sum: { $cond: ["$admitCard1", 1, 0] } },
//                     admitCardCount2: { $sum: { $cond: ["$admitCard2", 1, 0] } },
//                     admitCardCount3: { $sum: { $cond: ["$admitCard3", 1, 0] } },
//                     resultStatusCount1: { $sum: { $cond: ["$resultStatus1", 1, 0] } },
//                     resultStatusCount2: { $sum: { $cond: ["$resultStatus2", 1, 0] } },
//                     resultStatusCount3: { $sum: { $cond: ["$resultStatus3", 1, 0] } },
//                     qualifiedCount1: { $sum: { $cond: ["$isQualifiedL1", 1, 0] } },
//                     qualifiedCount2: { $sum: { $cond: ["$isQualifiedL2", 1, 0] } },
//                     qualifiedCount3: { $sum: { $cond: ["$isQualifiedL3", 1, 0] } },

//                 }
//             },
//             {
//                 $sort: { "_id.school": 1, count: -1 }
//             },
//             {
//                 $group: {
//                     _id: {
//                         district: "$_id.district",
//                         block: "$_id.block"
//                     },
//                     schools: {
//                         $push: {
//                             school: "$_id.school",
//                             count: "$count",
//                             admitCardCount: "$admitCardCount",
//                             admitCardCount2: "$admitCardCount2",
//                             admitCardCount3: "$admitCardCount3",
//                             resultStatusCount1: "$resultStatusCount1",
//                             resultStatusCount2: "$resultStatusCount2",
//                             resultStatusCount3: "$resultStatusCount3",
//                             qualifiedCount1: "$qualifiedCount1",
//                             qualifiedCount2: "$qualifiedCount2",
//                             qualifiedCount3: "$qualifiedCount3"
//                         }
//                     },
//                     blockCount: { $sum: "$count" },
//                     totalAdmitCardCount: { $sum: "$admitCardCount" },
//                     totalAdmitCardCount2: { $sum: "$admitCardCount2" },
//                     totalAdmitCardCount3: { $sum: "$admitCardCount3" },
//                     totalResultStatusCount1: { $sum: "$resultStatusCount1" },
//                     totalResultStatusCount2: { $sum: "$resultStatusCount2" },
//                     totalResultStatusCount3: { $sum: "$resultStatusCount3" },
//                     totalQualifiedCount1: { $sum: "$qualifiedCount1" },
//                     totalQualifiedCount2: { $sum: "$qualifiedCount2" },
//                     totalQualifiedCount3: { $sum: "$qualifiedCount3" }
//                 }
//             },
//             {
//                 $sort: { "_id.block": 1, blockCount: -1 }
//             },
//             {
//                 $group: {
//                     _id: "$_id.district",
//                     blocks: {
//                         $push: {
//                             block: "$_id.block",
//                             blockCount: "$blockCount",
//                             schools: "$schools",
//                             totalAdmitCardCount: "$totalAdmitCardCount",
//                             totalAdmitCardCount2: "$totalAdmitCardCount2",
//                             totalAdmitCardCount3: "$totalAdmitCardCount3",
//                             totalResultStatusCount1: "$totalResultStatusCount1",
//                             totalResultStatusCount2: "$totalResultStatusCount2",
//                             totalResultStatusCount3: "$totalResultStatusCount3",
//                             totalQualifiedCount1: "$totalQualifiedCount1",
//                             totalQualifiedCount2: "$totalQualifiedCount2",
//                             totalQualifiedCount3: "$totalQualifiedCount3"
//                         }
//                     },
//                     districtCount: { $sum: "$blockCount" },
//                     totalAdmitCardCount: { $sum: "$totalAdmitCardCount" },
//                     totalAdmitCardCount2: { $sum: "$totalAdmitCardCount2" },
//                     totalAdmitCardCount3: { $sum: "$totalAdmitCardCount3" },
//                     totalResultStatusCount1: { $sum: "$totalResultStatusCount1" },
//                     totalResultStatusCount2: { $sum: "$totalResultStatusCount2" },
//                     totalResultStatusCount3: { $sum: "$totalResultStatusCount3" },
//                     totalQualifiedCount1: { $sum: "$totalQualifiedCount1" },
//                     totalQualifiedCount2: { $sum: "$totalQualifiedCount2" },
//                     totalQualifiedCount3: { $sum: "$totalQualifiedCount3" }
//                 }
//             },
//             {
//                 $sort: { districtCount: -1 }
//             },
//             {
//                 $project: {
//                     _id: 0,
//                     district: "$_id",
//                     districtCount: 1,
//                     blocks: 1,
//                     totalAdmitCardCount: 1,
//                     totalAdmitCardCount2: 1,
//                     totalAdmitCardCount3: 1,
//                     totalResultStatusCount1: 1,
//                     totalResultStatusCount2: 1,
//                     totalResultStatusCount3: 1,
//                     totalQualifiedCount1: 1,
//                     totalQualifiedCount2: 1,
//                     totalQualifiedCount3: 1
//                 }
//             }
//         ]);

//         res.status(200).json(students);

//     } catch (error) {
//         console.error("Error in GetDataFor8Dashboard:", error);
//         res.status(500).json({ message: "Error fetching dashboard data", error });
//     }
// };




// const GetDataFor8DashboardCounselling = async (req, res) => {
//     try {
//         const students = await Student.aggregate([
//             {
//                 $match: {
//                     grade: "8",
//                     isVerified: { $ne: "Rejected" },
//                     finalShortListOrWaitListStudents: { $in: ["Selected", "Waiting"] }
//                 }
//             },
//             {
//                 $group: {
//                     _id: {
//                         district: "$district",
//                         counsellingCenterAllocation: "$counsellingCenterAllocation"
//                     },
//                     totalStudents: { $sum: 1 },
//                     enrolledCount: {
//                         $sum: {
//                             $cond: [{ $eq: ["$admissionStatus", "Enrolled"] }, 1, 0]
//                         }
//                     },
//                     provisionCount: {
//                         $sum: {
//                             $cond: [{ $eq: ["$admissionStatus", "Provision"] }, 1, 0]
//                         }
//                     },
//                     selectedCount: {
//                         $sum: {
//                             $cond: [{ $eq: ["$finalShortListOrWaitListStudents", "Selected"] }, 1, 0]
//                         }
//                     },
//                     waitingCount: {
//                         $sum: {
//                             $cond: [{ $eq: ["$finalShortListOrWaitListStudents", "Waiting"] }, 1, 0]
//                         }
//                     }
//                 }
//             },
//             {
//                 $group: {
//                     _id: "$_id.district",
//                     centers: {
//                         $push: {
//                             counsellingCenterAllocation: "$_id.counsellingCenterAllocation",
//                             totalStudents: "$totalStudents",
//                             enrolledCount: "$enrolledCount",
//                             provisionCount: "$provisionCount",
//                             selectedCount: "$selectedCount",
//                             waitingCount: "$waitingCount"
//                         }
//                     },
//                     districtTotal: { $sum: "$totalStudents" },
//                     totalEnrolled: { $sum: "$enrolledCount" },
//                     totalProvision: { $sum: "$provisionCount" },
//                     totalSelected: { $sum: "$selectedCount" },
//                     totalWaiting: { $sum: "$waitingCount" }
//                 }
//             },
//             {
//                 $project: {
//                     _id: 0,
//                     district: "$_id",
//                     districtTotal: 1,
//                     totalEnrolled: 1,
//                     totalProvision: 1,
//                     totalSelected: 1,
//                     totalWaiting: 1,
//                     centers: 1
//                 }
//             },
//             {
//                 $sort: { district: 1 }
//             }
//         ]);

//         res.status(200).json(students);
//     } catch (error) {
//         console.error("Error in GetDataFor8DashboardCounselling:", error);
//         res.status(500).json({ message: "Error fetching counselling dashboard data", error });
//     }
// };





const GetDataFor8DashboardCounselling = async (req, res) => {
    try {
        const students = await Student.aggregate([
            {
                $match: {
                    grade: "8",
                    isVerified: { $ne: "Rejected" },
                    finalShortListOrWaitListStudents: { $in: ["Selected", "Waiting"] }
                }
            },
            {
                $group: {
                    _id: {
                        district: "$district",
                        counsellingCenterAllocation: "$counsellingCenterAllocation"
                    },
                    totalStudents: { $sum: 1 },
                    enrolledCount: {
                        $sum: {
                            $cond: [{ $eq: ["$admissionStatus", "Enrolled"] }, 1, 0]
                        }
                    },
                    provisionCount: {
                        $sum: {
                            $cond: [{ $eq: ["$admissionStatus", "Provision"] }, 1, 0]
                        }
                    },
                    selectedCount: {
                        $sum: {
                            $cond: [{ $eq: ["$finalShortListOrWaitListStudents", "Selected"] }, 1, 0]
                        }
                    },
                    waitingCount: {
                        $sum: {
                            $cond: [{ $eq: ["$finalShortListOrWaitListStudents", "Waiting"] }, 1, 0]
                        }
                    },
                    counsellingPresentCount: {
                        $sum: {
                            $cond: [{ $eq: ["$counsellingAttendance", true] }, 1, 0]
                        }
                    },
                    counsellingAbsentCount: {
                        $sum: {
                            $cond: [{ $eq: ["$counsellingAttendance", false] }, 1, 0]
                        }
                    }
                }
            },
            {
                $group: {
                    _id: "$_id.district",
                    centers: {
                        $push: {
                            counsellingCenterAllocation: "$_id.counsellingCenterAllocation",
                            totalStudents: "$totalStudents",
                            enrolledCount: "$enrolledCount",
                            provisionCount: "$provisionCount",
                            selectedCount: "$selectedCount",
                            waitingCount: "$waitingCount",
                            counsellingPresentCount: "$counsellingPresentCount",
                            counsellingAbsentCount: "$counsellingAbsentCount"
                        }
                    },
                    districtTotal: { $sum: "$totalStudents" },
                    totalEnrolled: { $sum: "$enrolledCount" },
                    totalProvision: { $sum: "$provisionCount" },
                    totalSelected: { $sum: "$selectedCount" },
                    totalWaiting: { $sum: "$waitingCount" },
                    totalCounsellingPresent: { $sum: "$counsellingPresentCount" },
                    totalCounsellingAbsent: { $sum: "$counsellingAbsentCount" }
                }
            },
            {
                $project: {
                    _id: 0,
                    district: "$_id",
                    districtTotal: 1,
                    totalEnrolled: 1,
                    totalProvision: 1,
                    totalSelected: 1,
                    totalWaiting: 1,
                    totalCounsellingPresent: 1,
                    totalCounsellingAbsent: 1,
                    centers: 1
                }
            },
            {
                $sort: { district: 1 }
            }
        ]);

        res.status(200).json(students);
    } catch (error) {
        console.error("Error in GetDataFor8DashboardCounselling:", error);
        res.status(500).json({ message: "Error fetching counselling dashboard data", error });
    }
};







module.exports = {
    GetDataFor8Dashboard,
    GetDataFor10Dashboard,
    GetAllStudentData,
    GetAllStudentDataWithRoomAndBedNo,
    GetRoomStatisticsByBatchDivision,
    GetDataFor8DashboardCounselling
};
