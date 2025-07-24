# Technology Stack

## Frontend Stack

- **Framework**: Next.js 15 with App Router and TypeScript
- **Styling**: Tailwind CSS v4 with shadcn/ui components
- **State Management**: React Hooks + Context API + SWR for data fetching
- **Authentication**: JWT tokens stored in HTTP-only cookies
- **UI Components**: Radix UI primitives with custom styling
- **Charts**: Recharts for data visualization
- **Theme System**: Built-in light/dark mode with CSS variables

## Backend Stack

- **Framework**: Python FastAPI with async/await
- **Database**: MongoDB with Motor async driver
- **Authentication**: JWT with HTTPBearer security
- **AI Integration**: OpenAI-compatible API endpoints
- **File Processing**: Pillow for images, multipart uploads
- **Security**: Cryptography library for AES-256 encryption
- **API Documentation**: Auto-generated Swagger/OpenAPI docs

## Development Tools

- **Code Quality**: Ruff linter, Black formatter, pre-commit hooks
- **Type Safety**: TypeScript strict mode, Pydantic models
- **Testing**: Pytest for backend, built-in Next.js testing
- **Package Management**: npm for frontend, pip/uv for backend

## Common Commands

### Frontend Development

```bash
npm install          # Install dependencies
npm run dev          # Start development server (with Turbopack)
npm run build        # Build for production
npm run start        # Start production server
npm run db:setup     # Setup MongoDB connection
npm run db:seed      # Seed database with test data
npm run db:test      # Test database connection
```

### Backend Development

```bash
cd backend
pip install -r requirements.txt     # Install Python dependencies
python run.py                       # Start FastAPI server
uvicorn app.main:app --reload       # Alternative server start
```

### Database Operations

- MongoDB connection configured in `backend/app/core/database.py`
- Database models in `backend/app/models/`
- Frontend MongoDB queries in `lib/db/mongodb.ts`

## Architecture Patterns

### Frontend Patterns

- App Router with middleware for authentication
- Server Actions for form handling with Zod validation
- Component composition with shadcn/ui
- Theme system using CSS custom properties
- Responsive design with Tailwind breakpoints

### Backend Patterns

- FastAPI routers organized by feature domain
- Pydantic models for request/response validation
- Async MongoDB operations with Motor
- Middleware for CORS and security headers
- Service layer pattern for business logic

### Security Patterns

- Field-level encryption for sensitive data
- JWT token refresh in middleware
- CORS configuration for allowed origins
- Input validation with Zod (frontend) and Pydantic (backend)
- Privacy compliance utilities for GDPR
