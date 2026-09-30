export const typeDefs = `#graphql
  enum MedicationCategory {
    ANALGESICOS
    ANTIINFLAMATORIOS
    ANTIBIOTICOS
    ANTIHISTAMINICOS
    GASTROINTESTINALES
    CARDIOVASCULARES
    ANTIDIABETICOS
    RESPIRATORIOS
    SUPLEMENTOS
    ANTIMICOTICOS
    ANTIPARASITARIOS
    DERMATOLOGICOS
    SISTEMA_NERVIOSO
  }

  enum OrderStatus {
    PENDING_APPROVAL
    APPROVED
    DISPATCHED
    CANCELLED
  }

  type Medication {
    id: ID!
    sku: String!
    name: String!
    activeIngredient: String!
    category: MedicationCategory!
    dosage: String!
    presentation: String!
    price: Float!
    stock: Int!
    requiresPrescription: Boolean!
    manufacturer: String!
    description: String
  }

  type OrderItem {
    medication: Medication!
    quantity: Int!
    subtotal: Float!
  }

  input PrescriptionInput {
    doctorName: String!
    medicalLicense: String!
    digitalSignatureHash: String!
  }

  input OrderItemInput {
    medicationId: ID!
    quantity: Int!
  }

  type CreateOrderPayload {
    success: Boolean!
    message: String!
    order: Order
  }

  type Order {
    id: ID!
    items: [OrderItem!]!
    totalAmount: Float!
    status: OrderStatus!
    requiresPrescriptionValidation: Boolean!
    createdAt: String!
  }

  type Query {
    medications(search: String, category: MedicationCategory, limit: Int, offset: Int): [Medication!]!
    medication(id: ID!): Medication
    order(id: ID!): Order
  }

  type Mutation {
    createOrder(items: [OrderItemInput!]!, prescription: PrescriptionInput): CreateOrderPayload!
  }
`;