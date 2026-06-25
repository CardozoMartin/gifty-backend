import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { Usuario } from '../models/Usuario';
import { emailService } from '../services/emailService';
import { UserRequest } from '../middlewares/userAuthMiddleware';

const JWT_SECRET = () => process.env.JWT_SECRET || 'jwt_secret_fallback';
const JWT_EXPIRES = '7d';

const generarTokenAleatorio = () => crypto.randomBytes(32).toString('hex');

// POST /api/usuarios/registro
export const registro = async (req: Request, res: Response): Promise<void> => {
  try {
    const { nombre, email, password, empresa, telefono } = req.body;

    if (!nombre || !email || !password) {
      res.status(400).json({ ok: false, mensaje: 'Nombre, email y contraseña son obligatorios' });
      return;
    }

    const existe = await Usuario.findOne({ email: email.toLowerCase() });
    if (existe) {
      res.status(400).json({ ok: false, mensaje: 'Ya existe una cuenta con ese email' });
      return;
    }

    const hash = await bcrypt.hash(password, 12);
    const tokenVerificacion = generarTokenAleatorio();
    const tokenVerificacionExpira = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

    const usuario = await Usuario.create({
      nombre,
      email,
      password: hash,
      empresa,
      telefono,
      tokenVerificacion,
      tokenVerificacionExpira,
    });

    res.status(201).json({
      ok: true,
      mensaje: 'Cuenta creada. Revisá tu email para verificar la cuenta.',
    });

    // Envío de email no bloqueante — si falla no afecta el registro
    emailService.sendVerification(usuario.nombre, usuario.email, tokenVerificacion)
      .catch((e) => console.error('Error email verificación:', e?.message));
  } catch (error: any) {
    console.error('Error registro:', error?.message || error);
    res.status(500).json({ ok: false, mensaje: error?.message || 'Error al crear la cuenta' });
  }
};

// GET /api/usuarios/verificar/:token
export const verificarEmail = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = req.params;

    // Buscar por token sin importar si ya está verificado
    const usuario = await Usuario.findOne({ tokenVerificacion: token });

    if (!usuario) {
      res.status(400).json({ ok: false, mensaje: 'El link es inválido o ya expiró' });
      return;
    }

    // Si ya estaba verificado (doble click o precarga del navegador)
    if (usuario.verificado) {
      res.json({ ok: true, mensaje: 'Tu cuenta ya estaba verificada. Podés iniciar sesión.' });
      return;
    }

    // Verificar que el token no haya expirado
    if (usuario.tokenVerificacionExpira && usuario.tokenVerificacionExpira < new Date()) {
      res.status(400).json({ ok: false, mensaje: 'El link de verificación expiró. Registrate de nuevo.' });
      return;
    }

    usuario.verificado = true;
    usuario.tokenVerificacion = undefined;
    usuario.tokenVerificacionExpira = undefined;
    await usuario.save();

    res.json({ ok: true, mensaje: '¡Cuenta verificada correctamente!' });
  } catch (error) {
    console.error('Error verificarEmail:', error);
    res.status(500).json({ ok: false, mensaje: 'Error al verificar el email' });
  }
};

// POST /api/usuarios/login
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ ok: false, mensaje: 'Email y contraseña son obligatorios' });
      return;
    }

    const usuario = await Usuario.findOne({ email: email.toLowerCase() });
    if (!usuario) {
      res.status(401).json({ ok: false, mensaje: 'Email o contraseña incorrectos' });
      return;
    }

    if (!usuario.verificado) {
      res.status(401).json({ ok: false, mensaje: 'Debés verificar tu email antes de ingresar' });
      return;
    }

    const passwordOk = await bcrypt.compare(password, usuario.password);
    if (!passwordOk) {
      res.status(401).json({ ok: false, mensaje: 'Email o contraseña incorrectos' });
      return;
    }

    const token = jwt.sign({ id: usuario._id }, JWT_SECRET(), { expiresIn: JWT_EXPIRES });

    res.json({
      ok: true,
      token,
      usuario: {
        _id: usuario._id,
        nombre: usuario.nombre,
        email: usuario.email,
        verificado: usuario.verificado,
      },
    });
  } catch (error) {
    console.error('Error login:', error);
    res.status(500).json({ ok: false, mensaje: 'Error al iniciar sesión' });
  }
};

// GET /api/usuarios/perfil — devuelve datos del usuario autenticado
export const getPerfil = async (req: UserRequest, res: Response): Promise<void> => {
  try {
    const usuario = await Usuario.findById(req.usuarioId).select('-password -tokenVerificacion -tokenVerificacionExpira -tokenResetPassword -tokenResetPasswordExpira');
    if (!usuario) {
      res.status(404).json({ ok: false, mensaje: 'Usuario no encontrado' });
      return;
    }
    res.json({ ok: true, usuario });
  } catch (error) {
    res.status(500).json({ ok: false, mensaje: 'Error al obtener el perfil' });
  }
};

