# Pearl Cover MCP Server

AI data access layer implementing Anthropic's "tools as code" pattern.

## Features

- **3 minimal tools** instead of 50+ granular ones
- **TypeScript SDK** for type-safe data access
- **Full coverage** of all 9 data domains

## Tools

| Tool | Description |
|------|-------------|
| `execute_query` | Run SDK methods to query/aggregate data |
| `search` | Full-text search across all entities |
| `get_schema` | Get SDK documentation |

## Quick Start

```bash
# Install dependencies
npm install

# Build
npm run build

# Run (with stdio transport for MCP)
npm start
```

## Configuration

Create a `.env` file:

```
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Use with Claude Desktop

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "pearl-cover": {
      "command": "node",
      "args": ["/path/to/pearl-cover/mcp-server/dist/index.js"],
      "env": {
        "SUPABASE_URL": "your_url",
        "SUPABASE_ANON_KEY": "your_key"
      }
    }
  }
}
```

## SDK Domains

- **Aged Care**: funding accounts, allocations, expenses
- **WorkCover**: claims, expenses, reimbursements
- **Notes**: notes, tags, entity linking
- **Calendar**: events, upcoming
- **Payments**: transactions, reconciliation
- **Suppliers**: providers, categories
- **Analytics**: spending breakdown, stats
- **Search**: full-text, OCR attachments
