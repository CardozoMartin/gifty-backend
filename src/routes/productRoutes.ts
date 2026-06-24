import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import {
  getProducts,
  getProductsAdmin,
  getProductBySlug,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  uploadProductImage,
} from '../controllers/ProductController';
import { requireAuth } from '../middlewares/authMiddleware';

const router = Router();

// Configuración de Multer para guardar imágenes en la carpeta /uploads
const almacenamiento = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, path.join(__dirname, '../../uploads'));
  },
  filename: (_req, file, cb) => {
    const nombreUnico = `${Date.now()}-${file.originalname.replace(/\s/g, '_')}`;
    cb(null, nombreUnico);
  },
});

// Solo aceptamos imágenes (jpg, png, webp)
const upload = multer({
  storage: almacenamiento,
  fileFilter: (_req, file, cb) => {
    const tiposPermitidos = /jpeg|jpg|png|webp/;
    const esValido = tiposPermitidos.test(path.extname(file.originalname).toLowerCase());
    if (esValido) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten imágenes JPG, PNG o WEBP'));
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 },
});

// ─── Rutas públicas (tienda) — sin autenticación ───────────────────────────
router.get('/', getProducts);
router.get('/:slug', getProductBySlug);

// ─── Rutas del panel admin — requieren token válido ────────────────────────
router.get('/admin/todos', requireAuth, getProductsAdmin);
router.get('/admin/:id', requireAuth, getProductById);
router.post('/admin', requireAuth, createProduct);
router.put('/admin/:id', requireAuth, updateProduct);
router.delete('/admin/:id', requireAuth, deleteProduct);
router.post('/admin/:id/imagen', requireAuth, upload.single('imagen'), uploadProductImage);

export default router;