// PUT /api/usuarios/perfil — actualiza datos del perfil (sin cambiar email ni password)
export const updatePerfil = async (req: UserRequest, res: Response): Promise<void> => {
  try {
    const { nombre, apellido, empresa, telefono, dni, direccion, ciudad, provincia, codigoPostal } = req.body;

    const usuario = await Usuario.findByIdAndUpdate(
      req.usuarioId,
      { $set: { nombre, apellido, empresa, telefono, dni, direccion, ciudad, provincia, codigoPostal } },
      { new: true, runValidators: true, select: '-password -tokenVerificacion -tokenVerificacionExpira -tokenResetPassword -tokenResetPasswordExpira' }
    );

    if (!usuario) {
      res.status(404).json({ ok: false, mensaje: 'Usuario no encontrado' });
      return;
    }

    res.json({ ok: true, usuario });
  } catch (error) {
    res.status(500).json({ ok: false, mensaje: 'Error al actualizar el perfil' });
  }
};

// POST /api/usuarios/recuperar-password
export const recuperarPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;

    const usuario = await Usuario.findOne({ email: email?.toLowerCase() });

    // Respondemos igual exista o no el usuario (evita enumerar emails)
    if (!usuario) {
      res.json({ ok: true, mensaje: 'Si el email está registrado, recibirás las instrucciones.' });
      return;
    }

    const tokenReset = generarTokenAleatorio();
    usuario.tokenResetPassword = tokenReset;
    usuario.tokenResetPasswordExpira = new Date(Date.now() + 60 * 60 * 1000); // 1h
    await usuario.save();

    res.json({ ok: true, mensaje: 'Si el email está registrado, recibirás las instrucciones.' });

    // Envío de email no bloqueante
    emailService.sendPasswordReset(usuario.nombre, usuario.email, tokenReset)
      .catch((e) => console.error('Error email reset password:', e?.message));
  } catch (error) {
    console.error('Error recuperarPassword:', error);
    res.status(500).json({ ok: false, mensaje: 'Error al procesar la solicitud' });
  }
};

// POST /api/usuarios/cambiar-password — usuario logueado cambia su propia contraseña
export const cambiarPassword = async (req: UserRequest, res: Response): Promise<void> => {
  try {
    const { passwordActual, passwordNueva } = req.body;

    if (!passwordActual || !passwordNueva) {
      res.status(400).json({ ok: false, mensaje: 'Todos los campos son obligatorios' });
      return;
    }
    if (passwordNueva.length < 6) {
      res.status(400).json({ ok: false, mensaje: 'La nueva contraseña debe tener al menos 6 caracteres' });
      return;
    }

    const usuario = await Usuario.findById(req.usuarioId);
    if (!usuario) {
      res.status(404).json({ ok: false, mensaje: 'Usuario no encontrado' });
      return;
    }

    const passwordOk = await bcrypt.compare(passwordActual, usuario.password);
    if (!passwordOk) {
      res.status(400).json({ ok: false, mensaje: 'La contraseña actual es incorrecta' });
      return;
    }

    usuario.password = await bcrypt.hash(passwordNueva, 12);
    await usuario.save();

    res.json({ ok: true, mensaje: 'Contraseña actualizada correctamente' });
  } catch (error) {
    console.error('Error cambiarPassword:', error);
    res.status(500).json({ ok: false, mensaje: 'Error al cambiar la contraseña' });
  }
};

// POST /api/usuarios/reset-password/:token
export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password || password.length < 6) {
      res.status(400).json({ ok: false, mensaje: 'La contraseña debe tener al menos 6 caracteres' });
      return;
    }

    const usuario = await Usuario.findOne({
      tokenResetPassword: token,
      tokenResetPasswordExpira: { $gt: new Date() },
    });

    if (!usuario) {
      res.status(400).json({ ok: false, mensaje: 'El link es inválido o ya expiró' });
      return;
    }

    usuario.password = await bcrypt.hash(password, 12);
    usuario.tokenResetPassword = undefined;
    usuario.tokenResetPasswordExpira = undefined;
    await usuario.save();

    res.json({ ok: true, mensaje: 'Contraseña actualizada correctamente' });
  } catch (error) {
    console.error('Error resetPassword:', error);
    res.status(500).json({ ok: false, mensaje: 'Error al resetear la contraseña' });
  }
};
