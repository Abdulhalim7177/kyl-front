# KYL (Know Your Leaders) - Developer Handover Document

## 📋 Table of Contents
1. [Project Overview](#project-overview)
2. [Current Implementation Status](#current-implementation-status)
3. [Technology Stack](#technology-stack)
4. [Project Structure](#project-structure)
5. [Authentication & Authorization](#authentication--authorization)
6. [API Integration Guide](#api-integration-guide)
7. [Development Roadmap](#development-roadmap)
8. [Sprint Planning](#sprint-planning)
9. [Code Standards & Best Practices](#code-standards--best-practices)
10. [Getting Started](#getting-started)

---

## 🎯 Project Overview

**KYL (Know Your Leaders)** is a civic technology platform designed to promote informed democratic participation in Nigeria. The platform provides comprehensive information about Nigerian politicians, their track records, and policy positions to help citizens make informed voting decisions.

### Key Features
- **Public Portal**: Landing page, About page, Politicians directory, Positions directory
- **Admin Dashboard**: Comprehensive admin panel for managing users, candidates, elections, parties, and districts
- **User Management**: Role-based access control with multiple admin levels (Super Admin, Party Admin, Support Admin)
- **Candidate Management**: Track candidates across different political positions and elections
- **Activity Logging**: Monitor all administrative actions

### Target Users
1. **Citizens**: Browse politician profiles and make informed voting decisions
2. **Administrators**: Manage platform data, users, and content
3. **Party Officials**: Manage party-specific information and candidates

---

## ✅ Current Implementation Status

### Completed Features

#### 1. **Frontend Foundation** ✓
- ✅ Vite + React + TypeScript setup
- ✅ Tailwind CSS v4 configuration
- ✅ shadcn/ui component library integration
- ✅ Path aliases configured (@/* mapping)
- ✅ React Router DOM for navigation
- ✅ Responsive design (mobile-first approach)

#### 2. **Authentication System** ✓
- ✅ Login page with API integration
- ✅ JWT token-based authentication
- ✅ Protected routes (ProtectedRoute component)
- ✅ Public routes (PublicRoute component)
- ✅ Auth context for global state management
- ✅ Logout functionality
- ✅ Token storage in localStorage

#### 3. **Public Pages** ✓
- ✅ Landing Page (hero section, features, CTA)
- ✅ About Page (mission, values, vision)
- ✅ Politicians Page (placeholder - coming soon)
- ✅ Positions Page (placeholder - coming soon)
- ✅ Navigation component with mobile menu

#### 4. **Admin Dashboard** ✓
- ✅ Dashboard overview with statistics
- ✅ Stats cards (Users, Political Parties, Elections, Candidates)
- ✅ Recent Candidates table
- ✅ Recent Activity feed
- ✅ Registration Trends chart (placeholder)
- ✅ Responsive layout with sidebar navigation
- ✅ Mobile-friendly hamburger menu

#### 5. **User Management** ✓
- ✅ Users list with table view
- ✅ Search and filter functionality (UI only)
- ✅ Batch selection with checkboxes
- ✅ Batch actions (Delete, Deactivate, Change Role)
- ✅ Confirmation dialogs for destructive actions
- ✅ Role badges and status indicators
- ✅ Pagination UI (static)

#### 6. **UI Components** ✓
- ✅ Button, Card, Input, Select, Checkbox
- ✅ Table, Avatar, Badge, Alert Dialog
- ✅ Dropdown Menu, Sheet (mobile drawer)
- ✅ AnimatedConfirmDialog (custom component)
- ✅ AdminLayout (sidebar + header layout)

### Not Yet Implemented

#### API Integration (0% Complete)
- ❌ Candidates CRUD operations
- ❌ Elections management
- ❌ Political Parties management
- ❌ Districts (States, Senatorial, Federal House, State House, LGA, Wards)
- ❌ User management API calls
- ❌ Activity logs fetching
- ❌ Role and permissions management

#### Features (0% Complete)
- ❌ Candidates management pages
- ❌ Elections management pages
- ❌ Political Parties management pages
- ❌ Districts management pages
- ❌ Offices management
- ❌ Elected Officials management
- ❌ Blogs/Content management
- ❌ Activity Logs viewer
- ❌ Profile management
- ❌ Password reset flow
- ❌ Real-time notifications

---

## 🛠 Technology Stack

### Frontend
- **Framework**: React 18.3.1
- **Build Tool**: Vite 5.4.1
- **Language**: TypeScript 5.5.3
- **Styling**: Tailwind CSS 4.2.2
- **UI Components**: shadcn/ui (Radix UI primitives)
- **Routing**: React Router DOM 7.13.2
- **Icons**: Lucide React 1.8.0, React Icons 5.6.0
- **Animations**: Framer Motion 12.38.0
- **Charts**: Recharts 2.15.4

### Backend API
- **Base URL**: `https://kyl.aitshub.com.ng/api/v1`
- **Authentication**: Bearer Token (JWT)
- **Content Type**: `application/json` and `multipart/form-data`

### Development Tools
- **Linting**: ESLint 9.9.0
- **Package Manager**: npm
- **Version Control**: Git

---

## 📁 Project Structure

```
kyl-front/
├── public/
│   ├── frame-51.png          # KYL logo
│   └── vite.svg
├── src/
│   ├── assets/               # Static assets
│   ├── components/
│   │   ├── ui/              # shadcn/ui components
│   │   │   ├── alert-dialog.tsx
│   │   │   ├── avatar.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── checkbox.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── dropdown-menu.tsx
│   │   │   ├── input.tsx
│   │   │   ├── select.tsx
│   │   │   ├── sheet.tsx
│   │   │   ├── table.tsx
│   │   │   └── textarea.tsx
│   │   ├── AdminLayout.tsx   # Admin sidebar + header layout
│   │   └── AnimatedConfirmDialog.tsx  # Custom confirmation dialog
│   ├── contexts/
│   │   └── AuthContext.tsx   # Authentication state management
│   ├── lib/
│   │   └── utils.ts          # Utility functions (cn, etc.)
│   ├── pages/
│   │   ├── AboutPage.tsx
│   │   ├── DashboardPage.tsx
│   │   ├── LandingPage.tsx
│   │   ├── LoginPage.tsx
│   │   ├── PoliticiansPage.tsx
│   │   ├── PositionsPage.tsx
│   │   └── UsersManagementPage.tsx
│   ├── services/
│   │   └── auth.ts           # Authentication API service
│   ├── App.css
│   ├── App.tsx               # Main app component with routes
│   ├── index.css             # Global styles + Tailwind imports
│   ├── main.tsx              # App entry point
│   └── vite-env.d.ts
├── .gitignore
├── components.json           # shadcn/ui configuration
├── eslint.config.js
├── index.html
├── package.json
├── postcss.config.js
├── tailwind.config.js
├── tsconfig.json
├── vite.config.ts
└── README.md
```

---

## 🔐 Authentication & Authorization

### Authentication Flow

1. **Login**:
   - User enters email and password
   - POST request to `/api/v1/users/login` with FormData
   - Response contains `token` and `user` object
   - Token stored in `localStorage` as `auth_token`
   - User object stored in `localStorage` as `auth_user`

2. **Protected Routes**:
   - `ProtectedRoute` component checks `isAuthenticated` from AuthContext
   - If not authenticated, redirects to `/k8s9d7f3-auth-login`
   - If authenticated, renders the protected content

3. **Logout**:
   - GET request to `/api/v1/users/logout` with Bearer token
   - Clears `auth_token` and `auth_user` from localStorage
   - Redirects to login page

### User Roles
- **Super Admin**: Full system access (National level)
- **Party Admin**: Party-specific management (National level)
- **Support Admin**: Limited administrative access (State level)
- **Party Support Admin**: Party-specific support (State level)

### Permission System
Each user has a `permissions` array with permission objects:
```typescript
{
  id: number
  name: string
  module_id: number
}
```

Use `hasPermission(permissionName: string)` method to check permissions.

---

## 🔌 API Integration Guide

### Base Configuration

```typescript
const API_BASE_URL = 'https://kyl.aitshub.com.ng/api/v1'

// Headers for authenticated requests
const headers = {
  'Accept': 'application/json',
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
}
```

### API Endpoints Reference


#### 1. Users Management

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/users/create-user/` | Create new user | ✓ |
| GET | `/users/show-user/{id}` | Get single user | ✓ |
| GET | `/users/get-users` | Get all users | ✓ |
| GET | `/users/get-party-users/{party_id}` | Get party users | ✓ |
| GET | `/users/get-state-users` | Get state users | ✓ |
| PATCH | `/users/update-user/{id}` | Update user/Activate/Deactivate | ✓ |
| PUT | `/users/update-profile/{id}` | Update profile | ✓ |
| PATCH | `/users/toggle-user/{id}` | Toggle user status | ✓ |
| DELETE | `/users/delete-user/{id}` | Delete user | ✓ |
| POST | `/users/forgot-password` | Request password reset token | ✗ |
| POST | `/users/reset-password` | Reset password using token | ✗ |
| POST | `/users/update-password/{id}` | Update user password | ✓ |

#### 2. Candidates Management

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/candidates/create-candidate/` | Create candidate | ✓ |
| POST | `/candidates/check-candidate` | Check candidate | ✓ |
| GET | `/candidates/find-candidate/{id}` | Find candidate | ✓ |
| POST | `/candidates/view-party-president` | President/Vice candidates | ✓ |
| POST | `/candidates/view-party-governors` | Governatorial/Deputy candidates | ✓ |
| POST | `/candidates/party-state-senators` | Senatorial candidates | ✓ |
| POST | `/candidates/party-state-reps` | Reps candidates | ✓ |
| POST | `/candidates/party-state-members` | Assembly candidates | ✓ |
| POST | `/candidates/party-state-lgas` | LGA candidates | ✓ |
| POST | `/candidates/party-lga-wards` | Ward candidates | ✓ |
| POST | `/candidates/view-district-candidates` | View district candidates | ✓ |
| PATCH | `/candidates/update-candidate/{id}` | Update candidate | ✓ |
| DELETE | `/candidates/delete-candidate/{id}` | Delete candidate | ✓ |

#### 3. Elections Management

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/elections/` | Get all elections | ✓ |
| POST | `/elections/create-election/` | Create election | ✓ |
| GET | `/elections/get-election/{id}` | Get election | ✓ |
| GET | `/elections/get-active-election/` | Get active election | ✓ |
| POST | `/elections/update-election/` | Update election | ✓ |
| DELETE | `/elections/delete-election/{id}` | Delete election | ✓ |

#### 4. Political Parties Management

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/parties/` | Get all parties | ✓ |
| GET | `/parties/get-party/{id}` | Get party | ✓ |
| PATCH | `/parties/update-party/{id}` | Update party/Activate/Deactivate | ✓ |
| POST | `/parties/create-party-chairman/` | Create party chairman | ✓ |
| GET | `/parties/all-party-chairmen/{id}` | Get all party chairmen | ✓ |
| GET | `/parties/get-party-chairman/{id}` | Get party chairman | ✓ |
| PATCH | `/parties/update-party-chairman/{id}` | Update party chairman | ✓ |
| DELETE | `/parties/delete-party-chairman/{id}` | Delete party chairman | ✓ |

#### 5. Districts Management

**States**
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/districts/get-states` | Get all states | ✓ |
| GET | `/districts/find-state/{id}` | Find state | ✓ |

**Senatorial Districts**
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/districts/get-senatorial-districts` | Get all senatorial districts | ✓ |
| GET | `/districts/find-state-senatorial-districts/{id}` | Find state senatorial districts | ✓ |
| GET | `/districts/find-senatorial-district/{id}` | Find senatorial district | ✓ |

**Federal House Districts**
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/districts/get-federal-house-districts` | Get all federal house districts | ✓ |
| GET | `/districts/find-state-federal-house-districts/{id}` | Find state federal house districts | ✓ |
| GET | `/districts/find-federal-house-district/{id}` | Find federal house district | ✓ |

**State House Districts**
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/districts/get-state-house-districts` | Get all state house districts | ✓ |
| GET | `/districts/find-state-state-house-districts/{id}` | Find state state house districts | ✓ |
| GET | `/districts/find-state-house-district/{id}` | Find state house district | ✓ |

**LGA Districts**
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/districts/get-lga-districts` | Get all LGA districts | ✓ |
| GET | `/districts/find-state-lga-districts/{id}` | Find state LGA districts | ✓ |
| GET | `/districts/find-senate-lga-districts/{id}` | Find senate LGA districts | ✓ |
| GET | `/districts/find-lga-district/{id}` | Find LGA district | ✓ |
| GET | `/districts/find-lga-wards/{id}` | Find LGA wards | ✓ |

#### 6. Roles & Permissions

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/permissions/get-user-roles` | Get user roles | ✓ |
| GET | `/permissions/get-party-roles` | Get party roles | ✓ |
| GET | `/permissions/get-state-roles` | Get roles for state or party | ✓ |
| GET | `/permissions/get-role-permissions/{id}` | Get role permissions | ✓ |

#### 7. Positions

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/positions/get-positions` | Get candidates positions | ✓ |
| GET | `/positions/find-position/{id}` | Find particular position | ✓ |

#### 8. Activity Logs

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/users/activity-logs` | View all activity logs | ✓ |
| GET | `/users/range-activity-logs` | View activity logs within date range | ✓ |
| GET | `/users/user-activity-logs` | View activity logs for a user | ✓ |
| GET | `/users/user-range-activity-logs` | View activity logs for user within date range | ✓ |

### API Service Pattern

Create service files in `src/services/` for each module:

```typescript
// Example: src/services/candidates.ts
const API_BASE_URL = 'https://kyl.aitshub.com.ng/api/v1'

export interface Candidate {
  id: number
  name: string
  party_id: number
  position_id: number
  state_id: number
  status: 'Active' | 'Pending' | 'Inactive'
  // ... other fields
}

class CandidateService {
  private getAuthHeaders() {
    const token = localStorage.getItem('auth_token')
    return {
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  }

  async getAllCandidates(): Promise<Candidate[]> {
    const response = await fetch(`${API_BASE_URL}/candidates/`, {
      method: 'GET',
      headers: this.getAuthHeaders()
    })
    
    if (!response.ok) {
      throw new Error('Failed to fetch candidates')
    }
    
    const data = await response.json()
    return data.data
  }

  async createCandidate(candidateData: Partial<Candidate>): Promise<Candidate> {
    const response = await fetch(`${API_BASE_URL}/candidates/create-candidate/`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(candidateData)
    })
    
    if (!response.ok) {
      throw new Error('Failed to create candidate')
    }
    
    const data = await response.json()
    return data.data
  }

  // ... other methods
}

export const candidateService = new CandidateService()
```

---

## 🗺 Development Roadmap

### Phase 1: Core Admin Features (Sprints 1-3)
**Goal**: Complete all CRUD operations for core entities

#### Sprint 1: Candidates Management (2 weeks)
- Create candidates list page
- Implement candidate creation form
- Add candidate edit functionality
- Implement candidate deletion
- Add candidate filtering by party, position, state
- Integrate all candidate API endpoints

#### Sprint 2: Elections & Parties Management (2 weeks)
- Create elections management page
- Implement election CRUD operations
- Create political parties management page
- Implement party CRUD operations
- Add party chairman management
- Integrate elections and parties API endpoints

#### Sprint 3: Districts Management (2 weeks)
- Create districts overview page
- Implement states listing
- Add senatorial districts view
- Add federal house districts view
- Add state house districts view
- Add LGA and wards management
- Integrate all districts API endpoints

### Phase 2: User Management Enhancement (Sprints 4-5)

#### Sprint 4: User Management API Integration (1 week)
- Connect user list to API
- Implement user creation with API
- Add user edit functionality
- Implement user deletion with API
- Add user status toggle
- Implement search and filtering

#### Sprint 5: Roles & Permissions (1 week)
- Create roles management page
- Implement role assignment
- Add permissions viewer
- Implement permission management
- Add role-based UI rendering

### Phase 3: Activity & Monitoring (Sprint 6)

#### Sprint 6: Activity Logs & Monitoring (1 week)
- Create activity logs viewer page
- Implement date range filtering
- Add user-specific activity logs
- Create activity log export functionality
- Add real-time activity notifications

### Phase 4: Content Management (Sprints 7-8)

#### Sprint 7: Offices & Officials (1 week)
- Create offices management page
- Implement office CRUD operations
- Create elected officials page
- Add officials management features

#### Sprint 8: Blogs & Content (1 week)
- Create blogs management page
- Implement blog CRUD operations
- Add rich text editor
- Implement blog categories
- Add blog publishing workflow

### Phase 5: Public Portal Enhancement (Sprints 9-10)

#### Sprint 9: Politicians Directory (1 week)
- Design politicians listing page
- Implement politician profile pages
- Add search and filtering
- Integrate with candidates API
- Add politician comparison feature

#### Sprint 10: Positions & Policy Tracker (1 week)
- Design positions listing page
- Implement position detail pages
- Add policy tracking features
- Create voting records display

### Phase 6: Advanced Features (Sprints 11-12)

#### Sprint 11: Dashboard Analytics (1 week)
- Integrate real data into dashboard stats
- Implement registration trends chart with real data
- Add more analytics widgets
- Create custom date range filters
- Add data export functionality

#### Sprint 12: Profile & Settings (1 week)
- Create user profile page
- Implement profile editing
- Add password change functionality
- Implement password reset flow
- Add user preferences

---

## 📅 Sprint Planning

### Sprint Template

Each sprint should follow this structure:

#### Sprint Planning Meeting (Day 1)
- Review sprint goals
- Break down user stories into tasks
- Estimate task complexity
- Assign tasks to developers
- Set sprint success criteria

#### Daily Standups (15 minutes)
- What did you complete yesterday?
- What will you work on today?
- Any blockers?

#### Sprint Review (Last Day)
- Demo completed features
- Gather feedback
- Update product backlog

#### Sprint Retrospective (Last Day)
- What went well?
- What could be improved?
- Action items for next sprint

### Sprint 1 Example: Candidates Management

**User Stories**:
1. As an admin, I want to view all candidates so I can manage them
2. As an admin, I want to create a new candidate so I can add them to the system
3. As an admin, I want to edit candidate information so I can keep data up-to-date
4. As an admin, I want to delete candidates so I can remove invalid entries
5. As an admin, I want to filter candidates by party, position, and state

**Tasks**:

**Day 1-2: Setup & API Integration**
- [ ] Create `src/services/candidates.ts` service file
- [ ] Implement `getAllCandidates()` method
- [ ] Implement `getCandidateById()` method
- [ ] Implement `createCandidate()` method
- [ ] Implement `updateCandidate()` method
- [ ] Implement `deleteCandidate()` method
- [ ] Test all API methods

**Day 3-4: Candidates List Page**
- [ ] Create `src/pages/CandidatesPage.tsx`
- [ ] Implement table layout with columns: Name, Party, Position, State, Status, Actions
- [ ] Add loading state
- [ ] Add error handling
- [ ] Implement pagination
- [ ] Add search functionality
- [ ] Add filter dropdowns (Party, Position, State, Status)

**Day 5-6: Create Candidate Form**
- [ ] Create `src/components/CandidateForm.tsx`
- [ ] Add form fields: Name, Party, Position, State, Bio, Photo
- [ ] Implement form validation
- [ ] Add photo upload functionality
- [ ] Connect to create API
- [ ] Add success/error notifications

**Day 7-8: Edit & Delete Functionality**
- [ ] Implement edit modal/page
- [ ] Pre-populate form with candidate data
- [ ] Connect to update API
- [ ] Add delete confirmation dialog
- [ ] Connect to delete API
- [ ] Update list after edit/delete

**Day 9-10: Testing & Polish**
- [ ] Test all CRUD operations
- [ ] Test filtering and search
- [ ] Fix bugs
- [ ] Improve UI/UX
- [ ] Add loading skeletons
- [ ] Write documentation

---

## 📝 Code Standards & Best Practices

### File Naming Conventions
- **Components**: PascalCase (e.g., `CandidateForm.tsx`)
- **Services**: camelCase (e.g., `candidates.ts`)
- **Utilities**: camelCase (e.g., `formatDate.ts`)
- **Pages**: PascalCase with "Page" suffix (e.g., `CandidatesPage.tsx`)

### Component Structure

```typescript
// 1. Imports
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { candidateService } from '@/services/candidates'

// 2. Types/Interfaces
interface CandidateFormProps {
  candidateId?: number
  onSuccess?: () => void
}

// 3. Component
export default function CandidateForm({ candidateId, onSuccess }: CandidateFormProps) {
  // 4. State
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  // 5. Effects
  useEffect(() => {
    // Load data
  }, [candidateId])
  
  // 6. Handlers
  const handleSubmit = async (e: FormEvent) => {
    // Handle form submission
  }
  
  // 7. Render
  return (
    <form onSubmit={handleSubmit}>
      {/* Form content */}
    </form>
  )
}
```

### State Management
- Use `useState` for local component state
- Use `useContext` for global state (Auth, Theme, etc.)
- Consider React Query for server state management (optional)

### Error Handling

```typescript
try {
  const data = await candidateService.getAllCandidates()
  setCandidates(data)
} catch (error) {
  if (error instanceof Error) {
    setError(error.message)
  } else {
    setError('An unexpected error occurred')
  }
  console.error('Failed to fetch candidates:', error)
}
```

### API Response Handling

```typescript
// Expected API response format
interface ApiResponse<T> {
  success: boolean
  data: T
  message: string
}

// Handle response
const response = await fetch(url)
const json: ApiResponse<Candidate[]> = await response.json()

if (!json.success) {
  throw new Error(json.message)
}

return json.data
```

### TypeScript Best Practices
- Always define interfaces for API responses
- Use strict type checking
- Avoid `any` type - use `unknown` if type is truly unknown
- Use optional chaining (`?.`) and nullish coalescing (`??`)

### Styling Guidelines
- Use Tailwind CSS utility classes
- Follow mobile-first responsive design
- Use shadcn/ui components for consistency
- Custom colors: Primary green `#146c4f`, Secondary `#187555`
- Maintain consistent spacing (4px, 8px, 12px, 16px, 24px, 32px)

### Git Workflow
1. Create feature branch: `git checkout -b feature/candidates-management`
2. Make commits with clear messages: `git commit -m "feat: add candidate creation form"`
3. Push to remote: `git push origin feature/candidates-management`
4. Create Pull Request
5. Code review
6. Merge to main

### Commit Message Convention
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes (formatting, etc.)
- `refactor:` Code refactoring
- `test:` Adding tests
- `chore:` Maintenance tasks

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- Git
- Code editor (VS Code recommended)

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd kyl-front
```

2. **Install dependencies**
```bash
npm install
```

3. **Start development server**
```bash
npm run dev
```

The app will be available at `http://localhost:5173`

4. **Build for production**
```bash
npm run build
```

5. **Preview production build**
```bash
npm run preview
```

### Environment Variables

Create a `.env` file in the root directory:

```env
VITE_API_BASE_URL=https://kyl.aitshub.com.ng/api/v1
```

Access in code:
```typescript
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
```

### Testing Credentials

For development/testing, use these credentials:
- **Email**: (Ask project lead)
- **Password**: (Ask project lead)

### Available Routes

**Public Routes**:
- `/` - Landing Page
- `/about` - About Page
- `/politicians` - Politicians Directory (placeholder)
- `/positions` - Positions Directory (placeholder)
- `/k8s9d7f3-auth-login` - Login Page

**Protected Routes** (require authentication):
- `/k8s9d7f3-admin-panel` - Admin Dashboard
- `/k8s9d7f3-users` - User Management

### Project Commands

```bash
# Development
npm run dev          # Start dev server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint

# Adding shadcn/ui components
npx shadcn@latest add <component-name>
```

---

## 🎨 Design System

### Colors
```css
/* Primary Colors */
--primary: #146c4f;        /* Nigerian green */
--primary-hover: #115a42;
--primary-light: #187555;

/* Status Colors */
--success: #10b981;        /* emerald-500 */
--warning: #f59e0b;        /* amber-500 */
--error: #ef4444;          /* red-500 */
--info: #3b82f6;           /* blue-500 */

/* Neutral Colors */
--gray-50: #f9fafb;
--gray-100: #f3f4f6;
--gray-200: #e5e7eb;
--gray-500: #6b7280;
--gray-900: #111827;
```

### Typography
- **Font Family**: System font stack (sans-serif)
- **Headings**: Bold, tight line-height
- **Body**: Regular, relaxed line-height
- **Small Text**: 0.875rem (14px)
- **Base Text**: 1rem (16px)
- **Large Text**: 1.125rem (18px)

### Spacing Scale
- `xs`: 4px
- `sm`: 8px
- `md`: 16px
- `lg`: 24px
- `xl`: 32px
- `2xl`: 48px

### Component Patterns

**Card with Shadow**:
```tsx
<Card className="shadow-md border border-gray-100">
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent>
    Content
  </CardContent>
</Card>
```

**Status Badge**:
```tsx
<span className="flex items-center gap-1.5">
  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
  <span className="text-emerald-600 font-semibold">Active</span>
</span>
```

**Action Button**:
```tsx
<Button className="bg-primary hover:bg-primary/90">
  <Plus className="w-4 h-4 mr-2" />
  Add Item
</Button>
```

---

## 🐛 Common Issues & Solutions

### Issue 1: CORS Errors
**Problem**: API requests blocked by CORS policy

**Solution**: Ensure backend has proper CORS headers. For development, you can use a proxy in `vite.config.ts`:

```typescript
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'https://kyl.aitshub.com.ng',
        changeOrigin: true,
      }
    }
  }
})
```

### Issue 2: Authentication Token Expired
**Problem**: 401 Unauthorized errors

**Solution**: Implement token refresh logic or redirect to login:

```typescript
if (response.status === 401) {
  localStorage.removeItem('auth_token')
  localStorage.removeItem('auth_user')
  window.location.href = '/k8s9d7f3-auth-login'
}
```

### Issue 3: Build Errors
**Problem**: TypeScript errors during build

**Solution**: 
1. Check for type mismatches
2. Ensure all imports are correct
3. Run `npm run lint` to identify issues
4. Fix type errors before building

---

## 📚 Additional Resources

### Documentation
- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [shadcn/ui](https://ui.shadcn.com)
- [React Router](https://reactrouter.com)
- [Vite](https://vitejs.dev)

### Tools
- [VS Code](https://code.visualstudio.com)
- [React Developer Tools](https://react.dev/learn/react-developer-tools)
- [Postman](https://www.postman.com) - API testing

### VS Code Extensions (Recommended)
- ESLint
- Prettier
- Tailwind CSS IntelliSense
- TypeScript Vue Plugin (Volar)
- GitLens

---

## 👥 Team Communication

### Questions & Clarifications
- For API-related questions, contact backend team
- For design questions, refer to UI designs in `/ui designs` folder
- For feature clarifications, consult with project lead

### Code Review Checklist
- [ ] Code follows project conventions
- [ ] TypeScript types are properly defined
- [ ] Error handling is implemented
- [ ] Loading states are handled
- [ ] Responsive design is maintained
- [ ] No console errors
- [ ] Code is commented where necessary
- [ ] API integration is tested

---

## 📊 Success Metrics

### Sprint Success Criteria
- All user stories completed
- No critical bugs
- Code reviewed and approved
- Features tested on mobile and desktop
- Documentation updated

### Project Success Criteria
- All API endpoints integrated
- All admin features functional
- Public portal complete
- Mobile responsive
- Performance optimized (Lighthouse score > 90)
- Accessibility compliant (WCAG 2.1 AA)

---

## 🔄 Next Steps

### Immediate Actions (Week 1)
1. Set up development environment
2. Review codebase and documentation
3. Test existing features
4. Ask clarifying questions
5. Plan Sprint 1

### Short-term Goals (Month 1)
1. Complete Sprints 1-3 (Core Admin Features)
2. Establish development workflow
3. Set up CI/CD pipeline (optional)
4. Create component library documentation

### Long-term Goals (Months 2-3)
1. Complete all admin features
2. Enhance public portal
3. Implement advanced features
4. Optimize performance
5. Prepare for production deployment

---

## 📞 Support & Contact

For questions or issues:
1. Check this documentation first
2. Review existing code examples
3. Consult with team members
4. Reach out to project lead

---

**Document Version**: 1.0  
**Last Updated**: April 16, 2026  
**Prepared By**: Development Team  
**Project**: KYL (Know Your Leaders)

---

## Appendix A: API Request Examples

### Example 1: Create Candidate

```typescript
const createCandidate = async (candidateData: {
  name: string
  party_id: number
  position_id: number
  state_id: number
  bio?: string
  photo?: File
}) => {
  const formData = new FormData()
  formData.append('name', candidateData.name)
  formData.append('party_id', candidateData.party_id.toString())
  formData.append('position_id', candidateData.position_id.toString())
  formData.append('state_id', candidateData.state_id.toString())
  
  if (candidateData.bio) {
    formData.append('bio', candidateData.bio)
  }
  
  if (candidateData.photo) {
    formData.append('photo', candidateData.photo)
  }

  const response = await fetch(`${API_BASE_URL}/candidates/create-candidate/`, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`,
      // Don't set Content-Type for FormData - browser sets it automatically
    },
    body: formData
  })

  if (!response.ok) {
    throw new Error('Failed to create candidate')
  }

  return response.json()
}
```

### Example 2: Get Filtered Candidates

```typescript
const getFilteredCandidates = async (filters: {
  party_id?: number
  position_id?: number
  state_id?: number
  status?: string
}) => {
  const params = new URLSearchParams()
  
  if (filters.party_id) params.append('party_id', filters.party_id.toString())
  if (filters.position_id) params.append('position_id', filters.position_id.toString())
  if (filters.state_id) params.append('state_id', filters.state_id.toString())
  if (filters.status) params.append('status', filters.status)

  const response = await fetch(
    `${API_BASE_URL}/candidates/?${params.toString()}`,
    {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      }
    }
  )

  if (!response.ok) {
    throw new Error('Failed to fetch candidates')
  }

  return response.json()
}
```

---

## Appendix B: Component Examples

### Example: Data Table with API Integration

```typescript
import { useState, useEffect } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { candidateService, Candidate } from '@/services/candidates'

export default function CandidatesTable() {
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadCandidates()
  }, [])

  const loadCandidates = async () => {
    try {
      setLoading(true)
      const data = await candidateService.getAllCandidates()
      setCandidates(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load candidates')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure?')) return
    
    try {
      await candidateService.deleteCandidate(id)
      setCandidates(candidates.filter(c => c.id !== id))
    } catch (err) {
      alert('Failed to delete candidate')
    }
  }

  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error}</div>

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Party</TableHead>
          <TableHead>Position</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {candidates.map((candidate) => (
          <TableRow key={candidate.id}>
            <TableCell>{candidate.name}</TableCell>
            <TableCell>{candidate.party_id}</TableCell>
            <TableCell>{candidate.position_id}</TableCell>
            <TableCell>
              <Button variant="ghost" size="sm" onClick={() => handleDelete(candidate.id)}>
                Delete
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
```

---

**End of Document**
