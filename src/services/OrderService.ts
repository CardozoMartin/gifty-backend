import { OrderRepository } from '../repositories/OrderRepository';
import { IPedido } from '../models/Order';
import { EstadoPedido, ItemPedido, DatosCliente } from '../types';
import { Cupon } from '../models/Cupon';

interface CrearPedidoInput {
  cliente: DatosCliente;
  items: ItemPedido[];
  metodoPago?: string;
  medioEnvio?: string;
  notas?: string;
  cuponCodigo?: string;
  usuarioId?: string;
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

    const subtotal = this.calculateTotal(input.items);
    const numeroPedido = await this.generateOrderNumber();

    let descuentoCupon = 0;
    let cuponCodigo: string | undefined;

    // Validar y aplicar cupón si viene uno
    if (input.cuponCodigo) {
      const cupon = await Cupon.findOne({ codigo: input.cuponCodigo.toUpperCase() });

      if (cupon && cupon.activo) {
        const noVencido = !cupon.fechaVencimiento || cupon.fechaVencimiento >= new Date();
        const noAgotado = cupon.usosMaximos === undefined || cupon.usosActuales < cupon.usosMaximos;
        const noUsadoPorEsteUsuario = !cupon.unUsorPorUsuario || !input.usuarioId || !cupon.usuariosQueUsaron.includes(input.usuarioId);

        if (noVencido && noAgotado && noUsadoPorEsteUsuario) {
          descuentoCupon = cupon.tipo === 'porcentaje'
            ? Math.round(subtotal * cupon.valor / 100)
            : cupon.valor;

          cuponCodigo = cupon.codigo;

          // Registrar uso
          await Cupon.findByIdAndUpdate(cupon._id, {
            $inc: { usosActuales: 1 },
            ...(input.usuarioId ? { $push: { usuariosQueUsaron: input.usuarioId } } : {}),
          });
        }
      }
    }

    const total = Math.max(0, subtotal - descuentoCupon);

    return this.repositorio.create({
      numeroPedido,
      cliente: input.cliente,
      items: input.items,
      subtotal,
      descuentoCupon: descuentoCupon || undefined,
      cuponCodigo,
      total,
      metodoPago: input.metodoPago,
      medioEnvio: input.medioEnvio,
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
