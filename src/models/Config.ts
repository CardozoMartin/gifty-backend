import mongoose, { Document, Schema } from 'mongoose';

export interface IConfig extends Document {
  metodosPago: string[];
  mediosEnvio: string[];
  notaEnvio: string;
}

const ConfigSchema = new Schema<IConfig>(
  {
    metodosPago: { type: [String], default: [] },
    mediosEnvio: { type: [String], default: [] },
    notaEnvio: { type: String, default: '' },
  },
  { timestamps: true }
);

export const Config = mongoose.model<IConfig>('Config', ConfigSchema);
