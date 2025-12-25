/**
 * Pearl Cover MCP Server
 * 
 * Implements "tools as code" pattern with 3 minimal tools:
 * 1. execute_query - Run TypeScript code against SDK
 * 2. search - Full-text search across all data
 * 3. get_schema - Return SDK documentation
 */

import 'dotenv/config';
import { FastMCP } from 'fastmcp';
import { z } from 'zod';
import { createSDK, PearlCoverSDK } from './sdk/index.js';
import { getSchemaDocumentation } from './tools/schema.js';

async function main() {
    console.error('Starting Pearl Cover MCP server...');

    // Initialize SDK
    let sdk: PearlCoverSDK;
    try {
        sdk = createSDK();
        console.error('SDK initialized successfully');
    } catch (error) {
        console.error('Failed to initialize SDK:', error);
        process.exit(1);
    }

    // Create MCP server
    const mcp = new FastMCP({
        name: 'Pearl Cover MCP',
        version: '1.0.0'
    });

    // ============================================================
    // Tool 1: execute_query - Run TypeScript code against SDK
    // ============================================================
    mcp.addTool({
        name: 'execute_query',
        description: `Execute a query against the Pearl Cover database using the SDK.
        
Available SDK methods:
- sdk.fundingAccounts.list(), .getBalance(id), .getAllBalances()
- sdk.agedCareExpenses.list(filters), .getById(id), .sumByCategory(dateRange), .getTotal(filters)
- sdk.workcoverClaims.list(status), .getSummaries(), .getById(id), .findByClaimNumber(num)
- sdk.workcoverExpenses.list(claimId), .getTotalGap(), .getByStatus(status)
- sdk.notes.search(query), .list(filters), .getById(id)
- sdk.calendar.getEvents(dateRange), .upcoming(days)
- sdk.payments.list(filters), .getUnreconciled(), .getTotal(dateRange)
- sdk.suppliers.list(), .getById(id)
- sdk.categories.list(domain)
- sdk.search.all(query), .attachments(query)
- sdk.analytics.spendingByCategory(dateRange, domain), .getQuickStats()

Examples:
- Get all funding balances: "sdk.fundingAccounts.getAllBalances()"
- Total aged care spending: "sdk.agedCareExpenses.getTotal({ fromDate: '2024-01-01' })"
- Search notes: "sdk.notes.search('physiotherapy')"
- Open claims: "sdk.workcoverClaims.list('open')"`,
        parameters: z.object({
            method: z.string().describe('SDK method to call, e.g., "fundingAccounts.getAllBalances()"'),
            args: z.any().optional().describe('Arguments to pass to the method (as JSON object)')
        }),
        execute: async (params) => {
            try {
                // Parse the method path
                const methodPath = params.method.replace(/\(\)$/, '').split('.');

                let target: any = sdk;
                for (const part of methodPath) {
                    if (target[part] === undefined) {
                        return JSON.stringify({
                            success: false,
                            error: `Unknown method path: ${params.method}`,
                            availableMethods: Object.keys(target)
                        });
                    }
                    target = target[part];
                }

                // Execute if it's a function
                if (typeof target === 'function') {
                    const result = await target(params.args);
                    return JSON.stringify({
                        success: true,
                        data: result,
                        count: Array.isArray(result) ? result.length : undefined
                    });
                } else {
                    return JSON.stringify({
                        success: true,
                        data: target
                    });
                }
            } catch (error: any) {
                console.error('Query execution error:', error);
                return JSON.stringify({
                    success: false,
                    error: error.message || 'Unknown error'
                });
            }
        }
    });

    // ============================================================
    // Tool 2: search - Full-text search across all data
    // ============================================================
    mcp.addTool({
        name: 'search',
        description: 'Full-text search across notes, claims, expenses, payments, and attachments (including OCR text)',
        parameters: z.object({
            query: z.string().describe('Search terms'),
            entity_types: z.array(z.enum(['notes', 'claims', 'aged_care_expenses', 'workcover_expenses', 'payments', 'attachments']))
                .optional()
                .describe('Optional filter to specific entity types'),
            limit: z.number().default(10).optional().describe('Max results per entity type')
        }),
        execute: async (params) => {
            try {
                const results = await sdk.search.all(params.query);

                // Filter by entity types if specified
                const filtered: any = {};
                const types = params.entity_types || ['notes', 'claims', 'aged_care_expenses', 'workcover_expenses', 'payments', 'attachments'];

                if (types.includes('notes')) filtered.notes = results.notes.slice(0, params.limit || 10);
                if (types.includes('claims')) filtered.claims = results.claims.slice(0, params.limit || 10);
                if (types.includes('aged_care_expenses')) filtered.agedCareExpenses = results.agedCareExpenses.slice(0, params.limit || 10);
                if (types.includes('workcover_expenses')) filtered.workcoverExpenses = results.workcoverExpenses.slice(0, params.limit || 10);
                if (types.includes('payments')) filtered.payments = results.payments.slice(0, params.limit || 10);
                if (types.includes('attachments')) filtered.attachments = results.attachments.slice(0, params.limit || 10);

                // Count total results
                const totalCount = Object.values(filtered).reduce((sum: number, arr: any) => sum + arr.length, 0);

                return JSON.stringify({
                    success: true,
                    query: params.query,
                    totalCount,
                    results: filtered
                });
            } catch (error: any) {
                console.error('Search error:', error);
                return JSON.stringify({
                    success: false,
                    error: error.message || 'Search failed'
                });
            }
        }
    });

    // ============================================================
    // Tool 3: get_schema - Return SDK documentation
    // ============================================================
    mcp.addTool({
        name: 'get_schema',
        description: 'Get the Pearl Cover data schema and available SDK methods',
        parameters: z.object({
            domain: z.enum(['all', 'aged_care', 'workcover', 'notes', 'calendar', 'payments', 'suppliers', 'analytics'])
                .default('all')
                .optional()
                .describe('Filter schema to specific domain')
        }),
        execute: async (params) => {
            const schema = getSchemaDocumentation(params.domain || 'all');
            return JSON.stringify({
                success: true,
                domain: params.domain || 'all',
                schema
            });
        }
    });

    // Start server
    await mcp.start({
        transportType: 'stdio'
    });

    console.error('Pearl Cover MCP server started successfully');
}

main().catch(error => {
    console.error('Unhandled error in MCP server:', error);
    process.exit(1);
});
