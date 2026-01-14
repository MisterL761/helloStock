const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const pool = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { writeLog } = require('../middleware/logger');

router.use(authenticate);

const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(7)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({ storage });

router.get('/', async (req, res) => {
  try {
    const [items] = await pool.query(
      "SELECT id, product, supplier, client, photo_path, additional_photos, DATE_FORMAT(date, '%d/%m/%Y') as date, 'Reçu' as status FROM received ORDER BY date DESC"
    );

    items.forEach(item => {
      const photosPaths = [];
      if (item.photo_path) {
        photosPaths.push(item.photo_path);
      }
      if (item.additional_photos) {
        try {
          const additional = JSON.parse(item.additional_photos);
          if (Array.isArray(additional)) {
            photosPaths.push(...additional);
          }
        } catch (e) {}
      }
      item.photos_paths = photosPaths;
      delete item.additional_photos;
    });

    res.json(items);
  } catch (error) {
    writeLog('received_error.log', `Erreur: ${error.message}`);
    res.status(500).json({ error: true, message: error.message });
  }
});

router.post('/', upload.fields([
  { name: 'photo', maxCount: 1 },
  { name: 'additional_photos', maxCount: 10 }
]), async (req, res) => {
  try {
    const { product = 'Commande', supplier = 'Dépôt', client, date = new Date().toISOString().split('T')[0] } = req.body;

    if (!client) {
      throw new Error('Le nom du client est requis.');
    }

    let photoPath = null;
    const additionalPhotos = [];
    const allPhotoPaths = [];

    if (req.files.photo && req.files.photo[0]) {
      photoPath = `uploads/${req.files.photo[0].filename}`;
      allPhotoPaths.push(photoPath);
    }

    if (req.files.additional_photos) {
      req.files.additional_photos.forEach(file => {
        const filePath = `uploads/${file.filename}`;
        additionalPhotos.push(filePath);
        allPhotoPaths.push(filePath);
      });
    }

    const [result] = await pool.query(
      'INSERT INTO received (product, supplier, client, photo_path, additional_photos, date) VALUES (?, ?, ?, ?, ?, ?)',
      [product, supplier, client, photoPath, JSON.stringify(additionalPhotos), date]
    );

    res.json({
      success: true,
      id: result.insertId,
      photo_path: photoPath,
      photos_paths: allPhotoPaths
    });
  } catch (error) {
    writeLog('received_error.log', `Erreur: ${error.message}`);
    res.status(500).json({ error: true, message: error.message });
  }
});

router.put('/', async (req, res) => {
  try {
    const { id, client, product = 'Commande', supplier = 'Dépôt', date = new Date().toISOString().split('T')[0] } = req.body;

    if (!id || !client) {
      throw new Error('ID et Client requis');
    }

    await pool.query(
      'UPDATE received SET product = ?, supplier = ?, client = ?, date = ? WHERE id = ?',
      [product, supplier, client, date, id]
    );

    res.json({ success: true });
  } catch (error) {
    writeLog('received_error.log', `Erreur: ${error.message}`);
    res.status(500).json({ error: true, message: error.message });
  }
});

router.delete('/', async (req, res) => {
  try {
    const id = req.query.id || req.body.id;

    if (!id) {
      throw new Error('ID manquant');
    }

    const [items] = await pool.query(
      'SELECT photo_path, additional_photos FROM received WHERE id = ?',
      [id]
    );

    await pool.query('DELETE FROM received WHERE id = ?', [id]);

    if (items.length > 0) {
      const item = items[0];
      if (item.photo_path) {
        const fullPath = path.join(__dirname, '..', item.photo_path);
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
        }
      }
      if (item.additional_photos) {
        try {
          const additional = JSON.parse(item.additional_photos);
          if (Array.isArray(additional)) {
            additional.forEach(photoPath => {
              const fullPath = path.join(__dirname, '..', photoPath);
              if (fs.existsSync(fullPath)) {
                fs.unlinkSync(fullPath);
              }
            });
          }
        } catch (e) {}
      }
    }

    res.json({ success: true });
  } catch (error) {
    writeLog('received_error.log', `Erreur: ${error.message}`);
    res.status(500).json({ error: true, message: error.message });
  }
});

module.exports = router;
