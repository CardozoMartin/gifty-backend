import express from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import { connectDatabase } from './config/database';
import productRoutes from './routes/productRoutes';
import orderRoutes from './routes/orderRoutes';
import authRoutes from './routes/authRoutes';
import configRoutes from './routes/configRoutes';
import { requireAuth } from './middlewares/authMiddleware';

// Carga las variables de entorno desde el archivo .env
dotenv.config();

const app = express();
const puerto = process.env.PORT || 4000;

// ─── Middlewares globales ──────────────────────────────────────────────────

// Permite solicitudes desde el frontend en desarrollo (localhost:5173)
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Parsea el body de las peticiones como JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Sirve las imágenes subidas como archivos estáticos
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

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

// Health check — público
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, mensaje: 'Servidor Gifty Mayorista funcionando' });
});

// ─── Inicio del servidor ────────────────────────────────────────────────────
const startServer = async (): Promise<void> => {
  await connectDatabase();

  app.listen(puerto, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${puerto}`);
    console.log(`📦 API disponible en http://localhost:${puerto}/api`);
  });
};

startServer();

// Exportamos requireAuth para usarlo en los routers individuales
export { requireAuth };
