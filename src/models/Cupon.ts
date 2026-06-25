import { Schema, model, Document } from 'mongoose';

export type TipoDescuento = 'porcentaje' | 'monto';

export interface ICupon extends Document {
  codigo: string;
  tipo: TipoDescuento;
  valor: number;
  activo: boolean;
  fechaVencimiento?: Date;
  usosMaximos?: number;
  usosActuales: number;
  unUsorPorUsuario: boolean;
  usuariosQueUsaron: string[];
  createdAt: Date;
  updatedAt: Date;
}

const cuponSchema = new Schema<ICupon>(
  {
    codigo: { type: String, required: true, unique: true, uppercase: true, trim: true },
    tipo: { type: String, enum: ['porcentaje', 'monto'], required: true },
    valor: { type: Number, required: true, min: 0 },
    activo: { type: Boolean, default: true },
    fechaVencimiento: { type: Date },
    usosMaximos: { type: Number, min: 1 },
    usosActuales: { type: Number, default: 0 },
    unUsorPorUsuario: { type: Boolean, default: false },
    usuariosQueUsaron: [{ type: String }],
  },
  { timestamps: true }
);

export const Cupon = model<ICupon>('Cupon', cuponSchema);
