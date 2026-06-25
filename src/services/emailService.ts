import nodemailer from 'nodemailer';
import { IPedido } from '../models/Order';

const crearTransporte = () =>
  nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT) || 587,
    secure: false,
    family: 4, // fuerza IPv4 — Render free tier bloquea IPv6
    auth: {
      user: process.env.EMAIL_USER,
      pass: (process.env.EMAIL_PASS || '').replace(/\s/g, ''),
    },
  });

const BASE_URL = process.env.CLIENT_URL || 'http://localhost:5173';
const FROM = `"Gifty Mayorista" <${process.env.EMAIL_USER}>`;

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt = (n: number) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n);

const colorEstado: Record<string, string> = {
  pendiente:      '#f59e0b',
  confirmado:     '#3b82f6',
  en_preparacion: '#8b5cf6',
  enviado:        '#6366f1',
  entregado:      '#10b981',
  cancelado:      '#ef4444',
};

const labelEstado: Record<string, string> = {
  pendiente:      'Pendiente',
  confirmado:     'Confirmado',
  en_preparacion: 'En preparación',
  enviado:        'Enviado',
  entregado:      'Entregado',
  cancelado:      'Cancelado',
};

// ── Layout base del email ─────────────────────────────────────────────────────
const layout = (contenido: string) => `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:'Segoe UI',Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.08)">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#e91e8c,#9b5ab3);padding:32px 40px;text-align:center">
            <p style="margin:0;font-size:22px;font-weight:800;color:#fff;letter-spacing:-0.5px">Gifty Mayorista 🎁</p>
          </td>
        </tr>

        <!-- Contenido -->
        <tr><td style="padding:36px 40px">${contenido}</td></tr>

        <!-- Footer -->
        <tr>
          <td style="padding:24px 40px;background:#f9fafb;border-top:1px solid #e5e7eb;text-align:center">
            <p style="margin:0;font-size:12px;color:#9ca3af">
              Gifty Mayorista · Regalos al por mayor<br>
              <a href="${BASE_URL}" style="color:#e91e8c;text-decoration:none">${BASE_URL}</a>
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

// ── Tabla de productos del pedido ─────────────────────────────────────────────
const tablaItems = (pedido: IPedido) => `
  <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:10px;overflow:hidden;margin:20px 0;font-size:13px">
    <tr style="background:#f9fafb">
      <th style="text-align:left;padding:10px 14px;color:#6b7280;font-weight:600">Producto</th>
      <th style="text-align:center;padding:10px 14px;color:#6b7280;font-weight:600">Cant.</th>
      <th style="text-align:right;padding:10px 14px;color:#6b7280;font-weight:600">Subtotal</th>
    </tr>
    ${pedido.items.map((item) => `
    <tr style="border-top:1px solid #f3f4f6">
      <td style="padding:10px 14px;color:#374151">${item.nombre}</td>
      <td style="padding:10px 14px;text-align:center;color:#374151">${item.cantidad}</td>
      <td style="padding:10px 14px;text-align:right;color:#374151;font-weight:600">${fmt(item.precio * item.cantidad)}</td>
    </tr>`).join('')}
    ${pedido.descuentoCupon ? `
    <tr style="border-top:1px solid #f3f4f6">
      <td colspan="2" style="padding:10px 14px;color:#6b7280">Cupón ${pedido.cuponCodigo || ''}</td>
      <td style="padding:10px 14px;text-align:right;color:#10b981;font-weight:600">−${fmt(pedido.descuentoCupon)}</td>
    </tr>` : ''}
    <tr style="border-top:2px solid #e5e7eb;background:#fafafa">
      <td colspan="2" style="padding:12px 14px;font-weight:700;color:#111827">Total</td>
      <td style="padding:12px 14px;text-align:right;font-weight:800;color:#e91e8c;font-size:15px">${fmt(pedido.total)}</td>
    </tr>
  </table>`;

// ── Badge de estado ───────────────────────────────────────────────────────────
const badgeEstado = (estado: string) =>
  `<span style="display:inline-block;padding:4px 14px;border-radius:999px;background:${colorEstado[estado] || '#6b7280'}22;color:${colorEstado[estado] || '#6b7280'};font-size:13px;font-weight:700">${labelEstado[estado] || estado}</span>`;

// ── Botón CTA ─────────────────────────────────────────────────────────────────
const boton = (texto: string, url: string) =>
  `<a href="${url}" style="display:inline-block;margin:20px 0 8px;padding:13px 32px;background:linear-gradient(135deg,#e91e8c,#9b5ab3);color:#fff;border-radius:10px;text-decoration:none;font-weight:700;font-size:14px">${texto}</a>`;

export const emailService = {
  // ── Auth ────────────────────────────────────────────────────────────────────
  async sendVerification(nombre: string, email: string, token: string) {
    const link = `${BASE_URL}/verificar-email/${token}`;
    await crearTransporte().sendMail({
      from: FROM, to: email,
      subject: 'Verificá tu cuenta en Gifty Mayorista',
      html: layout(`
        <h2 style="margin:0 0 8px;font-size:20px;color:#111827">¡Hola, ${nombre}! 👋</h2>
        <p style="color:#6b7280;margin:0 0 20px">Gracias por registrarte en <strong style="color:#111827">Gifty Mayorista</strong>. Hacé click para verificar tu cuenta:</p>
        ${boton('Verificar mi cuenta', link)}
        <p style="color:#9ca3af;font-size:12px;margin-top:16px">Este link expira en 24 horas. Si no te registraste, ignorá este email.</p>
      `),
    });
  },

  async sendPasswordReset(nombre: string, email: string, token: string) {
    const link = `${BASE_URL}/reset-password/${token}`;
    await crearTransporte().sendMail({
      from: FROM, to: email,
      subject: 'Recuperar contraseña — Gifty Mayorista',
      html: layout(`
        <h2 style="margin:0 0 8px;font-size:20px;color:#111827">Recuperar contraseña</h2>
        <p style="color:#6b7280;margin:0 0 20px">Hola <strong style="color:#111827">${nombre}</strong>, recibimos una solicitud para resetear tu contraseña.</p>
        ${boton('Resetear contraseña', link)}
        <p style="color:#9ca3af;font-size:12px;margin-top:16px">Este link expira en 1 hora. Si no lo solicitaste, ignorá este email.</p>
      `),
    });
  },

  // ── Pedidos ─────────────────────────────────────────────────────────────────

  // Estado: pedido recibido (se dispara al crear el pedido)
  async sendPedidoRecibido(pedido: IPedido) {
    const nombre = pedido.cliente.nombre;
    await crearTransporte().sendMail({
      from: FROM, to: pedido.cliente.email,
      subject: `✅ Pedido recibido ${pedido.numeroPedido} — Gifty Mayorista`,
      html: layout(`
        <h2 style="margin:0 0 4px;font-size:20px;color:#111827">¡Recibimos tu pedido! 🎉</h2>
        <p style="color:#6b7280;margin:0 0 6px">Hola <strong style="color:#111827">${nombre}</strong>, ya tenemos tu pedido y lo estamos revisando.</p>
        <p style="margin:0 0 20px;color:#6b7280">N° de pedido: <strong style="color:#e91e8c;font-size:16px">${pedido.numeroPedido}</strong></p>
        ${tablaItems(pedido)}
        <div style="background:#f9fafb;border-radius:10px;padding:16px;margin-top:4px;font-size:13px;color:#374151">
          <p style="margin:0 0 4px"><strong>Método de pago:</strong> ${pedido.metodoPago || '—'}</p>
          <p style="margin:0 0 4px"><strong>Medio de envío:</strong> ${pedido.medioEnvio || '—'}</p>
          <p style="margin:0"><strong>Dirección:</strong> ${pedido.cliente.direccion}, ${pedido.cliente.ciudad}</p>
        </div>
        <p style="color:#6b7280;font-size:13px;margin-top:20px">Nos pondremos en contacto a la brevedad para coordinar el pago y el despacho. ¡Gracias por elegirnos!</p>
        ${boton('Ver mis pedidos', `${BASE_URL}/mi-cuenta`)}
      `),
    });
  },

  // Estado: confirmado
  async sendPedidoConfirmado(pedido: IPedido) {
    await crearTransporte().sendMail({
      from: FROM, to: pedido.cliente.email,
      subject: `🔵 Pedido confirmado ${pedido.numeroPedido} — Gifty Mayorista`,
      html: layout(`
        <h2 style="margin:0 0 4px;font-size:20px;color:#111827">¡Tu pedido fue confirmado! 🙌</h2>
        <p style="color:#6b7280;margin:0 0 20px">Hola <strong style="color:#111827">${pedido.cliente.nombre}</strong>, confirmamos la recepción de tu pago y comenzamos a procesar tu pedido.</p>
        <p style="margin:0 0 20px">N° <strong style="color:#e91e8c">${pedido.numeroPedido}</strong> · Estado: ${badgeEstado('confirmado')}</p>
        ${tablaItems(pedido)}
        ${boton('Ver mis pedidos', `${BASE_URL}/mi-cuenta`)}
      `),
    });
  },

  // Estado: en preparación
  async sendPedidoEnPreparacion(pedido: IPedido) {
    await crearTransporte().sendMail({
      from: FROM, to: pedido.cliente.email,
      subject: `🟣 Tu pedido está en preparación — ${pedido.numeroPedido}`,
      html: layout(`
        <h2 style="margin:0 0 4px;font-size:20px;color:#111827">¡Estamos preparando tu pedido! 📦</h2>
        <p style="color:#6b7280;margin:0 0 20px">Hola <strong style="color:#111827">${pedido.cliente.nombre}</strong>, tu pedido ya está en manos de nuestro equipo y lo estamos armando con todo el cuidado.</p>
        <p style="margin:0 0 20px">N° <strong style="color:#e91e8c">${pedido.numeroPedido}</strong> · Estado: ${badgeEstado('en_preparacion')}</p>
        ${tablaItems(pedido)}
        <p style="color:#6b7280;font-size:13px;margin-top:4px">Te avisaremos cuando sea despachado. ¡Ya falta poco!</p>
        ${boton('Ver mis pedidos', `${BASE_URL}/mi-cuenta`)}
      `),
    });
  },

  // Estado: enviado
  async sendPedidoEnviado(pedido: IPedido) {
    await crearTransporte().sendMail({
      from: FROM, to: pedido.cliente.email,
      subject: `🚚 Tu pedido fue enviado — ${pedido.numeroPedido}`,
      html: layout(`
        <h2 style="margin:0 0 4px;font-size:20px;color:#111827">¡Tu pedido está en camino! 🚚</h2>
        <p style="color:#6b7280;margin:0 0 20px">Hola <strong style="color:#111827">${pedido.cliente.nombre}</strong>, tu pedido ya fue despachado y está en camino a tu dirección.</p>
        <p style="margin:0 0 4px">N° <strong style="color:#e91e8c">${pedido.numeroPedido}</strong> · Estado: ${badgeEstado('enviado')}</p>
        <p style="color:#6b7280;font-size:13px;margin:0 0 20px">Dirección de entrega: <strong>${pedido.cliente.direccion}, ${pedido.cliente.ciudad}, ${pedido.cliente.provincia}</strong></p>
        ${tablaItems(pedido)}
        <p style="color:#6b7280;font-size:13px;margin-top:4px">Ante cualquier consulta sobre el envío, respondé este email y te ayudamos.</p>
        ${boton('Ver mis pedidos', `${BASE_URL}/mi-cuenta`)}
      `),
    });
  },

  // Estado: entregado
  async sendPedidoEntregado(pedido: IPedido) {
    await crearTransporte().sendMail({
      from: FROM, to: pedido.cliente.email,
      subject: `✅ Pedido entregado — ${pedido.numeroPedido}`,
      html: layout(`
        <h2 style="margin:0 0 4px;font-size:20px;color:#111827">¡Tu pedido fue entregado! 🎁</h2>
        <p style="color:#6b7280;margin:0 0 20px">Hola <strong style="color:#111827">${pedido.cliente.nombre}</strong>, confirmamos que tu pedido fue entregado exitosamente. Esperamos que estés feliz con tu compra.</p>
        <p style="margin:0 0 20px">N° <strong style="color:#e91e8c">${pedido.numeroPedido}</strong> · Estado: ${badgeEstado('entregado')}</p>
        ${tablaItems(pedido)}
        <p style="color:#6b7280;font-size:13px;margin-top:4px">¡Gracias por confiar en <strong>Gifty Mayorista</strong>! Esperamos verte en tu próximo pedido. 💖</p>
        ${boton('Volver a la tienda', `${BASE_URL}/tienda`)}
      `),
    });
  },

  // Estado: cancelado
  async sendPedidoCancelado(pedido: IPedido) {
    await crearTransporte().sendMail({
      from: FROM, to: pedido.cliente.email,
      subject: `❌ Pedido cancelado — ${pedido.numeroPedido}`,
      html: layout(`
        <h2 style="margin:0 0 4px;font-size:20px;color:#111827">Tu pedido fue cancelado</h2>
        <p style="color:#6b7280;margin:0 0 20px">Hola <strong style="color:#111827">${pedido.cliente.nombre}</strong>, lamentamos informarte que tu pedido fue cancelado.</p>
        <p style="margin:0 0 20px">N° <strong style="color:#e91e8c">${pedido.numeroPedido}</strong> · Estado: ${badgeEstado('cancelado')}</p>
        ${tablaItems(pedido)}
        <p style="color:#6b7280;font-size:13px;margin-top:4px">Si tenés dudas sobre la cancelación o necesitás más información, respondé este email y te ayudamos a la brevedad.</p>
        ${boton('Contactarnos', `${BASE_URL}`)}
      `),
    });
  },
};
