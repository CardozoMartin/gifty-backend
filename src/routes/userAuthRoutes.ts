import { Router } from 'express';
import {
  registro,
  verificarEmail,
  login,
  recuperarPassword,
  resetPassword,
} from '../controllers/UserAuthController';

const router = Router();

router.post('/registro', registro);
router.get('/verificar/:token', verificarEmail);
router.post('/login', login);
router.post('/recuperar-password', recuperarPassword);
router.post('/reset-password/:token', resetPassword);

export default router;
