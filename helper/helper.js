const con = require('../config/db');
let multer = require('multer');
let fs = require('fs-extra');

function asynQuery(query, params) {
    return new Promise((resolve, reject) =>{
        con.query(query, params, (err, result) => {
            if (err) return reject(err);
            resolve(result);
        });
    });
}

function uploadFile() {
    const timestamp = Date.now();
    // console.log(timestamp);
    return imageUpload = multer({
      storage: multer.diskStorage({
        destination: function (req, file, cb) {
          const path = `uploads/${timestamp}`;
          fs.mkdirSync(path, { recursive: true })
          cb(null, path);
        },
        filename: function (req, file, cb) {
          cb(null, Date.now() + '_' + file.originalname);
        }
      }),
      limits: { fileSize: 10000000 },
      fileFilter: function (req, file, cb) {
        if (!file.originalname.match(/\.(jpeg|JPEG|png|PNG)$/)) {
          req.fileValidationError = 'Only image files are allowed!';
          return cb(null, false);
        }
        cb(null, true);
      }
    })
}


module.exports = { asynQuery,uploadFile }