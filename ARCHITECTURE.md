# Pearl Cover Architecture

## Overview
Pearl Cover is a full-stack application built with:
- **Frontend**: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Realtime)
- **UI**: Radix UI + Tailwind CSS + shadcn/ui
- **State**: React Query
- **Deployment**: Docker on Coolify
- **AI Integration**: OpenAI-compatible APIs (users bring their own keys)
- **External Access**: MCP server for AI agents

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     User Browser                          │
│  ┌─────────────┐  ┌──────────────┐  │
│  │   Next.js   │  │ React Query  │  │
│  │  Frontend  │  │   Client     │  │
│  └─────────────┘  └───────────────┘  │
└─────────────────────────────────────────────────────────────────┘
         │                    │                    │
         ▼                    ▼                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Coolify                           │
│  ┌─────────────┐  ┌──────────────┐  │
│  │   Main App  │  │   API Route  │  │
│  │  (Docker)    │  │ (OpenAI)     │  │
│  └─────────────┘  └───────────────┘  │
└─────────────────────────────────────────────────────────────────┘
         │                    │                    │
         ▼                    ▼                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Supabase                          │
│  ┌─────────────┐  ┌──────────────┐  │
│  │   Database   │  │     Auth      │  │
│  │ (PostgreSQL) │  │   Storage    │  │
│  └─────────────┘  └───────────────┘  │
└─────────────────────────────────────────────────────────┘
```

## Data Flow

### User Authentication
1. User logs in via Supabase Auth
2. Session stored in httpOnly cookie (middleware)
3. AuthProvider manages auth state
4. Protected routes check auth in middleware

### AI Assistant
1. User enters query
2. Frontend calls `/api/ai/chat`
3. Server decrypts user's API key
4. Server searches database (full-text search)
5. Server calls OpenAI with context
6. Returns response to client

### Expense Tracking
1. User creates expense in UI
2. Form validation with Zod
3. React Query mutation to service layer
4. Service layer calls Supabase
5. RLS policies ensure user can only create their own data
6. Audit log entry created via trigger
7. React Query invalidates and refetches data

### External AI Agent Access
1. Agent connects to MCP server
2. MCP server authenticates via Supabase anon key
3. Agent calls `execute_query`, `search`, or `get_schema`
4. SDK queries Supabase with RLS applied
5. Results returned to agent

## Key Components

### Frontend
- **App Router**: File-based routing in `src/app/`
- **Providers**: Auth, Query, Theme in `src/providers/`
- **Components**: Reusable UI in `src/components/`
- **Services**: Data access in `src/lib/api/`

### Backend
- **API Routes**: Server-side endpoints in `src/app/api/`
- **Middleware**: Auth session refresh in `src/middleware.ts`
- **Server Actions**: Direct database operations

### Database
- **Tables**: profiles, suppliers, expenses, claims, notes, etc.
- **Views**: funding_account_balances, workcover_claim_summaries
- **Functions**: search_*, delete_user_data, audit_log_trigger
- **Triggers**: search_vector updates, audit logs
- **Indexes**: GIN indexes for full-text search

## Security Model

### Authentication
- Supabase Auth (email/password, OAuth)
- httpOnly cookies for sessions
- Refresh tokens handled by middleware

### Authorization
- Row Level Security (RLS) on all tables
- Role-based access control (admin, owner, support, read_only)
- User-specific overrides

### Data Protection
- API keys encrypted with AES-256
- Secure cookie flags (httpOnly, secure, sameSite)
- CSRF protection via Next.js
- Input validation with Zod

## Performance Optimizations

### Frontend
- React Query caching (1-minute staleTime)
- Code splitting (dynamic imports)
- Image optimization (Next.js Image)
- Debounced search

### Database
- Full-text search with GIN indexes
- Connection pooling (Supabase)
- Materialized views for aggregates
- Query result caching

### Deployment
- Multi-stage Docker builds
- Standalone output mode
- CDN caching (Coolify)
- Health checks

## Project Structure

```
pearl-cover/
├── public/              # Static assets
├── src/
│   ├── app/          # Next.js App Router pages
│   │   ├── (auth)/   # Auth pages
│   │   ├── (dashboard)/  # Protected pages
│   │   ├── api/        # API routes
│   ├── components/   # UI components
│   ├── lib/          # Utilities
│   │   ├── api/      # Service layer
│   │   │   ├── aged-care/
│   │   │   ├── workcover/
│   │   │   ├── payments/
│   │   │   ├── notes/
│   │   │   ├── suppliers/
│   │   │   ├── calendar/
│   │   │   ├── admin/
│   │   │   └── shared/
│   │   ├── ai/         # AI integration
│   │   ├── constants/  # Constants & enums
│   │   ├── supabase/   # Supabase clients
│   │   └── types/      # TypeScript types
│   └── providers/    # React context providers
├── supabase/
│   ├── migrations/   # Database migrations
│   └── schema.sql    # Initial schema
├── mcp-server/      # MCP server for external AI agents
└── Dockerfile        # Container build config
```

## Feature Highlights

### Core Features
- 📊 **Dashboard** - Overview of funding balances, claims, and expenses
- ❤️ **Aged Care Tracking** - Monitor funding balances, track expenses, manage allocations
- 🛡️ **WorkCover Claims** - Track medical expenses, monitor reimbursements, see gaps
- 💳 **Payments** - Record and reconcile payments across funding sources
- 📝 **Notes** - Gmail-style notes with categories, tags, and entity linking
- 📅 **Calendar** - Track appointments and events with Google Calendar sync
- 📈 **Suppliers** - Manage service providers for aged care and WorkCover
- 🤖 **AI Assistant** - Natural language search powered by OpenAI
- 🔍 **Search** - Full-text search across all data
- 📋 **Audit Log** - Complete change history

### Advanced Features
- 👥 **Multi-user** - Share access with family members
- 🔒 **Role-based Access** - Admin, owner, support, read-only, supplier roles
- 📎 **Receipt Capture** - Upload and OCR process receipts
- 🏷️ **Google Calendar Integration** - Sync appointments automatically
- 🔗 **Entity Linking** - Link notes to expenses, claims, payments
- 📊 **Reports** - Spending analytics and trends
- 🤖 **MCP Server** - Allow external AI agents to access data safely

## Future Enhancements

- [ ] Service worker for offline support
- [ ] WebSocket for real-time updates (Supabase Realtime)
- [ ] Background job queue for heavy tasks
- [ ] Automated backups (Supabase)
- [ ] Performance monitoring (Sentry free tier)
- [ ] E2E tests with Playwright
- [ ] API documentation with OpenAPI/Swagger
