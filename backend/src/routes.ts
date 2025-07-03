import express from 'express';
import multer from 'multer';
import path from 'path';
import * as controllers from './controllers';

const router = express.Router();

// Настройка Multer для хранения файлов
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // __dirname - текущая директория (dist), выходим из нее и заходим в uploads
    cb(null, path.join(__dirname, '..', 'uploads'));
  },
  filename: (req, file, cb) => {
    // Генерируем уникальное имя файла
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

// Маршруты API
router.get('/profiles', controllers.getProfiles);
router.post('/profiles', upload.array('media'), controllers.createProfile); // `media` - имя поля в FormData
router.put('/profiles/:id', controllers.updateProfile);
router.delete('/profiles/:id', controllers.deleteProfile);

export default router;