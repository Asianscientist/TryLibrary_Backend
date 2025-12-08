// config/multer.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Create upload directories
const uploadDirs = ['uploads/books', 'uploads/covers', 'uploads/temp'];
uploadDirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        if (file.fieldname === 'bookFile') {
            cb(null, 'uploads/books/');
        } else if (file.fieldname === 'coverImage') {
            cb(null, 'uploads/covers/');
        } else {
            cb(null, 'uploads/temp/');
        }
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, uniqueSuffix + ext);
    }
});

const fileFilter = (req, file, cb) => {
    if (file.fieldname === 'bookFile') {
        const allowedTypes = [
            'application/pdf',
            'application/epub+zip',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'text/plain'
        ];

        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid book file type. Only PDF, EPUB, DOCX, TXT allowed.'));
        }
    } else if (file.fieldname === 'coverImage') {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];

        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid cover image type. Only JPG, PNG, WEBP allowed.'));
        }
    } else {
        cb(null, true);
    }
};

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 50 * 1024 * 1024 // 50MB
    },
    fileFilter: fileFilter
});

module.exports = upload;