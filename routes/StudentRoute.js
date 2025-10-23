require('dotenv').config();

const express = require('express');
const multer = require('multer');
const multerS3 = require('multer-s3');
const bodyParser = require('body-parser');





const path = require('path');

const imageUrlMiddleware = require('../middleware/imageUrlMiddleware');

// Replace aws-sdk with @aws-sdk/client-s3
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

// Create an express instance
const StudentRoute = express();

// Use body parser middleware
StudentRoute.use(bodyParser.json());
StudentRoute.use(bodyParser.urlencoded({ extended: true }));

// Configure DigitalOcean Spaces endpoint
const s3Client = new S3Client({
  endpoint: 'https://blr1.digitaloceanspaces.com',  // Correct endpoint (without bucket name)
  region: process.env.DO_SPACES_REGION,  // Ensure the region is correct (e.g., 'nyc3', 'blr1', etc.)
  credentials: {
    accessKeyId: process.env.DO_SPACES_KEY,
    secretAccessKey: process.env.DO_SPACES_SECRET,
  },
});

// Multer S3 storage configuration
const s3Storage = multerS3({
  s3: s3Client,  // Use s3Client from the updated SDK
  bucket: 'vikalpaexamination',  // Your actual bucket name
  acl: 'public-read',  // Permissions
  contentType: multerS3.AUTO_CONTENT_TYPE,  // Automatically set content type
  key: function (req, file, cb) {
    const fileName = `postImages/${Date.now()}-${file.originalname}`;  // File path inside the space
    cb(null, fileName);
  },

  
});

// Initialize multer with DigitalOcean Spaces storage
const upload = multer({
  storage: s3Storage,
  limits: { fileSize: 5 * 1024 * 1024 },  // 5MB max file size
}).single('image');

// Import your controller
const StudentController = require('../controllers/StudentController');
const Student = require('../models/StudentModel');

StudentRoute.post('/MB-form', upload, imageUrlMiddleware, StudentController.createPost);
StudentRoute.get('/MB-form/all', StudentController.getPosts);
StudentRoute.delete('/MB-form/delete/:id', StudentController.deletePosts);
StudentRoute.put('/MB-form/updatePostsBySrn/:id', upload, imageUrlMiddleware,  StudentController.updatePostsById);
StudentRoute.get('/MB-form/getPostBySrn/:srn', upload, imageUrlMiddleware,  StudentController.getPostsBySrn);
StudentRoute.patch('/MB-form/patchPostById/:id', upload, imageUrlMiddleware, StudentController.patchPostById);
StudentRoute.patch('/MB-form/patchDownloadAdmitCardById/:id', upload, imageUrlMiddleware, StudentController.patchDownloadAdmitCardById);

StudentRoute.get('/attendance-l3/:srn', StudentController.patchAttendanceById);

StudentRoute.patch('/attendance-l3/:srn', StudentController.patchAttendanceById);

StudentRoute.patch('/counselling-l3/:srn/:district', StudentController.patchCounsellingBySrn);

StudentRoute.patch('/documentation', StudentController.patchCounsellingDocumentationBySrn);


StudentRoute.get("/student-by-token", StudentController.getStudentDataBySrnTokenDistrict);



module.exports = StudentRoute;
