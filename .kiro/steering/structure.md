# Project Structure

## Root Level Organization

```text
├── app/                    # Next.js App Router pages and layouts
├── backend/               # Python FastAPI backend application
├── components/            # Reusable React components
├── lib/                   # Shared utilities and configurations
├── contexts/              # React context providers
├── hooks/                 # Custom React hooks
├── uploads/               # File upload storage (gitignored)
└── .kiro/                 # Kiro AI assistant configuration
```

## Frontend Structure (`app/` directory)

### Page Routes

- `app/page.tsx` - Landing page
- `app/(login)/` - Authentication pages (sign-in, sign-up)
- `app/dashboard/` - Main user dashboard
- `app/experience/` - Experience input and management
- `app/experience-summary/` - Experience analysis and summaries
- `app/collect-experience/` - Multi-modal experience collection
- `app/ai-solutions/` - AI-generated solutions display
- `app/analytics/` - User analytics and insights
- `app/security/` - Privacy and security settings
- `app/rating-demo/` - Solution rating interface

### API Routes

- `app/api/user/` - User management endpoints
- `app/api/media/upload/` - File upload handling

## Component Organization

### Feature-Based Components

- `components/ai/` - AI processing components (stage1, stage2, stage3)
- `components/experience/` - Experience-related UI components
- `components/multimodal/` - Media input and gallery components
- `components/rating/` - Solution rating and analytics
- `components/security/` - Data security dashboard
- `components/dashboard/` - Dashboard-specific components

### Shared Components

- `components/ui/` - shadcn/ui base components (button, card, input, etc.)
- `components/header.tsx` - Global navigation header
- `components/theme-controls.tsx` - Theme switching controls

## Backend Structure (`backend/` directory)

### Application Core

- `backend/app/main.py` - FastAPI application entry point
- `backend/app/core/` - Core configuration and database setup
- `backend/app/dependencies.py` - Dependency injection setup

### Feature Modules

- `backend/app/api/` - API endpoint handlers organized by feature
  - `auth.py` - Authentication endpoints
  - `users.py` - User management
  - `experiences.py` - Experience CRUD operations
  - `solutions.py` - AI solution management
  - `ai_stage1.py`, `ai_stage2.py`, `ai_stage3.py` - Three-stage AI processing
  - `media.py` - File upload and processing
  - `solution_rating.py` - Rating system
  - `privacy_compliance.py` - GDPR compliance features

### Data Layer

- `backend/app/models/` - Pydantic models for data validation
- `backend/app/services/` - Business logic services
- `backend/app/utils/` - Utility functions (encryption, etc.)
- `backend/app/routers/` - FastAPI router configurations

## Library Organization (`lib/` directory)

### Authentication

- `lib/auth/` - Authentication utilities and middleware
- `lib/auth/session.ts` - JWT token management
- `lib/auth/mongodb-queries.ts` - User database queries

### Database

- `lib/db/mongodb.ts` - MongoDB connection and queries
- `lib/db/models/` - TypeScript data models
- `lib/db/migrations/` - Database migration files

### Utilities

- `lib/utils/` - Shared utility functions
- `lib/utils/encryption.ts` - Client-side encryption helpers
- `lib/config.ts` - Application configuration

## Naming Conventions

### Files and Directories

- Use kebab-case for directories: `experience-summary/`
- Use kebab-case for component files: `experience-input-form.tsx`
- Use PascalCase for React components: `ExperienceInputForm`
- Use camelCase for utility functions and variables

### API Endpoints

- RESTful naming: `/api/experiences`, `/api/solutions`
- Feature-based grouping: `/api/ai/stage1`, `/api/media/upload`
- Consistent HTTP methods: GET, POST, PUT, DELETE

### Database Collections

- Singular nouns: `user`, `experience`, `solution`
- Consistent field naming: `createdAt`, `updatedAt`, `userId`

## Configuration Files

### Frontend Configuration

- `next.config.ts` - Next.js configuration with experimental features
- `tsconfig.json` - TypeScript configuration with strict mode
- `tailwind.config.js` - Tailwind CSS customization
- `components.json` - shadcn/ui component configuration

### Backend Configuration

- `backend/requirements.txt` - Python dependencies
- `pyproject.toml` - Python project configuration with linting rules
- `.pre-commit-config.yaml` - Pre-commit hooks for code quality

### Development Tools

- `.env.example` - Environment variable template
- `.gitignore` - Git ignore patterns for uploads and cache files
- `middleware.ts` - Next.js middleware for authentication
