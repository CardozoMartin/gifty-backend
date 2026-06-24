import { Request, Response } from 'express';
import crypto from 'crypto';

// Genera un token simple firmando usuario + timestamp con ADMIN_SECRET
// No usamos JWT para mantener la dependencia mínima — para una app interna es suficiente
const generateToken = (usuario: string): string => {
  const secreto = process.env.ADMIN_SECRET || 'fallback_secret';
  const payload = `${usuario}:${Date.now()}`;
  const firma = crypto.createHmac('sha256', secreto).update(payload).digest('hex');
  // Token = payload codificado en base64 + firma separados por punto
  return `${Buffer.from(payload).toString('base64')}.${firma}`;
};

// Verifica que el token recibido sea válido y fue generado por este servidor
export const verifyToken = (token: string): boolean => {
  try {
    const secreto = process.env.ADMIN_SECRET || 'fallback_secret';
    const [payloadB64, firma] = token.split('.');
    if (!payloadB64 || !firma) return false;

    const payload = Buffer.from(payloadB64, 'base64').toString('utf-8');
    const firmaEsperada = crypto
      .createHmac('sha256', secreto)
      .update(payload)
      .digest('hex');

    // Comparación segura contra timing attacks
    return crypto.timingSafeEqual(
      Buffer.from(firma),
      Buffer.from(firmaEsperada)
    );
  } catch {
    return false;
  }
};

// POST /api/auth/login — verifica usuario y contraseña del .env
export const login = (req: Request, res: Response): void => {
  const { usuario, password } = req.body;

  // Leemos las credenciales desde las variables de entorno
  const adminUser = process.env.ADMIN_USER;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminUser || !adminPassword) {
    res.status(500).json({ ok: false, mensaje: 'Credenciales de admin no configuradas' });
    return;
  }

  // Comparamos usando timingSafeEqual para evitar ataques de timing
  const usuarioCorrecto = crypto.timingSafeEqual(
    Buffer.from(usuario || ''),
    Buffer.from(adminUser)
  );
  const passwordCorrecta = crypto.timingSafeEqual(
    Buffer.from(password || ''),
    Buffer.from(adminPassword)
  );

  if (!usuarioCorrecto || !passwordCorrecta) {
    res.status(401).json({ ok: false, mensaje: 'Usuario o contraseña incorrectos' });
    return;
  }

  // Generamos el token y lo enviamos al cliente
  const token = generateToken(usuario);
  res.json({ ok: true, token });
};

// POST /api/auth/verify — el cliente puede verificar si su token sigue siendo válido
export const verify = (req: Request, res: Response): void => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.replace('Bearer ', '');

  if (!token || !verifyToken(token)) {
    res.status(401).json({ ok: false, mensaje: 'Token inválido' });
    return;
  }

  res.json({ ok: true });
};
