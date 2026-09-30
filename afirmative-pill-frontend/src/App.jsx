import React, { useState } from 'react';
import { gql } from '@apollo/client';
import { ApolloProvider, useQuery, useMutation } from '@apollo/client/react';
import { client } from './apollo';
import './App.css'; // <-- Importamos los estilos aquí

const GET_MEDICATIONS = gql`
  query GetMedications($search: String) {
    medications(search: $search, limit: 20) {
      id
      name
      activeIngredient
      presentation
      price
      stock
      requiresPrescription
    }
  }
`;

const CREATE_ORDER_MUTATION = gql`
  mutation CreateOrder($items: [OrderItemInput!]!, $prescription: PrescriptionInput) {
    createOrder(items: $items, prescription: $prescription) {
      success
      message
      order {
        id
        totalAmount
        status
        requiresPrescriptionValidation
      }
    }
  }
`;

const normalizeSearchText = (value) => value
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .trim();

function StoreComponent() {
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState([]);
  
  const [doctorName, setDoctorName] = useState('');
  const [medicalLicense, setMedicalLicense] = useState('');

  const { loading, error, data } = useQuery(GET_MEDICATIONS, {
    variables: { search: '' },
    notifyOnNetworkStatusChange: false,
  });

  const normalizedSearchTerm = normalizeSearchText(searchTerm);
  const medications = (data?.medications ?? []).filter((medication) => {
    if (!normalizedSearchTerm) return true;

    return [medication.name, medication.activeIngredient, medication.presentation]
      .some((field) => normalizeSearchText(field).includes(normalizedSearchTerm));
  });

  const [createOrder, { data: orderData, loading: orderLoading, error: orderError }] = useMutation(CREATE_ORDER_MUTATION);

  const addToCart = (medication) => {
    const existing = cart.find(item => item.id === medication.id);
    if (existing) {
      setCart(cart.map(item => item.id === medication.id ? { ...item, quantity: item.quantity + 1 } : item));
    } else {
      setCart([...cart, { ...medication, quantity: 1 }]);
    }
  };

  const handleCheckout = () => {
    const itemsInput = cart.map(item => ({
      medicationId: item.id,
      quantity: item.quantity
    }));

    const prescriptionInput = doctorName ? {
      doctorName,
      medicalLicense,
      digitalSignatureHash: "sig_mock_hash_sabana"
    } : null;

    createOrder({
      variables: {
        items: itemsInput,
        prescription: prescriptionInput
      }
    });
  };

  if (loading && !data) return <div className="app-container" style={{ textAlign: 'center', paddingTop: '40vh' }}><h2>Cargando catálogo farmacéutico...</h2></div>;
  if (error) return <div className="app-container" style={{ color: '#dc2626', textAlign: 'center', paddingTop: '40vh' }}><h2>Error al conectar con el servidor: {error.message}</h2></div>;

  return (
    <div className="app-container">
      
      <header className="app-header">
        <h1 className="app-title">Afirmative Pill</h1>
      </header>

      <div className="main-content">
        
        <div className="search-box">
          <input
            type="text"
            placeholder="Escribe y presiona Enter para buscar"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                setSearchTerm(searchInput.trim());
              }
            }}
            className="search-input"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => {
                setSearchInput('');
                setSearchTerm('');
              }}
              className="btn-back"
            >
              Volver al catálogo
            </button>
          )}
        </div>

        <div className="layout-grid">
          
          <div>
            <h2 className="section-title">Catálogo de Fármacos Disponibles</h2>
            <div className="meds-grid">
              {medications.map((med) => (
                <div key={med.id} className="med-card">
                  <div>
                    <h3 className="med-name">{med.name}</h3>
                    <p className="med-info">Principio: <span>{med.activeIngredient}</span></p>
                    <p className="med-info">Presentación: <span>{med.presentation}</span></p>
                    <p className="med-price">${med.price.toLocaleString()}</p>
                  </div>
                  
                  <div>
                    <div className="med-footer">
                      <span className="stock-badge" style={{ color: med.stock > 0 ? '#16a34a' : '#dc2626' }}>
                        Stock: {med.stock} un.
                      </span>
                      {med.requiresPrescription && (
                        <span className="prescription-badge">Requiere Fórmula</span>
                      )}
                    </div>
                    <button onClick={() => addToCart(med)} className="btn-primary">
                      Agregar al Carrito
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="cart-panel">
            <h2 className="section-title" style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '10px' }}>
              Tu Pedido Actual
            </h2>
            
            {cart.length === 0 ? (
              <p className="cart-empty">El carrito está vacío.</p>
            ) : (
              <div>
                <ul className="cart-list">
                  {cart.map((item, idx) => (
                    <li key={idx} className="cart-item">
                      <span style={{ color: '#334155' }}>{item.name} <strong style={{ color: '#0284c7' }}>(x{item.quantity})</strong></span>
                      <span style={{ fontWeight: 'bold', color: '#16a34a' }}>${(item.price * item.quantity).toLocaleString()}</span>
                    </li>
                  ))}
                </ul>

                <div className="prescription-form">
                  <h4 className="form-label">Validación de Receta Médica</h4>
                  <input 
                    type="text" 
                    placeholder="Nombre del Médico Tratante" 
                    value={doctorName} 
                    onChange={(e) => setDoctorName(e.target.value)} 
                    className="form-input"
                  />
                  <input 
                    type="text" 
                    placeholder="Nro. Licencia Médica" 
                    value={medicalLicense} 
                    onChange={(e) => setMedicalLicense(e.target.value)} 
                    className="form-input"
                  />
                </div>

                <button onClick={handleCheckout} disabled={orderLoading} className="btn-success">
                  {orderLoading ? 'Procesando...' : 'Procesar Compra'}
                </button>

                {orderData && (
                  <div className={`order-result ${orderData.createOrder.success ? 'order-success' : 'order-error'}`}>
                    <p style={{ margin: '0 0 3px 0', fontWeight: 'bold' }}>
                      {orderData.createOrder.message}
                    </p>
                    {orderData.createOrder.order && (
                      <p style={{ margin: 0, color: '#475569', fontSize: '11px' }}>
                        ID Orden: <code>{orderData.createOrder.order.id}</code> | Estado: <strong style={{ color: '#0284c7' }}>{orderData.createOrder.order.status}</strong>
                      </p>
                    )}
                  </div>
                )}

                {orderError && <p style={{ color: '#dc2626', fontSize: '11px', marginTop: '8px' }}>Error: {orderError.message}</p>}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ApolloProvider client={client}>
      <StoreComponent />
    </ApolloProvider>
  );
}