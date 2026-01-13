# Technical Documentation - GlowUp AI Salon Management

## Architecture Overview
GlowUp is a modern, AI-driven salon management platform built with a focus on premium user experience and intelligent automation.

### Frontend
- **Framework**: React 19 with Vite for fast development and optimized builds.
- **Language**: TypeScript for type safety and better developer experience.
- **Styling**: Custom CSS with a "Atelier" design system (Cream, Nude, Clay, Charcoal palettes).
- **Animations**: Framer Motion for smooth transitions and micro-interactions.
- **Data Visualization**: Recharts for administrative analytics.

### 1. Architecture Overview
The application follows a modern serverless architecture:
- **Frontend:** React 19 + Vite (TypeScript)
- **Backend-as-a-Service:** Supabase (Auth, Database, Storage)
- **AI Engine:** Google Gemini (Analysis & Recommendations)
- **Vision Engine:** Google Gemini (Image Manifesting)

### Supabase Project Configuration
- **Project Reference:** `nzavytneppcgxnlqccrm`
- **API URL:** `https://nzavytneppcgxnlqccrm.supabase.co`

### MCP (Model Context Protocol) Integration
To allow the AI agent to interact directly with your Supabase project, you can add the Supabase MCP server to your Gemini CLI:

```bash
gemini mcp add -t http supabase https://mcp.supabase.com/mcp?project_ref=nzavytneppcgxnlqccrm
```

Alternatively, add this to your `.gemini/settings.json`:
```json
{
  "mcpServers": {
    "supabase": {
      "httpUrl": "https://mcp.supabase.com/mcp?project_ref=nzavytneppcgxnlqccrm"
    }
  }
}
```
After adding, run `/mcp auth supabase` in the Gemini CLI to authenticate.

### Backend & Services
- **Authentication & Database**: Supabase provides secure user authentication and real-time database capabilities.
- **AI Integration**: Google Gemini AI powers the intelligent features of the platform.

---

## AI Integration Details

The `geminiService.ts` handles all interactions with the Google Gemini API.

### 1. Smart ChatBot
- **Model**: `gemini-3-flash-preview`
- **Purpose**: Provides instant answers to customer queries about hair care, pricing, and stylists.
- **System Instruction**: Configured as "GlowUp Salon's smart assistant" with specific pricing knowledge.

### 2. Administrative Insights
- **Model**: `gemini-3-flash-preview`
- **Purpose**: Analyzes booking patterns to identify peak hours and suggest promotional slots.
- **Output**: Returns structured JSON data for easy integration into the dashboard.

### 3. Virtual Try-On (AI Oracle)
- **Engine**: Google Gemini (`gemini-3-flash-preview` for analysis, `gemini-2.5-flash-image` for generation)
- **Purpose**: Personalized recommendations and visual try-on for hairstyles.
- **Mechanism**: Analyzes user facial structure and "manifests" chosen hairstyles using generative patterns to provide an aesthetic preview.

---

## Component Architecture

### Core Components
- `App.tsx`: The main orchestrator handling routing, authentication state, and role-based view rendering.
- `Sidebar.tsx`: Dynamic navigation that adapts based on the user's role (Admin, Stylist, Customer).
- `ChatBot.tsx`: A persistent floating assistant available throughout the application.

### Feature Modules
- **AdminDashboard**: Comprehensive overview of revenue, bookings, and AI-driven insights.
- **BookingEngine**: A multi-step booking flow with stylist selection and service customization.
- **VirtualTryOn**: Interface for uploading photos and requesting AI hairstyle modifications.
- **InventoryManager**: CRUD interface for tracking salon products and stock levels.
- **MasterCalendar**: A centralized view for managing all salon appointments.

---

## Data Models (Types)
Key types are defined in `types.ts`:
- `UserRole`: Enum for `ADMIN`, `STYLIST`, and `CUSTOMER`.
- `Appointment`: Interface for booking details.
- `Stylist`: Interface for staff information.
- `InventoryItem`: Interface for product tracking.
