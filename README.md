# 🔍 ForensicsLab - Digital Evidence Platform

A modern, full-stack digital forensics platform for managing investigation cases, evidence, and timeline analysis.

## 🏗️ Architecture

- **Frontend**: React 18 + TypeScript + Vite + TailwindCSS
- **Backend**: NestJS + Prisma + PostgreSQL
- **Authentication**: JWT-based auth
- **State Management**: React Context API
- **UI Components**: Custom component library with Lucide icons

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm/yarn
- PostgreSQL 14+
- Git

### Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env
# Edit .env with your database credentials

# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Seed database with sample data
npm run prisma:seed

# Start development server
npm run start:dev
```

Backend will run on `http://localhost:4000`

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env
# Edit .env if needed (default points to localhost:4000)

# Start development server
npm run dev
```

Frontend will run on `http://localhost:3000`

## 📝 Environment Variables

### Backend (.env)

```env
DATABASE_URL="postgresql://user:password@localhost:5432/forensics_db"
JWT_SECRET="REDACTED-ROTATE-JWT-SECRET"
JWT_EXPIRES_IN="7d"
PORT=4000
FRONTEND_URL="http://localhost:3000"
```

### Frontend (.env)

```env
VITE_API_URL=http://localhost:4000/api
```

## 🔑 Default Credentials

After seeding the database:

- **Analyst Account**:
  - Email: `analyst@forensics.io`
  - Password: `REDACTED-ROTATE-SEED-PASSWORD`

- **Admin Account**:
  - Email: `admin@forensics.io`
  - Password: `REDACTED-ROTATE-SEED-PASSWORD`

## 📚 API Documentation

Once the backend is running, visit:
- Swagger UI: `http://localhost:4000/api/docs`
- Health Check: `http://localhost:4000/api/health`

## 🛠️ Development Scripts

### Backend

```bash
npm run start:dev      # Start development server with hot reload
npm run build          # Build for production
npm run start:prod     # Start production server
npm run lint           # Run ESLint
npm run test           # Run tests
npm run prisma:studio  # Open Prisma Studio (database GUI)
```

### Frontend

```bash
npm run dev            # Start development server
npm run build          # Build for production
npm run preview        # Preview production build
npm run lint           # Run ESLint
```

## 📦 Key Features

### ✅ Implemented

- 🔐 JWT Authentication & Authorization
- 📁 Case Management (CRUD operations)
- 🗂️ Evidence Collection & Chain of Custody
- ⏱️ Timeline Event Tracking
- 📊 Analytics Dashboard
- 🌍 Global Incident Map
- 🔔 Real-time Notifications
- 🌓 Dark/Light Theme
- 🌐 Multi-language Support (EN, RU, TK)
- 📄 PDF Report Generation
- 🔍 Advanced Search & Filtering

### 🎯 Tech Highlights

- **Type Safety**: Full TypeScript coverage
- **Validation**: Zod schemas for runtime validation
- **Error Handling**: Comprehensive error boundaries and global exception filters
- **Security**: CORS, helmet, rate limiting ready
- **Database**: Prisma ORM with PostgreSQL
- **UI/UX**: Responsive design with Tailwind CSS
- **Performance**: Code splitting and lazy loading

## 🏗️ Project Structure

```
forensics-platform/
├── backend/
│   ├── src/
│   │   ├── modules/          # Feature modules
│   │   │   ├── auth/
│   │   │   ├── cases/
│   │   │   ├── evidence/
│   │   │   ├── timeline/
│   │   │   ├── analytics/
│   │   │   └── users/
│   │   ├── common/           # Shared resources
│   │   │   ├── filters/      # Exception filters
│   │   │   ├── guards/       # Auth guards
│   │   │   └── pipes/        # Validation pipes
│   │   ├── prisma/           # Database service
│   │   └── main.ts
│   ├── prisma/
│   │   ├── schema.prisma
│   │   ├── seed.ts
│   │   └── migrations/
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── components/       # React components
    │   │   ├── auth/
    │   │   ├── cases/
    │   │   ├── evidence/
    │   │   ├── layout/
    │   │   ├── ui/           # Reusable UI components
    │   │   └── common/       # Common components
    │   ├── contexts/         # React contexts
    │   ├── hooks/            # Custom hooks
    │   ├── pages/            # Page components
    │   ├── services/         # API services
    │   ├── types/            # TypeScript types
    │   ├── utils/            # Utility functions
    │   ├── locales/          # i18n translations
    │   └── App.tsx
    └── package.json
```

## 🔒 Security

- JWT authentication with secure token storage
- Password hashing with bcrypt
- CORS configuration
- SQL injection protection via Prisma
- XSS protection
- Input validation on both client and server
- Error message sanitization

## 🧪 Testing

```bash
# Backend
cd backend
npm test                    # Run unit tests
npm run test:e2e           # Run e2e tests
npm run test:cov           # Generate coverage report

# Frontend
cd frontend
npm test                   # Run tests with Vitest
```

## 📈 Performance

- Lazy loading of routes
- Code splitting
- Image optimization
- Database query optimization with Prisma
- Caching strategies
- Pagination for large datasets

## 🐛 Troubleshooting

### Database Connection Issues

```bash
# Check if PostgreSQL is running
sudo systemctl status postgresql

# Test connection
psql -U username -d forensics_db

# Reset database
npm run prisma:migrate:reset
```

### Port Already in Use

```bash
# Find and kill process on port 4000 (backend)
lsof -ti:4000 | xargs kill -9

# Find and kill process on port 3000 (frontend)
lsof -ti:3000 | xargs kill -9
```

## 📄 License

MIT License - see LICENSE file for details

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📞 Support

For issues and questions:
- Create an issue on GitHub
- Check existing documentation
- Review API docs at `/api/docs`

---

Built with ❤️ using modern web technologies