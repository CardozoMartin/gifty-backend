import { Router } from 'express';
import {
  getOrders,
  getOrderById,
  createOrder,
  updateOrderStatus,
  getMisPedidos,
} from '../controllers/OrderController';
import { requireAuth } from '../middlewares/authMiddleware';
import { requireUserAuth } from '../middlewares/userAuthMiddleware';

const router = Router();

// ─── Ruta pública — el cliente crea su pedido sin autenticación ────────────
router.post('/', createOrder);

// ─── Ruta del cliente logueado — sus propios pedidos ──────────────────────
router.get('/mis-pedidos', requireUserAuth, getMisPedidos);

// ─── Rutas del panel admin — requieren token válido ────────────────────────
router.get('/admin', requireAuth, getOrders);
router.get('/admin/:id', requireAuth, getOrderById);
router.patch('/admin/:id/estado', requireAuth, updateOrderStatus);

export default router;
