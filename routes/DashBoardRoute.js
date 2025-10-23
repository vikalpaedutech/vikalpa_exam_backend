const express = require('express');
const DashBoardRoute = express();
const DashBoardController = require('../controllers/DashBoardController');

DashBoardRoute.get('/Dashboard-8', DashBoardController.GetDataFor8Dashboard);
DashBoardRoute.get('/Dashboard-10', DashBoardController.GetDataFor10Dashboard);
DashBoardRoute.get('/Students-data/:srn?/:isRegisteredBy?/:isVerified?/:grade?/:district?/:block?/:school?/:isQualifiedL1?/:isQualifiedL2?/:isQualifiedL3?/:L1examinationCenter?/:L2examinationCenter?/:L3examinationCenter?/:attendancePdf?/:admitCard1?/:Level3StudentsRoomNumber?', DashBoardController.GetAllStudentData);
//DashBoardRoute.get('/Students-data', DashBoardController.GetAllStudentData);
DashBoardRoute.get('/Student-data-roomandbed', DashBoardController.GetAllStudentDataWithRoomAndBedNo);

DashBoardRoute.get('/room-statistics', DashBoardController.GetRoomStatisticsByBatchDivision);



DashBoardRoute.get('/counselling-dash', DashBoardController.GetDataFor8DashboardCounselling);

module.exports = DashBoardRoute;


