import { Router } from 'express';
import {
  registro,
  verificarEmail,
  login,
  recuperarPassword,
  resetPassword,
  getPerfil,
  updatePerfil,
} from '../controllers/UserAuthController';
import { requireUserAuth } from '../middlewares/userAuthMiddleware';

const router = Router();

router.post('/registro', registro);
router.get('/verificar/:token', verificarEmail);
router.post('/login', login);
router.post('/recuperar-password', recuperarPassword);
router.post('/reset-password/:token', resetPassword);
router.get('/perfil', requireUserAuth, getPerfil);
router.put('/perfil', requireUserAuth, updatePerfil);

export default router;
