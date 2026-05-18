# KYL (Know Your Leaders) - Frontend

A comprehensive civic technology platform for Nigeria that promotes informed democratic participation by providing information about Nigerian politicians, their track records, and policy positions.

## Tech Stack

- **React 18.3.1** + **TypeScript 5.5.3**
- **Vite 5.4.1** - Fast build tool
- **Tailwind CSS 4.2.2** - Utility-first CSS
- **shadcn/ui** - Re-usable component library
- **React Router DOM 7.13.2** - Client-side routing
- **Recharts** - Data visualization

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Git

### Installation

1. Clone the repository:
```bash
git clone https://github.com/Abdulhalim7177/kyl-front.git
cd kyl-front
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory:
```bash
cp .env.example .env
```

4. Configure your environment variables in `.env`:
```env
VITE_API_BASE_URL=https://kyl.aitshub.com.ng/api/v1
```

5. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `VITE_API_BASE_URL` | Backend API base URL | `https://kyl.aitshub.com.ng/api/v1` | Yes |

**Note:** All environment variables must be prefixed with `VITE_` to be exposed to the client-side code.

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint

## Project Structure

```
kyl-front/
├── src/
│   ├── components/       # Reusable UI components
│   │   └── ui/          # shadcn/ui components
│   ├── contexts/        # React Context providers
│   ├── pages/           # Page components
│   ├── services/        # API service layer
│   ├── lib/             # Utility functions
│   ├── App.tsx          # Main app component with routing
│   └── main.tsx         # Application entry point
├── public/              # Static assets
├── .env                 # Environment variables (not in git)
├── .env.example         # Environment variables template
└── vite.config.ts       # Vite configuration
```

## Features

### Public Features
- Landing page with platform information
- Politicians directory
- Political positions information
- About page

### Admin Features (Protected Routes)
- **Dashboard** - System statistics and overview
- **User Management** - CRUD operations for admin users
- **Candidates Management** - Manage political candidates
- **Political Parties** - Party information and management
- **Activity Logs** - System audit trail
- **Role-based Access Control** - Granular permissions

## API Integration

All API calls are centralized in the `src/services/` directory:

- `auth.ts` - Authentication (login/logout)
- `users.ts` - User management
- `candidates.ts` - Candidate management
- `parties.ts` - Political parties management

The application uses a proxy configuration in development to avoid CORS issues. In production, ensure your backend API has proper CORS headers configured.

## Authentication

The application uses JWT (JSON Web Token) authentication:
- Tokens are stored in `localStorage`
- Protected routes redirect to login if not authenticated
- Token is sent in `Authorization: Bearer <token>` header

## Deployment

### Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Abdulhalim7177/kyl-front)

Or using Vercel CLI:
```bash
vercel
```

### Build for Production

```bash
npm run build
```

The built files will be in the `dist/` directory.

### Environment Variables in Production

Make sure to set the `VITE_API_BASE_URL` environment variable in your deployment platform (Vercel, Netlify, etc.).

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is proprietary software.

## Support

For support, email support@kyl.aitshub.com.ng or open an issue in the repository.
