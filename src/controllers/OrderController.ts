import { Request, Response } from 'express';
import { OrderService } from '../services/OrderService';
import { EstadoPedido } from '../types';
import { Pedido } from '../models/Order';
import { Usuario } from '../models/Usuario';
import { UserRequest } from '../middlewares/userAuthMiddleware';

const serviciosPedido = new OrderService();

// GET /api/admin/pedidos — lista todos los pedidos (con filtro opcional por estado)
export const getOrders = async (req: Request, res: Response): Promise<void> => {
  try {
    const { estado } = req.query;
    const pedidos = await serviciosPedido.getOrders(estado as EstadoPedido | undefined);
    res.json({ ok: true, datos: pedidos });
  } catch (error) {
    res.status(500).json({ ok: false, mensaje: 'Error al obtener pedidos' });
  }
};

// GET /api/admin/pedidos/:id — detalle de un pedido
export const getOrderById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const pedido = await serviciosPedido.getOrderById(id);
    res.json({ ok: true, datos: pedido });
  } catch (error) {
    res.status(404).json({ ok: false, mensaje: 'Pedido no encontrado' });
  }
};

// POST /api/pedidos — crea un nuevo pedido desde la tienda
export const createOrder = async (req: UserRequest, res: Response): Promise<void> => {
  try {
    const { cliente, items, metodoPago, medioEnvio, notas, cuponCodigo } = req.body;
    const pedido = await serviciosPedido.createOrder({
      cliente, items, metodoPago, medioEnvio, notas, cuponCodigo,
      usuarioId: req.usuarioId,
    });
    res.status(201).json({ ok: true, datos: pedido });
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : 'Error al crear el pedido';
    res.status(400).json({ ok: false, mensaje });
  }
};

// GET /api/pedidos/mis-pedidos — pedidos del usuario logueado (por email)
export const getMisPedidos = async (req: UserRequest, res: Response): Promise<void> => {
  try {
    const usuario = await Usuario.findById(req.usuarioId).select('email');
    if (!usuario) {
      res.status(404).json({ ok: false, mensaje: 'Usuario no encontrado' });
      return;
    }
    const pedidos = await Pedido.find({ 'cliente.email': usuario.email }).sort({ createdAt: -1 });
    res.json({ ok: true, datos: pedidos });
  } catch (error) {
    res.status(500).json({ ok: false, mensaje: 'Error al obtener los pedidos' });
  }
};

// PATCH /api/admin/pedidos/:id/estado — cambia el estado de un pedido
export const updateOrderStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { estado } = req.body;

    if (!estado) {
      res.status(400).json({ ok: false, mensaje: 'El estado es obligatorio' });
      return;
    }

    const pedido = await serviciosPedido.updateOrderStatus(id, estado as EstadoPedido);
    res.json({ ok: true, datos: pedido });
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : 'Error al actualizar estado';
    res.status(400).json({ ok: false, mensaje });
  }
};
