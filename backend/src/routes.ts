import { Router } from 'express';
import multer from 'multer';
import * as controllers from './controllers';

const router = Router();

// Настройка Multer для хранения файлов в памяти.
// Файлы будут переданы в контроллер в виде буферов и загружены в облачное хранилище.
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // Ограничение 10 МБ на файл
});

// Маршруты API
router.get('/profiles', controllers.getProfiles);
router.post('/profiles', upload.array('media', 10), controllers.createProfile); // `media` - имя поля, до 10 файлов
router.put('/profiles/:id', controllers.updateProfile);
router.delete('/profiles/:id', controllers.deleteProfile);

export default router;
