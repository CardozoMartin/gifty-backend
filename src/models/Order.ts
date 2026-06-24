import { Schema, model, Document } from 'mongoose';
import { EstadoPedido, ItemPedido, DatosCliente } from '../types';

// Interfaz tipada para el documento Pedido en Mongoose
export interface IPedido extends Document {
  numeroPedido: string;        // número legible: "GFT-00001"
  cliente: DatosCliente;
  items: ItemPedido[];
  total: number;
  estado: EstadoPedido;
  metodoPago?: string;
  notas?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Schema para los ítems dentro de un pedido
const itemPedidoSchema = new Schema<ItemPedido>(
  {
    productoId: { type: String, required: true },
    nombre: { type: String, required: true },
    precio: { type: Number, required: true },
    cantidad: { type: Number, required: true, min: 1 },
    imagen: { type: String, default: '' },
  },
  { _id: false } // no necesitamos _id para los sub-documentos
);

// Schema para los datos del cliente comprador
const datosClienteSchema = new Schema<DatosCliente>(
  {
    nombre: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    telefono: { type: String, required: true, trim: true },
    empresa: { type: String, trim: true },
    direccion: { type: String, required: true, trim: true },
    ciudad: { type: String, required: true, trim: true },
    provincia: { type: String, required: true, trim: true },
  },
  { _id: false }
);

// Schema principal del Pedido
const pedidoSchema = new Schema<IPedido>(
  {
    // Número de pedido legible para mostrar al cliente y al admin
    numeroPedido: {
      type: String,
      required: true,
      unique: true,
    },
    cliente: {
      type: datosClienteSchema,
      required: true,
    },
    // Lista de productos incluidos en el pedido
    items: {
      type: [itemPedidoSchema],
      required: true,
      validate: {
        validator: (v: ItemPedido[]) => v.length > 0,
        message: 'El pedido debe tener al menos un ítem',
      },
    },
    // Total calculado en el servidor para evitar manipulación
    total: {
      type: Number,
      required: true,
      min: 0,
    },
    estado: {
      type: String,
      required: true,
      enum: ['pendiente', 'confirmado', 'en_preparacion', 'enviado', 'entregado', 'cancelado'],
      default: 'pendiente',
    },
    metodoPago: {
      type: String,
      trim: true,
    },
    notas: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Pedido = model<IPedido>('Pedido', pedidoSchema);
