import { Schema, model, Document } from 'mongoose';
import { Categoria } from '../types';

// Interfaz que extiende Document de Mongoose para tipado fuerte
export interface IProducto extends Document {
  nombre: string;
  descripcion: string;
  precio: number;              // precio de lista
  precioEfectivo: number;      // precio pagando en efectivo (con descuento)
  categoria: Categoria;
  imagenes: string[];          // rutas o URLs de las imágenes
  stock: number;
  cantidadMinima: number;      // cantidad mínima mayorista
  activo: boolean;
  slug: string;                // URL amigable generada del nombre
  createdAt: Date;
  updatedAt: Date;
}

// Definición del schema de Mongoose para Producto
const productoSchema = new Schema<IProducto>(
  {
    nombre: {
      type: String,
      required: [true, 'El nombre del producto es obligatorio'],
      trim: true,
    },
    descripcion: {
      type: String,
      required: [true, 'La descripción es obligatoria'],
      trim: true,
    },
    // Precio de lista (transferencia / tarjeta)
    precio: {
      type: Number,
      required: [true, 'El precio es obligatorio'],
      min: [0, 'El precio no puede ser negativo'],
    },
    // Precio con descuento al pagar en efectivo
    precioEfectivo: {
      type: Number,
      required: [true, 'El precio efectivo es obligatorio'],
      min: [0, 'El precio efectivo no puede ser negativo'],
    },
    categoria: {
      type: String,
      required: [true, 'La categoría es obligatoria'],
      enum: ['tazas', 'mates', 'botellas', 'libreria', 'box', 'cotillon', 'otros'],
    },
    // Array de paths de imágenes subidas al servidor
    imagenes: {
      type: [String],
      default: [],
    },
    stock: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'El stock no puede ser negativo'],
    },
    // Cantidad mínima de unidades para compra mayorista
    cantidadMinima: {
      type: Number,
      required: true,
      default: 6,
      min: [1, 'La cantidad mínima debe ser al menos 1'],
    },
    activo: {
      type: Boolean,
      default: true,
    },
    // Slug para URL: "taza-stitch" en lugar de id largo
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
  },
  {
    // Agrega automáticamente createdAt y updatedAt
    timestamps: true,
  }
);

// Índice para búsqueda por texto en nombre y descripción
productoSchema.index({ nombre: 'text', descripcion: 'text' });

export const Producto = model<IProducto>('Producto', productoSchema);
