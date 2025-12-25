# Pearl Cover API Documentation

## API Routes

### Authentication
All API routes require authentication via Supabase session. Session is automatically handled via httpOnly cookies and managed by middleware.

### Endpoints

#### AI Assistant

**POST /api/ai/chat**
Chat with AI assistant using user's configured model.

**Request:**
```json
{
  "query": "Show me pending expenses"
}
```

**Response:**
```json
{
  "content": "Here are your pending expenses...",
  "sources": {
    "notes": 3,
    "claims": 1,
    "expenses": 2,
    "payments": 0,
    "attachments": 1
  }
}
```

**Rate Limiting:** 30 requests per minute per user

**GET /api/ai/config**
Get user's AI configuration (does not return actual API key).

**Response:**
```json
{
  "apiKey": true,
  "endpointUrl": "https://api.openai.com/v1",
  "modelName": "gpt-4-turbo-preview"
}
```

**PUT /api/ai/config**
Update user's AI configuration. API key is encrypted before storage.

#### Health Check

**GET /api/health**
Application health check endpoint (no auth required).

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00Z",
  "database": "connected",
  "version": "1.0.0"
}
```

Used by Docker healthcheck to verify container is running correctly.

#### Error Logging

**POST /api/log-error**
Log frontend errors to database for debugging.

**Request:**
```json
{
  "message": "Error description",
  "stack": "Stack trace",
  "componentStack": "React component stack",
  "url": "https://pearl-cover.com/page",
  "userAgent": "Mozilla/5.0..."
}
```

Errors are stored in `error_logs` table with automatic cleanup of entries older than 30 days.

## Service Layer

The service layer provides type-safe functions for database operations. Import from `@/lib/api/index` for all services.

### Aged Care Module

```typescript
import { getAgedCareExpenses, createAgedCareExpense } from '@/lib/api/aged-care'

// Get all pending aged care expenses
const expenses = await getAgedCareExpenses({ status: 'pending' })

// Create a new expense
const newExpense = await createAgedCareExpense({
  funding_account_id: 'uuid',
  description: 'Physiotherapy session',
  amount: 150.00,
  expense_date: '2024-01-15',
  status: 'pending'
})
```

### WorkCover Module

```typescript
import { getWorkcoverClaims, getWorkcoverExpenses } from '@/lib/api/workcover'

// Get all open claims
const claims = await getWorkcoverClaims('open')

// Get expenses for a claim
const expenses = await getWorkcoverExpenses({ claimId: 'uuid' })
```

### Notes Module

```typescript
import { getNotes, createNote, linkNoteToAgedCareExpense } from '@/lib/api/notes'

// Search notes (uses full-text search)
const notes = await searchNotes('physiotherapy')

// Create a note
const note = await createNote({
  title: 'Therapy Notes',
  content: 'Session details...',
  category_id: 'uuid'
})

// Link note to expense
await linkNoteToAgedCareExpense('note-id', 'expense-id')
```

### Calendar Module

```typescript
import { getCalendarEvents, fetchGoogleEvents } from '@/lib/api/calendar'

// Get calendar events
const events = await getCalendarEvents({
  startDate: '2024-01-01',
  endDate: '2024-01-31'
})

// Sync with Google Calendar
const googleEvents = await fetchGoogleEvents(accessToken, '2024-01-01', '2024-01-31', 'primary')
```

### Admin Module

```typescript
import { getUsers, updateUserRole, getUserEffectivePermissions } from '@/lib/api/admin'

// Get all users
const users = await getUsers()

// Update user role
await updateUserRole('user-id', 'admin')

// Check if user can access admin
const perms = await getUserEffectivePermissions('user-id', '/admin/users')
if (perms.canView) {
  // Show admin features
}
```

### Authentication Helpers

```typescript
import { createClient } from '@/lib/api/shared/supabase-client'

// Client-side Supabase client
const supabase = createClient()

// Server-side Supabase client (for API routes)
const supabaseServer = await createServerSideClient()
```

## Database Functions

### Full-Text Search

Search functions use Postgres `tsvector` for fast, ranked results.

```sql
-- Search notes with full-text
SELECT * FROM search_notes('physiotherapy', 10);
```

**Available Search Functions:**
- `search_notes(query, limit)` - Search notes
- `search_aged_care_expenses(query, limit)` - Search aged care expenses
- `search_workcover_claims(query, limit)` - Search claims
- `search_workcover_expenses(query, limit)` - Search workcover expenses
- `search_payment_transactions(query, limit)` - Search payments
- `search_attachments(query, limit)` - Search attachments (OCR text)

### RBAC Functions

```typescript
// Get user's effective permissions for a page
const perms = await getUserEffectivePermissions(userId, '/admin/users')

// Returns:
{
  canView: boolean,
  canCreate: boolean,
  canUpdate: boolean,
  canDelete: boolean
}
```

## Error Handling

### Error Codes

- `VALIDATION_ERROR` - Invalid request data
- `AUTH_ERROR` - Not authenticated
- `PERMISSION_ERROR` - User lacks permission
- `NOT_FOUND` - Resource not found
- `DATABASE_ERROR` - Database operation failed
- `RATE_LIMIT` - Too many requests

### Error Response Format

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data"
  }
}
```

## MCP Server

The MCP server (`mcp-server/`) allows external AI agents to access Pearl Cover data safely.

### Available Tools

1. **execute_query** - Run TypeScript code against SDK
   - Example: `sdk.agedCareExpenses.getTotal({fromDate: '2024-01-01'})`
   - Example: `sdk.notes.search('physiotherapy')`

2. **search** - Full-text search across all data
   - Supports filtering by entity type
   - Returns ranked results

3. **get_schema** - Get data schema and SDK documentation
   - Filter by domain (aged_care, workcover, etc.)

### Authentication

The MCP server uses Supabase anon key with RLS policies applied. Agents can only access data that the authenticated user has permission to see.

### Setup

```json
{
  "mcpServers": {
    "pearl-cover": {
      "command": "node",
      "args": ["/path/to/mcp-server/dist/index.js"],
      "env": {
        "SUPABASE_URL": "your-url",
        "SUPABASE_ANON_KEY": "your-key"
      }
    }
  }
}
```

### SDK Structure

```typescript
// Aged Care
sdk.fundingAccounts.getAllBalances()
sdk.agedCareExpenses.list(filters)
sdk.agedCareExpenses.getTotal(dateRange)

// WorkCover
sdk.workcoverClaims.list(status)
sdk.workcoverExpenses.list(claimId)
sdk.workcoverExpenses.getTotalGap()

// Notes
sdk.notes.search(query)
sdk.notes.list(filters)

// Search & Analytics
sdk.search.all(query)
sdk.analytics.spendingByCategory(dateRange, domain)
sdk.analytics.getQuickStats()
```

## Webhooks

Not currently implemented. Can be added for:
- Payment processing notifications
- Calendar sync alerts
- Expense reminders
- Audit log alerts

## OpenAPI Schema (Planned)

For integration with external services, the following OpenAPI schema can be generated:
- CRUD operations for all entities
- Authentication endpoints
- Search endpoints
- Analytics endpoints

Use `swagger-ui` or `openapi-generator` to generate from service layer types.
