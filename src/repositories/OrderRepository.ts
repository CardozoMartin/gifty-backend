import { Pedido, IPedido } from '../models/Order';
import { EstadoPedido } from '../types';

// Repositorio: capa de acceso a datos para Pedido
export class OrderRepository {

  // Obtiene todos los pedidos ordenados por fecha descendente
  async findAll(estado?: EstadoPedido): Promise<IPedido[]> {
    const query: Record<string, unknown> = {};

    // Filtra por estado si se provee (ej: solo pendientes)
    if (estado) {
      query.estado = estado;
    }

    return Pedido.find(query).sort({ createdAt: -1 });
  }

  // Busca un pedido por su ID de MongoDB
  async findById(id: string): Promise<IPedido | null> {
    return Pedido.findById(id);
  }

  // Busca un pedido por su número legible (GFT-00001)
  async findByNumeroPedido(numeroPedido: string): Promise<IPedido | null> {
    return Pedido.findOne({ numeroPedido });
  }

  // Crea un nuevo pedido en la base de datos
  async create(datos: Partial<IPedido>): Promise<IPedido> {
    const nuevoPedido = new Pedido(datos);
    return nuevoPedido.save();
  }

  // Actualiza el estado de un pedido
  async updateEstado(id: string, estado: EstadoPedido): Promise<IPedido | null> {
    return Pedido.findByIdAndUpdate(
      id,
      { $set: { estado } },
      { new: true }
    );
  }

  // Cuenta los pedidos para generar el próximo número correlativo
  async countAll(): Promise<number> {
    return Pedido.countDocuments();
  }
}
