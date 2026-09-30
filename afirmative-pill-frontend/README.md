# Afirmative-Pill: Sistema E-Commerce Farmacéutico (GraphQL & CQRS)

Repositorio oficial del taller práctico de patrones arquitectónicos. Este proyecto implementa una arquitectura moderna basada en **GraphQL (Cero REST)**, separación de modelos de lectura y escritura (**CQRS**), prevención de consultas N+1 mediante **DataLoader**, y persistencia en **PostgreSQL (Supabase)**.

---

## Stack Tecnológico

* **Backend:** Node.js 20, Apollo Server 4, GraphQL, DataLoader.
* **Base de Datos:** PostgreSQL (hospedado en Supabase) con índices optimizados y lógica de stock atómica.
* **Frontend:** React (Vite), Apollo Client, CSS modular.
* **Control de Versiones y Estándares:** Git/GitHub, patrones de comandos de dominio.

---

## Arquitectura y Escenarios Resueltos

### 1. Escenario A: Lecturas Optimizadas (Cero Over-Fetching)
* **Búsqueda Eficiente:** El cliente solicita únicamente los campos estrictamente necesarios (nombre, precio, presentación, stock) filtrando por nombre comercial o principio activo sin sobrecargar la red móvil.
* **Prevención de N+1:** Implementación de **DataLoader** en el backend para agrupar y lotificar las consultas concurrentes a relaciones en Supabase, evitando la degradación del rendimiento.

### 2. Escenario B: Comandos de Dominio e Invariantes (`createOrder`)
* **Validación de Prescripción:** Si algún fármaco seleccionado contiene la bandera `requiresPrescription = true`, la mutación exige obligatoriamente los metadatos de la fórmula médica (médico, licencia, hash de firma digital).
* **Control de Stock:** Verificación atómica de disponibilidad en bodega y decremento consistente de inventario.

### 3. Escenario C: Proyección y Consistencia Eventual
* Retorno estructurado de la orden proyectada con su costo total, detalle de ítems y estados operacionales claramente definidos (`PENDING_APPROVAL`, `APPROVED`, `DISPATCHED`, `CANCELLED`).

---

## Guía de Instalación y Ejecución Local

### Prerrequisitos
* Node.js (versión 20 o superior recomendada).
* Git instalado.

### 1. Clonar el Repositorio
```bash
git clone [https://github.com/gabs0408/Taller-Practico---Afirmative-Pill.git](https://github.com/gabs0408/Taller-Practico---Afirmative-Pill.git)
cd Taller-Practico---Afirmative-Pill
2. Configurar y Ejecutar el Backend
Bash
cd afirmative-pill-backend
npm install
npm run dev
(El servidor GraphQL correrá por defecto en http://localhost:4000/)

3. Configurar y Ejecutar el Frontend
Abre una nueva terminal, navega a la carpeta del frontend e inicia la aplicación:

Bash
cd afirmative-pill-frontend
npm install
npm run dev
(Vite abrirá la interfaz visual en http://localhost:5173/)
