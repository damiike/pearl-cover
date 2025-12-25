/**
 * Pearl Cover MCP Server
 *
 * Implements "tools as code" pattern with 3 minimal tools:
 * 1. execute_query - Run TypeScript code against SDK
 * 2. search - Full-text search across all data
 * 3. get_schema - Return SDK documentation
 */
import 'dotenv/config';
