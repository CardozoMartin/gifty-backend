import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface UserRequest extends Request {
  usuarioId?: string;
  usuarioEmail?: string;
}

export const requireUserAuth = (req: UserRequest, res: Response, next: NextFunction): void => {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    res.status(401).json({ ok: false, mensaje: 'Acceso no autorizado' });
    return;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'jwt_secret_fallback') as { id: string; email: string };
    req.usuarioId = decoded.id;
    req.usuarioEmail = decoded.email;
    next();
  } catch {
    res.status(401).json({ ok: false, mensaje: 'Token inválido o expirado' });
  }
};
