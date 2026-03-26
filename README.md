# Functional Design Workspace

A modern, type-safe full-stack monorepo built to demonstrate scalable software architecture. This project features a React frontend, a Node.js API server, and shared libraries for database schemas and API contracts, all managed efficiently within a `pnpm` workspace.

## 🌟 Project Highlights

* **End-to-End Type Safety**: Utilizes OpenAPI specifications to automatically generate Zod validation schemas and React Query hooks, ensuring perfect synchronization between the backend and frontend.
* **Modern UI/UX**: Built with React 19, Tailwind CSS v4, and Radix UI primitives for accessible, highly customizable, and responsive interfaces.
* **Robust Data Layer**: Implements Drizzle ORM for performant, type-safe database interactions.
* **Modular Architecture**: Strictly separates concerns into executable `artifacts` (apps/servers) and shared `lib` (packages/configurations).

---

## 🏗️ System Architecture

The project is structured as a monorepo utilizing `pnpm workspaces`. 

### Applications (`artifacts/`)
* **`vibecraft`**: The main user-facing web application. A Single Page Application (SPA) built with Vite, React, and Wouter for client-side routing.
* **`api-server`**: The backend RESTful API service built with Node.js, providing the core business logic and database interactions.
* **`mockup-sandbox`**: An isolated UI development environment for building, testing, and viewing React components independently of the main application state.

### Shared Libraries (`lib/`)
* **`api-spec`**: The single source of truth for the API contract, written in OpenAPI YAML format.
* **`api-zod`**: Auto-generated Zod schemas derived from the OpenAPI spec, used for runtime payload validation on the server.
* **`api-client-react`**: Auto-generated API client and React Query hooks for seamless, strongly-typed data fetching on the frontend.
* **`db`**: Database configuration, connection pooling, and Drizzle ORM schemas.

---

## 🚀 Technology Stack

**Frontend:**
* React 19 & Vite
* Tailwind CSS v4
* Radix UI (Headless Component Primitives)
* Framer Motion (Animations)
* Wouter (Routing)
* TanStack React Query (Data Fetching)

**Backend & Data:**
* Node.js
* Drizzle ORM
* Zod (Schema Validation)

**Tooling & Infrastructure:**
* TypeScript (Strict Mode)
* `pnpm` (Workspace Package Manager)
* OpenAPI & Orval (Client/Schema Generation)

---

## 🛠️ Getting Started

### Prerequisites
* **Node.js**: v20 or higher recommended.
* **pnpm**: This project strictly enforces `pnpm` for dependency management. 
  ```bash
  npm install -g pnpm
