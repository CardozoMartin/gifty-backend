import mongoose from 'mongoose';

// Conecta la aplicación a MongoDB usando la URI del archivo .env
export const connectDatabase = async (): Promise<void> => {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error('La variable MONGODB_URI no está definida en el archivo .env');
  }

  try {
    await mongoose.connect(uri);
    console.log('✅ Conexión a MongoDB establecida correctamente');
  } catch (error) {
    console.error('❌ Error al conectar con MongoDB:', error);
    process.exit(1);
  }
};
