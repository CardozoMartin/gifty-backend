import { Request, Response } from 'express';
import { Cupon } from '../models/Cupon';
import { UserRequest } from '../middlewares/userAuthMiddleware';

// GET /api/cupones — lista todos (admin)
export const listarCupones = async (_req: Request, res: Response): Promise<void> => {
  try {
    const cupones = await Cupon.find().sort({ createdAt: -1 });
    res.json({ ok: true, cupones });
  } catch {
    res.status(500).json({ ok: false, mensaje: 'Error al obtener cupones' });
  }
};

// POST /api/cupones — crear cupón (admin)
export const crearCupon = async (req: Request, res: Response): Promise<void> => {
  try {
    const { codigo, tipo, valor, fechaVencimiento, usosMaximos, unUsorPorUsuario } = req.body;

    if (!codigo || !tipo || valor === undefined) {
      res.status(400).json({ ok: false, mensaje: 'Código, tipo y valor son obligatorios' });
      return;
    }

    const existe = await Cupon.findOne({ codigo: codigo.toUpperCase() });
    if (existe) {
      res.status(400).json({ ok: false, mensaje: 'Ya existe un cupón con ese código' });
      return;
    }

    const cupon = await Cupon.create({
      codigo,
      tipo,
      valor,
      fechaVencimiento: fechaVencimiento || undefined,
      usosMaximos: usosMaximos || undefined,
      unUsorPorUsuario: unUsorPorUsuario || false,
    });

    res.status(201).json({ ok: true, cupon });
  } catch (error: any) {
    res.status(500).json({ ok: false, mensaje: error?.message || 'Error al crear el cupón' });
  }
};

// PUT /api/cupones/:id — editar cupón (admin)
export const editarCupon = async (req: Request, res: Response): Promise<void> => {
  try {
    const { codigo, tipo, valor, activo, fechaVencimiento, usosMaximos, unUsorPorUsuario } = req.body;

    const cupon = await Cupon.findByIdAndUpdate(
      req.params.id,
      { $set: { codigo, tipo, valor, activo, fechaVencimiento, usosMaximos, unUsorPorUsuario } },
      { new: true, runValidators: true }
    );

    if (!cupon) {
      res.status(404).json({ ok: false, mensaje: 'Cupón no encontrado' });
      return;
    }

    res.json({ ok: true, cupon });
  } catch (error: any) {
    res.status(500).json({ ok: false, mensaje: error?.message || 'Error al editar el cupón' });
  }
};

// DELETE /api/cupones/:id — eliminar cupón (admin)
export const eliminarCupon = async (req: Request, res: Response): Promise<void> => {
  try {
    const cupon = await Cupon.findByIdAndDelete(req.params.id);
    if (!cupon) {
      res.status(404).json({ ok: false, mensaje: 'Cupón no encontrado' });
      return;
    }
    res.json({ ok: true, mensaje: 'Cupón eliminado' });
  } catch {
    res.status(500).json({ ok: false, mensaje: 'Error al eliminar el cupón' });
  }
};

// POST /api/cupones/validar — validar y aplicar cupón (público, desde checkout)
export const validarCupon = async (req: UserRequest, res: Response): Promise<void> => {
  try {
    const { codigo, total } = req.body;

    if (!codigo) {
      res.status(400).json({ ok: false, mensaje: 'Ingresá un código de cupón' });
      return;
    }

    const cupon = await Cupon.findOne({ codigo: codigo.toUpperCase() });

    if (!cupon) {
      res.status(404).json({ ok: false, mensaje: 'El cupón no existe' });
      return;
    }

    if (!cupon.activo) {
      res.status(400).json({ ok: false, mensaje: 'El cupón no está activo' });
      return;
    }

    if (cupon.fechaVencimiento && cupon.fechaVencimiento < new Date()) {
      res.status(400).json({ ok: false, mensaje: 'El cupón expiró' });
      return;
    }

    if (cupon.usosMaximos !== undefined && cupon.usosActuales >= cupon.usosMaximos) {
      res.status(400).json({ ok: false, mensaje: 'El cupón ya alcanzó su límite de usos' });
      return;
    }

    if (cupon.unUsorPorUsuario && req.usuarioId) {
      if (cupon.usuariosQueUsaron.includes(req.usuarioId)) {
        res.status(400).json({ ok: false, mensaje: 'Ya usaste este cupón anteriormente' });
        return;
      }
    }

    // Calcular descuento
    const descuento = cupon.tipo === 'porcentaje'
      ? Math.round((total || 0) * cupon.valor / 100)
      : cupon.valor;

    res.json({
      ok: true,
      cupon: {
        _id: cupon._id,
        codigo: cupon.codigo,
        tipo: cupon.tipo,
        valor: cupon.valor,
      },
      descuento,
    });
  } catch {
    res.status(500).json({ ok: false, mensaje: 'Error al validar el cupón' });
  }
};
