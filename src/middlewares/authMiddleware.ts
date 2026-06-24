import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../controllers/AuthController';

// Middleware que protege las rutas del admin
// Extrae el token del header Authorization y lo verifica
export const requireAuth = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.replace('Bearer ', '');

  if (!token) {
    res.status(401).json({ ok: false, mensaje: 'Acceso no autorizado — token requerido' });
    return;
  }

  if (!verifyToken(token)) {
    res.status(401).json({ ok: false, mensaje: 'Token inválido o expirado' });
    return;
  }

  // Token válido, continuamos con el handler de la ruta
  next();
};
