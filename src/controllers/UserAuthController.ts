import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { Usuario } from '../models/Usuario';
import { emailService } from '../services/emailService';

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

    await emailService.sendVerification(usuario.nombre, usuario.email, tokenVerificacion);

    res.status(201).json({
      ok: true,
      mensaje: 'Cuenta creada. Revisá tu email para verificar la cuenta.',
    });
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

    await emailService.sendPasswordReset(usuario.nombre, usuario.email, tokenReset);

    res.json({ ok: true, mensaje: 'Si el email está registrado, recibirás las instrucciones.' });
  } catch (error) {
    console.error('Error recuperarPassword:', error);
    res.status(500).json({ ok: false, mensaje: 'Error al procesar la solicitud' });
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
