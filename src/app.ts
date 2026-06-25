import dotenv from 'dotenv';
// dotenv debe correr antes que cualquier otro import que lea process.env
dotenv.config();

import express from 'express';
import cors from 'cors';
import { connectDatabase } from './config/database';
import productRoutes from './routes/productRoutes';
import orderRoutes from './routes/orderRoutes';
import authRoutes from './routes/authRoutes';
import configRoutes from './routes/configRoutes';
import userAuthRoutes from './routes/userAuthRoutes';
import cuponRoutes from './routes/cuponRoutes';
import { requireAuth } from './middlewares/authMiddleware';

const app = express();
const puerto = process.env.PORT || 4000;

// ─── Middlewares globales ──────────────────────────────────────────────────

// Permite solicitudes desde el frontend (dev y producción)
const origenesPermitidos = [
  process.env.CLIENT_URL || 'http://localhost:5173',
  'http://localhost:5173',
  'https://gifty-mayorista.netlify.app',
];
app.use(cors({
  origin: (origin, callback) => {
    // Permite requests sin origin (Postman, mobile apps, curl)
    if (!origin) return callback(null, true);
    if (origenesPermitidos.includes(origin)) return callback(null, true);
    callback(new Error(`CORS bloqueado para origen: ${origin}`));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Parsea el body de las peticiones como JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Rutas de la API ────────────────────────────────────────────────────────

// Auth — pública (no requiere token)
app.use('/api/auth', authRoutes);

// Productos — las rutas públicas de la tienda no requieren auth
// Las rutas /admin/* dentro de productRoutes están protegidas en el router
app.use('/api/productos', productRoutes);

// Pedidos — POST / es público (el cliente crea su pedido); /admin/* requiere auth
app.use('/api/pedidos', orderRoutes);

// Config — GET público, PUT protegido dentro del router
app.use('/api/config', configRoutes);

// Usuarios — registro, verificación, login y recupero de contraseña
app.use('/api/usuarios', userAuthRoutes);

// Cupones — validación pública, CRUD admin
app.use('/api/cupones', cuponRoutes);

// Health check / ping — público, usado por cronjob para mantener el servidor activo
app.get('/api/ping', (_req, res) => {
  res.json({
    ok: true,
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

// ─── Inicio del servidor ────────────────────────────────────────────────────
const startServer = async (): Promise<void> => {
  await connectDatabase();

  app.listen(puerto, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${puerto}`);
    console.log(`📦 API disponible en http://localhost:${puerto}/api`);
    console.log(`📧 EMAIL_USER: ${process.env.EMAIL_USER || 'NO DEFINIDO'}`);
    console.log(`📧 EMAIL_PASS: ${process.env.EMAIL_PASS ? 'CARGADO ✓' : 'NO DEFINIDO ✗'}`);
  });
};

startServer();

// Exportamos requireAuth para usarlo en los routers individuales
export { requireAuth };
