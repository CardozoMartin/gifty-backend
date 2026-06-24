import { Router, Request, Response, NextFunction } from 'express';
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
import { upload } from '../middlewares/uploadMiddleware';

const router = Router();

// ─── Rutas públicas (tienda) — sin autenticación ───────────────────────────
router.get('/', getProducts);
router.get('/:slug', getProductBySlug);

// ─── Rutas del panel admin — requieren token válido ────────────────────────
router.get('/admin/todos', requireAuth, getProductsAdmin);
router.get('/admin/:id', requireAuth, getProductById);
router.post('/admin', requireAuth, createProduct);
router.put('/admin/:id', requireAuth, updateProduct);
router.delete('/admin/:id', requireAuth, deleteProduct);
router.post('/admin/:id/imagen', requireAuth, (req: Request, res: Response, next: NextFunction) => {
  upload.single('imagen')(req, res, (err) => {
    if (err) {
      console.error('Error en multer/cloudinary:', JSON.stringify(err, null, 2), err);
      res.status(500).json({ ok: false, mensaje: err.message || JSON.stringify(err) });
      return;
    }
    next();
  });
}, uploadProductImage);

export default router;
