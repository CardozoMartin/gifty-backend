import { Request, Response } from 'express';
import { ConfigRepository } from '../repositories/ConfigRepository';

const configRepo = new ConfigRepository();

// GET /api/config — público, para mostrar en la tienda
export const getConfig = async (_req: Request, res: Response): Promise<void> => {
  const config = await configRepo.get();
  res.json({ ok: true, data: config });
};

// PUT /api/config — protegido, solo admin
export const updateConfig = async (req: Request, res: Response): Promise<void> => {
  const { metodosPago, mediosEnvio, notaEnvio, compraMinima, descuentos, descuentoEfectivo } = req.body;
  const config = await configRepo.update({ metodosPago, mediosEnvio, notaEnvio, compraMinima, descuentos, descuentoEfectivo });
  res.json({ ok: true, data: config });
};
