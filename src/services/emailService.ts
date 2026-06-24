import nodemailer from 'nodemailer';

const crearTransporte = () =>
  nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      // Las App Passwords de Gmail vienen con espacios — los quitamos
      pass: (process.env.EMAIL_PASS || '').replace(/\s/g, ''),
    },
  });

const BASE_URL = process.env.CLIENT_URL || 'http://localhost:5173';
const FROM = `"Gifty Mayorista" <${process.env.EMAIL_USER}>`;

export const emailService = {
  async sendVerification(nombre: string, email: string, token: string) {
    const link = `${BASE_URL}/verificar-email/${token}`;
    await crearTransporte().sendMail({
      from: FROM,
      to: email,
      subject: 'Verificá tu cuenta en Gifty Mayorista',
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:auto">
          <h2 style="color:#e91e8c">¡Hola, ${nombre}!</h2>
          <p>Gracias por registrarte en <strong>Gifty Mayorista</strong>.</p>
          <p>Hacé click en el botón para verificar tu cuenta:</p>
          <a href="${link}" style="display:inline-block;margin:16px 0;padding:12px 28px;background:#e91e8c;color:#fff;border-radius:8px;text-decoration:none;font-weight:600">
            Verificar mi cuenta
          </a>
          <p style="color:#999;font-size:12px">Este link expira en 24 horas.<br>Si no te registraste, ignorá este email.</p>
        </div>
      `,
    });
  },

  async sendPasswordReset(nombre: string, email: string, token: string) {
    const link = `${BASE_URL}/reset-password/${token}`;
    await crearTransporte().sendMail({
      from: FROM,
      to: email,
      subject: 'Recuperar contraseña — Gifty Mayorista',
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:auto">
          <h2 style="color:#e91e8c">Recuperar contraseña</h2>
          <p>Hola <strong>${nombre}</strong>, recibimos una solicitud para resetear tu contraseña.</p>
          <a href="${link}" style="display:inline-block;margin:16px 0;padding:12px 28px;background:#e91e8c;color:#fff;border-radius:8px;text-decoration:none;font-weight:600">
            Resetear contraseña
          </a>
          <p style="color:#999;font-size:12px">Este link expira en 1 hora.<br>Si no lo solicitaste, ignorá este email.</p>
        </div>
      `,
    });
  },
};
