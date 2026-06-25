import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface UserRequest extends Request {
  usuarioId?: string;
  usuarioEmail?: string;
}

// Middleware opcional: si hay token lo decodifica, si no hay lo ignora y continúa
export const optionalUserAuth = (req: UserRequest, _res: Response, next: NextFunction): void => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'jwt_secret_fallback') as { id: string; email: string };
      req.usuarioId = decoded.id;
      req.usuarioEmail = decoded.email;
    } catch {
      // Token inválido → continúa sin usuario
    }
  }
  next();
};

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
