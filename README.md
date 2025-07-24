# Mortal Stardust (人间星尘)

**Mortal Stardust** is an AI-powered personal growth counseling platform that helps users process life experiences and receive personalized guidance through multi-modal input and intelligent analysis.

## 🌟 Core Features

### Multi-Modal Experience Collection

- **Text Input**: Share experiences through detailed written descriptions
- **Voice Recording**: Express emotions and thoughts through audio
- **Image Upload**: Visual context for experiences and situations
- **Video Content**: Comprehensive multimedia experience sharing

### Three-Stage AI Processing

1. **Stage 1 - Psychological Healing**: Emotional support and therapeutic guidance
2. **Stage 2 - Solution Generation**: Practical, actionable steps and recommendations
3. **Stage 3 - Follow-up Tracking**: Progress monitoring and experience supplementation

### Intelligent Features

- **Role-Based Templates**: Personalized guidance for students, professionals, entrepreneurs
- **Experience Summarization**: 7-dimensional analysis of user experiences
- **Solution Rating System**: User feedback drives continuous AI improvement
- **Privacy-First Design**: Enterprise-grade encryption and GDPR compliance
- **Analytics Dashboard**: Insights into personal growth patterns

## 🎯 Target Users

- **Students**: Academic pressure, exam anxiety, career planning
- **Young Professionals**: Workplace adaptation, career development
- **Entrepreneurs**: Business challenges, team management, decision-making
- **General Users**: Life guidance, emotional support, personal growth

## 🛠 Tech Stack

### Frontend

- **Framework**: [Next.js 15](https://nextjs.org/) with App Router and TypeScript
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) with [shadcn/ui](https://ui.shadcn.com/) components
- **State Management**: React Hooks + Context API + SWR for data fetching
- **Authentication**: JWT tokens stored in HTTP-only cookies
- **Charts**: [Recharts](https://recharts.org/) for data visualization

### Backend

- **Framework**: [Python FastAPI](https://fastapi.tiangolo.com/) with async/await
- **Database**: [MongoDB](https://www.mongodb.com/) with Motor async driver
- **AI Integration**: OpenAI-compatible API endpoints
- **File Processing**: Pillow for images, multipart uploads
- **Security**: Cryptography library for AES-256 encryption

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- Python 3.8+ with pip
- MongoDB instance (local or cloud)

### Installation

1. **Clone the repository**

```bash
git clone <repository-url>
cd mortal-stardust
```

2. **Install frontend dependencies**

```bash
npm install
```

3. **Install backend dependencies**

```bash
cd backend
pip install -r requirements.txt
pip install -r requirements-media.txt
```

4. **Environment Setup**

```bash
# Copy environment templates
cp .env.example .env
cp backend/.env.example backend/.env
```

5. **Configure your environment variables**

   - Update `.env` with your MongoDB connection string
   - Set up OpenAI API keys for AI processing
   - Configure file upload paths and security keys

## 🏃‍♂️ Running Locally

### Database Setup

```bash
# Setup MongoDB connection
npm run db:setup

# Test database connection
npm run db:test

# Seed database with test data
npm run db:seed
```

### Development Servers

1. **Start the frontend development server**

```bash
npm run dev
```

2. **Start the backend API server**

```bash
cd backend
python run.py
# or alternatively
uvicorn app.main:app --reload
```

3. **Access the application**

   - Frontend: [http://localhost:3000](http://localhost:3000)
   - Backend API: [http://localhost:8000](http://localhost:8000)
   - API Documentation: [http://localhost:8000/docs](http://localhost:8000/docs)

### Default Test User

- Email: `test@test.com`
- Password: `admin123`

## 📁 Project Structure

```text
├── app/                    # Next.js App Router pages and layouts
├── backend/               # Python FastAPI backend application
├── components/            # Reusable React components
│   ├── ai/               # AI processing components
│   ├── experience/       # Experience-related UI
│   ├── multimodal/       # Media input components
│   └── ui/               # shadcn/ui base components
├── lib/                   # Shared utilities and configurations
├── contexts/              # React context providers
└── .kiro/                 # Kiro AI assistant configuration
```

## 🎨 Theming

Built-in theme support with light/dark mode toggle functionality. Use design tokens from the theme system:

- CSS variables: `var(--color-primary)`
- Tailwind classes: `bg-primary text-primary-foreground`
- Custom themes: Define in `contexts/theme-context.tsx`

## 🔒 Security Features

- **Field-Level Encryption**: Sensitive data encrypted with AES-256
- **JWT Authentication**: Secure token-based authentication
- **GDPR Compliance**: Privacy controls and data retention policies
- **Input Validation**: Zod (frontend) and Pydantic (backend) validation
- **CORS Configuration**: Secure cross-origin resource sharing

## 🧪 Development Tools

### Code Quality

```bash
# Linting and formatting (configured with pre-commit hooks)
ruff check backend/
black backend/
```

### Testing

```bash
# Backend tests
cd backend
pytest

# Integration tests
python integration_tests.py

# Security validation
python security_validation.py
```

## 📚 API Documentation

The FastAPI backend automatically generates interactive API documentation:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## 🤝 Contributing

1. Follow the established code style and linting rules
2. Use the pre-commit hooks for code quality
3. Write tests for new features
4. Update documentation as needed

## 📄 License

This project is licensed under the terms specified in the LICENSE file.
