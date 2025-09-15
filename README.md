# 📚 Books Reading Platform

A comprehensive educational reading platform built with Next.js 15, Prisma, PostgreSQL, and Auth.js v5.

## 🚀 Quick Start (One Command)

Choose your preferred method to run the application:

### Option 1: Ultimate Simple Run
```bash
./run.sh
```

### Option 2: Using Make
```bash
make start
```

### Option 3: Using Docker Compose
```bash
docker-compose -f docker-compose.prod.yml up -d --build
```

### Option 4: Using Custom Script
```bash
./start.sh
```

## 📱 Access the Application

Once started, access your application at:
- **Web App**: http://localhost:3000
- **Database**: postgresql://user:password@localhost:5432/book_db

## 🎯 Features

### 👩‍🏫 For Teachers
- **Book Management**: Add new books to the library
- **Summary Rating**: Rate and provide feedback on student summaries
- **Analytics**: View reading statistics and performance metrics
- **Leaderboards**: Track student progress and achievements

### 👨‍🎓 For Students
- **Book Discovery**: Browse and search through the book library
- **Reading Tracking**: Track reading progress with detailed analytics
- **Summary Writing**: Write and submit book summaries
- **Gamification**: Earn points, achievements, and compete on leaderboards

### 🔐 Authentication
- Secure login with Auth.js v5
- Role-based access control (Student/Teacher/Admin)
- Session management with middleware protection

## 🛠️ Development Commands

```bash
# Development mode (with hot reload)
make dev
# or
./start.sh dev
# or
docker-compose up --build

# View logs
make logs
# or
docker-compose -f docker-compose.prod.yml logs -f

# Stop application
make stop
# or
docker-compose -f docker-compose.prod.yml down

# Clean everything
make clean
```

## 🏗️ Architecture

- **Frontend**: Next.js 15 with TypeScript and Tailwind CSS
- **UI Components**: shadcn/ui component library
- **Backend**: Next.js API routes with TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Auth.js v5 (NextAuth v5)
- **Containerization**: Docker with multi-stage builds

## 📊 Database Schema

The application includes comprehensive models for:
- Users (Students, Teachers, Admins)
- Books with categories and metadata
- Reading progress tracking
- Book summaries with ratings
- Leaderboard and achievement system

## 🐳 Docker Setup

The application uses multi-stage Docker builds for optimization:
- **Development**: Hot reload with volume mounts
- **Production**: Optimized build with health checks

## 🔧 Environment Variables

Key environment variables (automatically set in Docker):
- `DATABASE_URL`: PostgreSQL connection string
- `NEXTAUTH_SECRET`: Authentication secret key
- `NEXTAUTH_URL`: Application URL
- `NODE_ENV`: Environment mode

## 🎮 Gamification Features

- **Point System**: Earn points for reading activities
- **Leaderboards**: Student and teacher rankings
- **Achievements**: Unlock badges for milestones
- **Progress Tracking**: Detailed reading analytics

## 🔒 Security Features

- Role-based access control
- Protected API routes
- Session-based authentication
- Input validation and sanitization

## 📈 Analytics & Reporting

- Personal reading dashboards
- Performance leaderboards
- Reading streak tracking
- Category-based analytics
- Monthly progress reports

---

**Ready to start reading? Run `./run.sh` and begin your educational journey!** 🎓📖
