import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import { createClient } from '@supabase/supabase-js';
import DataLoader from 'dataloader';
import dotenv from 'dotenv';
import ws from 'ws'; // <-- 1. Importa ws aquí
import { typeDefs } from './schema.js';

dotenv.config();

// 2. Inicializa el cliente pasando el transport de ws
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY,
  {
    auth: { persistSession: false },
    realtime: {
      transport: ws, // <-- Esto soluciona el error en Node.js 20
    },
  }
);
// Configuración del DataLoader para evitar el problema N+1
// Agrupa las peticiones de medicamentos por ID en una sola consulta a Supabase
const createMedicationLoader = () => {
  return new DataLoader(async (keys) => {
    console.log('[DataLoader Batch Query] Buscando IDs en lote:', keys);
    const { data, error } = await supabase
      .from('medications')
      .select('*')
      .in('id', keys);

    if (error) throw new Error(error.message);

    // Mapear los resultados para mantener el orden exacto de las keys solicitadas
    const medicationMap = {};
    data.forEach((med) => {
      medicationMap[med.id] = {
        ...med,
        activeIngredient: med.active_ingredient, // Mapeo de snake_case a camelCase si aplica
        requiresPrescription: med.requires_prescription
      };
    });

    return keys.map((key) => medicationMap[key] || null);
  });
};

// Resolvers
const resolvers = {
  Query: {
    medications: async (_, { search, category, limit = 20, offset = 0 }) => {
      let query = supabase.from('medications').select('*');

      if (search) {
        query = query.ilike('name', `%${search}%`);
      }
      if (category) {
        query = query.eq('category', category);
      }

      query = query.range(offset, offset + limit - 1);

      const { data, error } = await query;
      if (error) throw new Error(error.message);

      return data.map((med) => ({
        ...med,
        activeIngredient: med.active_ingredient,
        requiresPrescription: med.requires_prescription
      }));
    },

    medication: async (_, { id }, { medicationLoader }) => {
      // Usamos el DataLoader en lugar de hacer una consulta directa individual
      return await medicationLoader.load(id);
    }
  },

  Mutation: {
    createOrder: async (_, { items, prescription }) => {
      // Lógica de dominio CQRS / Comando: Validar stock e invariants
      let totalAmount = 0;
      let requiresPrescriptionValidation = false;

      for (const item of items) {
        const { data: med, error } = await supabase
          .from('medications')
          .select('*')
          .eq('id', item.medicationId)
          .single();

        if (error || !med) {
          return { success: false, message: `Medicamento con ID ${item.medicationId} no encontrado.` };
        }

        if (med.stock < item.quantity) {
          return { success: false, message: `Stock insuficiente para el medicamento: ${med.name}. Disponible: ${med.stock}` };
        }

        if (med.requires_prescription) {
          requiresPrescriptionValidation = true;
        }

        totalAmount += med.price * item.quantity;
      }

      // Si requiere receta y no se proporcionó el input de receta
      if (requiresPrescriptionValidation && !prescription) {
        return { 
          success: false, 
          message: 'Uno o más medicamentos seleccionados requieren prescripción médica obligatoria.' 
        };
      }

      // Simulación de creación de orden exitosa (puedes guardarla en otra tabla de Supabase si deseas)
      const mockOrder = {
        id: Math.floor(Math.random() * 1000).toString(),
        items: items.map(i => ({ medicationId: i.medicationId, quantity: i.quantity })),
        totalAmount,
        status: 'PENDING_APPROVAL',
        requiresPrescriptionValidation,
        createdAt: new Date().toISOString()
      };

      return {
        success: true,
        message: 'Pedido creado exitosamente y en proceso de validación.',
        order: mockOrder
      };
    }
  }
};

// Configurar Apollo Server pasando el contexto por cada petición (instanciando el DataLoader)
const server = new ApolloServer({
  typeDefs,
  resolvers,
});

const { url } = await startStandaloneServer(server, {
  listen: { port: process.env.PORT || 4000 },
  context: async () => {
    return {
      medicationLoader: createMedicationLoader(),
    };
  },
});

console.log(`🚀 Servidor backend listo y corriendo en: ${url}`);