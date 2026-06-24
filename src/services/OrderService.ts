import { OrderRepository } from '../repositories/OrderRepository';
import { IPedido } from '../models/Order';
import { EstadoPedido, ItemPedido, DatosCliente } from '../types';

// Datos que llegan desde el frontend para crear un pedido
interface CrearPedidoInput {
  cliente: DatosCliente;
  items: ItemPedido[];
  metodoPago?: string;
  notas?: string;
}

// Servicio de Pedido: lógica de negocio
export class OrderService {
  private readonly repositorio: OrderRepository;

  constructor() {
    this.repositorio = new OrderRepository();
  }

  // Genera un número de pedido legible con formato GFT-00001
  private async generateOrderNumber(): Promise<string> {
    const total = await this.repositorio.countAll();
    const numero = String(total + 1).padStart(5, '0'); // rellena con ceros a la izquierda
    return `GFT-${numero}`;
  }

  // Calcula el total del pedido sumando precio × cantidad de cada ítem
  private calculateTotal(items: ItemPedido[]): number {
    return items.reduce((acumulado, item) => acumulado + item.precio * item.cantidad, 0);
  }

  // Devuelve todos los pedidos (para el panel admin)
  async getOrders(estado?: EstadoPedido): Promise<IPedido[]> {
    return this.repositorio.findAll(estado);
  }

  // Busca un pedido por ID
  async getOrderById(id: string): Promise<IPedido> {
    const pedido = await this.repositorio.findById(id);
    if (!pedido) {
      throw new Error('Pedido no encontrado');
    }
    return pedido;
  }

  // Crea un nuevo pedido validando los datos y calculando el total en el servidor
  async createOrder(input: CrearPedidoInput): Promise<IPedido> {
    if (!input.items || input.items.length === 0) {
      throw new Error('El pedido debe contener al menos un producto');
    }

    // El total siempre se calcula en el servidor, nunca se confía en el cliente
    const total = this.calculateTotal(input.items);
    const numeroPedido = await this.generateOrderNumber();

    return this.repositorio.create({
      numeroPedido,
      cliente: input.cliente,
      items: input.items,
      total,
      metodoPago: input.metodoPago,
      notas: input.notas,
      estado: 'pendiente',
    });
  }

  // Actualiza el estado de un pedido desde el panel admin
  async updateOrderStatus(id: string, estado: EstadoPedido): Promise<IPedido> {
    const pedidoActualizado = await this.repositorio.updateEstado(id, estado);
    if (!pedidoActualizado) {
      throw new Error('Pedido no encontrado');
    }
    return pedidoActualizado;
  }
}
