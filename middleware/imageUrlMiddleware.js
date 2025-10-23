
require('dotenv').config();
const path = require('path');

// const imageUrlMiddleware = (req, res, next)=>{
//     if(req.file) {
//         req.body.imageUrl = `${req.protocol}://${req.get('host')}/postimages/${req.file.filename}`;

//     }
//     next();
// };

// module.exports = imageUrlMiddleware

const imageUrlMiddleware = (req, res, next) => {
    if (req.file) {
      req.body.imageUrl = `https://${process.env.DO_SPACES_BUCKET}.${process.env.DO_SPACES_REGION}.digitaloceanspaces.com/${req.file.key}`;
    }
    next();
  };
  
  module.exports = imageUrlMiddleware;




 