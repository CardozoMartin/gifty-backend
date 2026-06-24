// Categorías disponibles para los productos mayoristas
export type Categoria =
  | 'tazas'
  | 'mates'
  | 'botellas'
  | 'libreria'
  | 'box'
  | 'cotillon'
  | 'otros';

// Estados posibles de un pedido
export type EstadoPedido =
  | 'pendiente'
  | 'confirmado'
  | 'en_preparacion'
  | 'enviado'
  | 'entregado'
  | 'cancelado';

// Estructura de un ítem dentro de un pedido
export interface ItemPedido {
  productoId: string;
  nombre: string;
  precio: number;
  cantidad: number;
  imagen: string;
}

// Datos del cliente al hacer el pedido
export interface DatosCliente {
  nombre: string;
  email: string;
  telefono: string;
  empresa?: string;
  direccion: string;
  ciudad: string;
  provincia: string;
}
