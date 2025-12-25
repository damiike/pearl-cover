/**
 * Schema Documentation Generator
 *
 * Provides SDK method documentation for the AI agent
 */
export interface MethodDoc {
    name: string;
    description: string;
    params?: string;
    returns: string;
    example?: string;
}
export interface DomainSchema {
    domain: string;
    description: string;
    methods: MethodDoc[];
}
export declare function getSchemaDocumentation(domain: string): DomainSchema | DomainSchema[];
