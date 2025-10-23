const express = require('express');
const StudentRoute = express();
const multer = require('multer');
const path = require('path');
const bodyParser = require('body-parser');
const imageUrlMiddleware = require('../middleware/imageUrlMiddleware');


StudentRoute.use(bodyParser.json());
StudentRoute.use(bodyParser.urlencoded({extended:true}));
StudentRoute.use(express.static('public'));

// Multer Storage Configuration
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        const destPath = path.join(__dirname, '../public/postimages');
        cb(null, destPath);
    },
    filename: function(req, file, cb) {
        const name = Date.now() + '-' + file.originalname;
        cb(null, name);
    }
});

// Initialize multer
// const upload = multer({ storage: storage });  //multer setup has been done.


const upload = multer({
    storage: storage,
    // If the file is not provided, Multer will skip the file validation
    limits: { fileSize: 5 * 1024 * 1024 }, // Optional: limit file size to 5MB
}).single('image'); // Replace 'image' with your field name


// require controller

const StudentController = require('../controllers/StudentController');

StudentRoute.post('/MB-form', upload, imageUrlMiddleware, StudentController.createPost);
StudentRoute.get('/MB-form/all', StudentController.getPosts);
StudentRoute.delete('/MB-form/delete/:id', StudentController.deletePosts);
StudentRoute.put('/MB-form/updatePostsBySrn/:id', upload, imageUrlMiddleware,  StudentController.updatePostsById);
StudentRoute.get('/MB-form/getPostBySrn/:srn', upload, imageUrlMiddleware,  StudentController.getPostsBySrn);




module.exports = StudentRoute;
