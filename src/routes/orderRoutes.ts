import { Router } from 'express';
import {
  getOrders,
  getOrderById,
  createOrder,
  updateOrderStatus,
} from '../controllers/OrderController';
import { requireAuth } from '../middlewares/authMiddleware';

const router = Router();

// ─── Ruta pública — el cliente crea su pedido sin autenticación ────────────
router.post('/', createOrder);

// ─── Rutas del panel admin — requieren token válido ────────────────────────
router.get('/admin', requireAuth, getOrders);
router.get('/admin/:id', requireAuth, getOrderById);
router.patch('/admin/:id/estado', requireAuth, updateOrderStatus);

export default router;
