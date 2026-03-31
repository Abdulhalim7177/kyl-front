# Design Document: KYL Frontend Setup

## Overview

This design document outlines the technical approach for transforming a React + TypeScript + Vite boilerplate into the foundational frontend architecture for the "Know Your Leaders (KYL)" platform. The implementation will integrate shadcn/ui component library, establish routing infrastructure with React Router, configure TypeScript path aliases, and create the initial page structure.

## Architecture

### Technology Stack
- **React 18.3.1**: UI framework
- **TypeScript 5.5.3**: Type-safe JavaScript
- **Vite 5.4.1**: Build tool and dev server
- **React Router DOM**: Client-side routing
- **shadcn/ui**: Component library built on Radix UI
- **Tailwind CSS**: Utility-first CSS framework

### Project Structure
```
src/
├── components/        # shadcn/ui components
│   └── ui/           # UI component modules
├── lib/              # Utility functions
│   └── utils.ts      # Class name utilities for Tailwind
├── pages/            # Page components
│   ├── LandingPage.tsx
│   ├── AboutPage.tsx
│   ├── PoliticiansPage.tsx
│   └── PositionsPage.tsx
├── App.tsx           # Root component with routing
├── main.tsx          # Application entry point
└── index.css         # Global styles with Tailwind directives
```

## Component Design

### 1. Tailwind CSS Integration (Requirement 1.1)

**Configuration File**: `tailwind.config.js`
```typescript
export default {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [require("tailwindcss-animate")],
}
```

**Global Styles**: `src/index.css`
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

### 2. shadcn/ui Initialization (Requirements 1.2, 1.3, 1.4, 1.5)

**Configuration File**: `components.json`
```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "default",
  "rsc": false,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.js",
    "css": "src/index.css",
    "baseColor": "slate",
    "cssVariables": true
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils"
  }
}
```

**Utility Functions**: `src/lib/utils.ts`
```typescript
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

**Dependencies**:
- `tailwindcss`
- `tailwindcss-animate`
- `class-variance-authority`
- `clsx`
- `tailwind-merge`
- `@radix-ui/*` (installed per component)

### 3. TypeScript Path Configuration (Requirements 3.1, 3.2, 3.3, 3.4)

**tsconfig.json** (base configuration):
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

**tsconfig.app.json** (app-specific):
```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

**vite.config.ts** (build-time resolution):
```typescript
import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
```

### 4. React Router Setup (Requirements 2.1, 2.2, 2.3, 2.4, 2.5)

**App.tsx** (routing configuration):
```typescript
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import LandingPage from '@/pages/LandingPage'
import AboutPage from '@/pages/AboutPage'
import PoliticiansPage from '@/pages/PoliticiansPage'
import PositionsPage from '@/pages/PositionsPage'

function App() {
  return (
    <BrowserRouter>
      <nav>
        <Link to="/">Home</Link>
        <Link to="/about">About</Link>
        <Link to="/politicians">Politicians</Link>
        <Link to="/positions">Positions</Link>
      </nav>
      
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/politicians" element={<PoliticiansPage />} />
        <Route path="/positions" element={<PositionsPage />} />
        <Route path="*" element={<div>404 - Page Not Found</div>} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
```

### 5. Landing Page (Requirements 4.1, 4.2, 4.3, 4.4, 4.5)

**src/pages/LandingPage.tsx**:
```typescript
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'

export default function LandingPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-4">Know Your Leaders</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Welcome to KYL</CardTitle>
          <CardDescription>
            Empowering Nigerian citizens with information about political candidates
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p>
            Know Your Leaders (KYL) helps you make informed voting decisions by providing
            structured information about politicians contesting for political seats in Nigeria.
          </p>
          <Button className="mt-4">Explore Politicians</Button>
        </CardContent>
      </Card>
    </div>
  )
}
```

### 6. About Page (Requirements 5.1, 5.2, 5.3, 5.4, 5.5)

**src/pages/AboutPage.tsx**:
```typescript
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">About KYL</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Our Mission</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4">
            Know Your Leaders (KYL) is dedicated to promoting informed democratic
            participation in Nigeria by providing citizens with comprehensive,
            accessible information about political candidates.
          </p>
          <p>
            We believe that informed voters make better decisions. Our platform
            helps Nigerian citizens understand who their leaders are, what they
            stand for, and their track records.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
```

### 7. Placeholder Pages (Requirements 6.1, 6.2, 6.3, 6.4)

**src/pages/PoliticiansPage.tsx**:
```typescript
export default function PoliticiansPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold">Politicians</h1>
      <p className="mt-4">Browse politicians and their profiles.</p>
    </div>
  )
}
```

**src/pages/PositionsPage.tsx**:
```typescript
export default function PositionsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold">Political Positions</h1>
      <p className="mt-4">Explore different political positions and offices.</p>
    </div>
  )
}
```

## Implementation Approach

### Phase 1: Foundation Setup
1. Install and configure Tailwind CSS
2. Initialize shadcn/ui with configuration files
3. Configure TypeScript path aliases
4. Set up Vite path resolution

### Phase 2: Routing Infrastructure
1. Install react-router-dom
2. Configure BrowserRouter in App.tsx
3. Create route definitions
4. Implement navigation component

### Phase 3: Page Implementation
1. Create page directory structure
2. Implement Landing Page with shadcn/ui components
3. Implement About Page
4. Create placeholder pages (Politicians, Positions)

### Phase 4: Component Integration
1. Install initial shadcn/ui components (Button, Card)
2. Create utility functions for class name merging
3. Integrate components into pages

## Dependencies

### Production Dependencies
```json
{
  "react-router-dom": "^6.x",
  "class-variance-authority": "^0.7.0",
  "clsx": "^2.0.0",
  "tailwind-merge": "^2.0.0"
}
```

### Development Dependencies
```json
{
  "tailwindcss": "^3.3.0",
  "tailwindcss-animate": "^1.0.7",
  "autoprefixer": "^10.4.16",
  "postcss": "^8.4.31",
  "@types/node": "^20.x"
}
```

## Validation

### Build Validation (Requirement 8.3)
- TypeScript compilation must complete without errors
- Vite build must produce optimized production assets
- All path aliases must resolve correctly

### Development Validation (Requirement 8.2)
- Development server starts without errors
- Hot module replacement works correctly
- All routes are accessible

### Routing Validation (Requirements 2.3, 2.4, 2.5)
- Navigation between pages works without page reloads
- Unknown routes display 404 fallback
- Browser back/forward buttons work correctly

### Component Validation (Requirements 4.5, 5.5)
- shadcn/ui components render correctly
- Tailwind styles apply as expected
- Components are accessible and responsive

## Notes

- This design uses TypeScript for type safety throughout
- shadcn/ui components are installed on-demand using the CLI
- The design follows React best practices with functional components
- Tailwind CSS provides utility-first styling approach
- Path aliases (@/) simplify imports and improve maintainability
