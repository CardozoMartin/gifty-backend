import { Producto, IProducto } from '../models/Product';
import { Categoria } from '../types';

// Filtros opcionales para listar productos
interface FiltrosProducto {
  categoria?: Categoria;
  soloActivos?: boolean;
  busqueda?: string;
}

// Repositorio: capa de acceso a datos para Producto
// Toda la interacción con MongoDB pasa por aquí, sin lógica de negocio
export class ProductRepository {

  // Obtiene todos los productos aplicando filtros opcionales
  async findAll(filtros: FiltrosProducto = {}): Promise<IProducto[]> {
    const query: Record<string, unknown> = {};

    // Filtrar por categoría si se provee
    if (filtros.categoria) {
      query.categoria = filtros.categoria;
    }

    // Por defecto solo traemos los productos activos
    if (filtros.soloActivos !== false) {
      query.activo = true;
    }

    // Búsqueda por texto en nombre y descripción (índice text)
    if (filtros.busqueda) {
      query.$text = { $search: filtros.busqueda };
    }

    return Producto.find(query).sort({ createdAt: -1 });
  }

  // Busca un producto por su ID de MongoDB
  async findById(id: string): Promise<IProducto | null> {
    return Producto.findById(id);
  }

  // Busca un producto por su slug (para la URL pública)
  async findBySlug(slug: string): Promise<IProducto | null> {
    return Producto.findOne({ slug, activo: true });
  }

  // Crea un nuevo producto en la base de datos
  async create(datos: Partial<IProducto>): Promise<IProducto> {
    const nuevoProducto = new Producto(datos);
    return nuevoProducto.save();
  }

  // Actualiza un producto existente y devuelve el documento actualizado
  async update(id: string, datos: Partial<IProducto>): Promise<IProducto | null> {
    return Producto.findByIdAndUpdate(
      id,
      { $set: datos },
      { new: true, runValidators: true } // new: true devuelve el doc actualizado
    );
  }

  // Elimina un producto por ID (eliminación física)
  async delete(id: string): Promise<IProducto | null> {
    return Producto.findByIdAndDelete(id);
  }

  // Activa o desactiva un producto (eliminación lógica)
  async toggleActivo(id: string, activo: boolean): Promise<IProducto | null> {
    return Producto.findByIdAndUpdate(
      id,
      { $set: { activo } },
      { new: true }
    );
  }

  // Verifica si ya existe un producto con ese slug (para evitar duplicados)
  async existsBySlug(slug: string, excludeId?: string): Promise<boolean> {
    const query: Record<string, unknown> = { slug };
    if (excludeId) {
      query._id = { $ne: excludeId }; // excluye el propio producto al editar
    }
    const encontrado = await Producto.findOne(query).lean();
    return !!encontrado;
  }
}
