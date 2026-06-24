import { Router } from 'express';
import { login, verify } from '../controllers/AuthController';

const router = Router();

// Inicio de sesión del administrador
router.post('/login', login);

// Verificación de token (para que el frontend compruebe si la sesión sigue activa al recargar)
router.post('/verify', verify);

export default router;
