import { Request, Response } from 'express';
import { ProductService } from '../services/ProductService';
import { Categoria } from '../types';

// Instancia del servicio que usa el controlador
const servicioProducto = new ProductService();

// GET /api/productos — lista pública con filtros opcionales
export const getProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    const { categoria, busqueda } = req.query;

    const productos = await servicioProducto.getProducts(
      categoria as Categoria | undefined,
      busqueda as string | undefined
    );

    res.json({ ok: true, datos: productos });
  } catch (error) {
    res.status(500).json({ ok: false, mensaje: 'Error al obtener productos' });
  }
};

// GET /api/admin/productos — lista completa para el panel admin
export const getProductsAdmin = async (_req: Request, res: Response): Promise<void> => {
  try {
    const productos = await servicioProducto.getAllProductsAdmin();
    res.json({ ok: true, datos: productos });
  } catch (error) {
    res.status(500).json({ ok: false, mensaje: 'Error al obtener productos' });
  }
};

// GET /api/productos/:slug — detalle público por slug
export const getProductBySlug = async (req: Request, res: Response): Promise<void> => {
  try {
    const { slug } = req.params;
    const producto = await servicioProducto.getProductBySlug(slug);
    res.json({ ok: true, datos: producto });
  } catch (error) {
    res.status(404).json({ ok: false, mensaje: 'Producto no encontrado' });
  }
};

// GET /api/admin/productos/:id — detalle por ID para el admin
export const getProductById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const producto = await servicioProducto.getProductById(id);
    res.json({ ok: true, datos: producto });
  } catch (error) {
    res.status(404).json({ ok: false, mensaje: 'Producto no encontrado' });
  }
};

// POST /api/admin/productos — crea un nuevo producto
export const createProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    // Los datos vienen del body (JSON) y las imágenes se suben aparte
    const datos = req.body;
    const producto = await servicioProducto.createProduct(datos);
    res.status(201).json({ ok: true, datos: producto });
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : 'Error al crear producto';
    res.status(400).json({ ok: false, mensaje });
  }
};

// PUT /api/admin/productos/:id — actualiza un producto existente
export const updateProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const datos = req.body;
    const producto = await servicioProducto.updateProduct(id, datos);
    res.json({ ok: true, datos: producto });
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : 'Error al actualizar producto';
    res.status(400).json({ ok: false, mensaje });
  }
};

// DELETE /api/admin/productos/:id — elimina un producto
export const deleteProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await servicioProducto.deleteProduct(id);
    res.json({ ok: true, mensaje: 'Producto eliminado correctamente' });
  } catch (error) {
    res.status(404).json({ ok: false, mensaje: 'Producto no encontrado' });
  }
};

// POST /api/admin/productos/:id/imagen — sube una imagen al producto
export const uploadProductImage = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!req.file) {
      res.status(400).json({ ok: false, mensaje: 'No se envió ninguna imagen' });
      return;
    }

    // multer-storage-cloudinary expone la URL pública en req.file.path
    const urlImagen = (req.file as any).path;
    const producto = await servicioProducto.addImage(id, urlImagen);

    res.json({ ok: true, datos: producto });
  } catch (error) {
    console.error('Error uploadProductImage:', JSON.stringify(error, null, 2));
    const mensaje = error instanceof Error ? error.message : JSON.stringify(error);
    res.status(400).json({ ok: false, mensaje });
  }
};
