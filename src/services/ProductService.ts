import { ProductRepository } from '../repositories/ProductRepository';
import { IProducto } from '../models/Product';
import { Categoria } from '../types';

// Genera un slug URL-amigable a partir del nombre del producto
// Ej: "Taza Stitch Grande" => "taza-stitch-grande"
const generateSlug = (nombre: string): string => {
  return nombre
    .toLowerCase()
    .normalize('NFD')                         // separa los acentos
    .replace(/[̀-ͯ]/g, '')          // elimina los diacríticos
    .replace(/[^a-z0-9\s-]/g, '')            // elimina caracteres especiales
    .trim()
    .replace(/\s+/g, '-');                    // reemplaza espacios por guiones
};

// Servicio de Producto: lógica de negocio sobre los datos del repositorio
export class ProductService {
  private readonly repositorio: ProductRepository;

  constructor() {
    this.repositorio = new ProductRepository();
  }

  // Devuelve la lista de productos con filtros opcionales
  async getProducts(categoria?: Categoria, busqueda?: string): Promise<IProducto[]> {
    return this.repositorio.findAll({ categoria, busqueda, soloActivos: true });
  }

  // Devuelve todos los productos incluyendo inactivos (para el panel admin)
  async getAllProductsAdmin(): Promise<IProducto[]> {
    return this.repositorio.findAll({ soloActivos: false });
  }

  // Busca un producto por ID para el panel admin
  async getProductById(id: string): Promise<IProducto> {
    const producto = await this.repositorio.findById(id);
    if (!producto) {
      throw new Error('Producto no encontrado');
    }
    return producto;
  }

  // Busca un producto por slug para la página pública de detalle
  async getProductBySlug(slug: string): Promise<IProducto> {
    const producto = await this.repositorio.findBySlug(slug);
    if (!producto) {
      throw new Error('Producto no encontrado');
    }
    return producto;
  }

  // Crea un nuevo producto generando el slug automáticamente
  async createProduct(datos: Partial<IProducto>): Promise<IProducto> {
    if (!datos.nombre) {
      throw new Error('El nombre del producto es obligatorio');
    }

    // Generamos el slug a partir del nombre
    let slug = generateSlug(datos.nombre);

    // Si el slug ya existe, le agregamos un sufijo numérico
    const yaExiste = await this.repositorio.existsBySlug(slug);
    if (yaExiste) {
      slug = `${slug}-${Date.now()}`;
    }

    return this.repositorio.create({ ...datos, slug });
  }

  // Actualiza un producto existente
  async updateProduct(id: string, datos: Partial<IProducto>): Promise<IProducto> {
    // Si cambió el nombre, regeneramos el slug
    if (datos.nombre) {
      const nuevoSlug = generateSlug(datos.nombre);
      const yaExiste = await this.repositorio.existsBySlug(nuevoSlug, id);
      datos.slug = yaExiste ? `${nuevoSlug}-${Date.now()}` : nuevoSlug;
    }

    const productoActualizado = await this.repositorio.update(id, datos);
    if (!productoActualizado) {
      throw new Error('Producto no encontrado');
    }
    return productoActualizado;
  }

  // Elimina un producto de forma permanente
  async deleteProduct(id: string): Promise<void> {
    const eliminado = await this.repositorio.delete(id);
    if (!eliminado) {
      throw new Error('Producto no encontrado');
    }
  }

  // Agrega la ruta de una imagen subida al array de imágenes del producto
  async addImage(id: string, rutaImagen: string): Promise<IProducto> {
    const producto = await this.repositorio.findById(id);
    if (!producto) {
      throw new Error('Producto no encontrado');
    }

    const imagenes = [...producto.imagenes, rutaImagen];
    const actualizado = await this.repositorio.update(id, { imagenes } as Partial<IProducto>);
    return actualizado!;
  }
}
