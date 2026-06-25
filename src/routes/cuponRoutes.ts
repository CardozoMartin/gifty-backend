import { Router } from 'express';
import { requireAuth } from '../middlewares/authMiddleware';
import { optionalUserAuth } from '../middlewares/userAuthMiddleware';
import { listarCupones, crearCupon, editarCupon, eliminarCupon, validarCupon } from '../controllers/CuponController';

const router = Router();

// Público con auth opcional (para verificar un uso por usuario si está logueado)
router.post('/validar', optionalUserAuth, validarCupon);

// Admin
router.get('/', requireAuth, listarCupones);
router.post('/', requireAuth, crearCupon);
router.put('/:id', requireAuth, editarCupon);
router.delete('/:id', requireAuth, eliminarCupon);

export default router;
