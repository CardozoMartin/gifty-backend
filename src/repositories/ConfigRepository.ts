import { Config, IConfig } from '../models/Config';

export class ConfigRepository {
  // Obtiene la config — si no existe la crea con valores por defecto
  async get(): Promise<IConfig> {
    let config = await Config.findOne();
    if (!config) {
      config = await Config.create({
        metodosPago: ['Mercado Pago 3 cuotas sin interés', 'Efectivo', 'Transferencia bancaria'],
        mediosEnvio: [
          'Punto de retiro en San Miguel de Tucumán',
          'Cadete o UberMoto a todo el Gran San Miguel de Tucumán',
          'Dispack para el interior de Tucumán y todo el NOA',
          'Vía Cargo y Correo Argentino al resto del país',
        ],
        notaEnvio: 'EL COSTO DEL ENVÍO SE CALCULARÁ ANTES DE FINALIZAR LA COMPRA AL INGRESAR TODOS TUS DATOS.',
      });
    }
    return config;
  }

  // Actualiza la config existente
  async update(datos: Partial<Pick<IConfig, 'metodosPago' | 'mediosEnvio' | 'notaEnvio' | 'compraMinima' | 'descuentos' | 'descuentoEfectivo'>>): Promise<IConfig> {
    const config = await this.get();
    Object.assign(config, datos);
    return config.save();
  }
}
