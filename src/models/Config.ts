import mongoose, { Document, Schema } from 'mongoose';

export interface IDescuento {
  montoDesde: number;
  porcentaje: number;
}

export interface IConfig extends Document {
  metodosPago: string[];
  mediosEnvio: string[];
  notaEnvio: string;
  compraMinima: number;
  descuentos: IDescuento[];
  descuentoEfectivo: number;
  emailNotificaciones: {
    pedidoRecibido: boolean;
    pedidoConfirmado: boolean;
    pedidoEnPreparacion: boolean;
    pedidoEnviado: boolean;
    pedidoEntregado: boolean;
    pedidoCancelado: boolean;
  };
}

const DescuentoSchema = new Schema<IDescuento>(
  {
    montoDesde:  { type: Number, required: true, min: 0 },
    porcentaje:  { type: Number, required: true, min: 1, max: 99 },
  },
  { _id: false }
);

const ConfigSchema = new Schema<IConfig>(
  {
    metodosPago:        { type: [String],          default: [] },
    mediosEnvio:        { type: [String],          default: [] },
    notaEnvio:          { type: String,            default: '' },
    compraMinima:       { type: Number,            default: 0 },
    descuentos:         { type: [DescuentoSchema], default: [] },
    descuentoEfectivo:  { type: Number,            default: 0, min: 0, max: 99 },
    emailNotificaciones: {
      type: new Schema({
        pedidoRecibido:      { type: Boolean, default: true },
        pedidoConfirmado:    { type: Boolean, default: true },
        pedidoEnPreparacion: { type: Boolean, default: true },
        pedidoEnviado:       { type: Boolean, default: true },
        pedidoEntregado:     { type: Boolean, default: true },
        pedidoCancelado:     { type: Boolean, default: true },
      }, { _id: false }),
      default: () => ({}),
    },
  },
  { timestamps: true }
);

export const Config = mongoose.model<IConfig>('Config', ConfigSchema);
