import { Schema, model, Document } from 'mongoose';

export interface IUsuario extends Document {
  nombre: string;
  apellido?: string;
  email: string;
  password: string;
  empresa?: string;
  telefono?: string;
  dni?: string;
  direccion?: string;
  ciudad?: string;
  provincia?: string;
  codigoPostal?: string;
  verificado: boolean;
  tokenVerificacion?: string;
  tokenVerificacionExpira?: Date;
  tokenResetPassword?: string;
  tokenResetPasswordExpira?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const usuarioSchema = new Schema<IUsuario>(
  {
    nombre: { type: String, required: true, trim: true },
    apellido: { type: String, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    empresa: { type: String, trim: true },
    telefono: { type: String, trim: true },
    dni: { type: String, trim: true },
    direccion: { type: String, trim: true },
    ciudad: { type: String, trim: true },
    provincia: { type: String, trim: true },
    codigoPostal: { type: String, trim: true },
    verificado: { type: Boolean, default: false },
    tokenVerificacion: { type: String },
    tokenVerificacionExpira: { type: Date },
    tokenResetPassword: { type: String },
    tokenResetPasswordExpira: { type: Date },
  },
  { timestamps: true }
);

export const Usuario = model<IUsuario>('Usuario', usuarioSchema);
