import { Tool } from "../types/mcp.types";
import echoTool from "../tools/echo.tool";
import IngestDocumentTool from "../tools/ingest_document.tool";
import ragTool from '../tools/chat_with_documents_rag.tool.js'; 


interface MCPEvent {
    tool?: string;
    payload: any;
}

const tools = new Map<string, Tool>();

tools.set(echoTool.name, echoTool);
tools.set(IngestDocumentTool.name, IngestDocumentTool);
tools.set(ragTool.name, ragTool);

export function getTool(name: string): Tool | undefined {
    return tools.get(name);
}

export function routeToTool(event: MCPEvent): { tool: Tool; input: any } {
    if(event.tool && tools.has(event.tool)){{
        console.log(`[Tool Router] Routing to explicitly requested tool: ${event.tool}`);
        return{
            tool: tools.get(event.tool)!,
            input: event.payload
        };
    }}
    console.log(`[Tool Router] Defaulting to RAG tool for chat message.`);
    return {
        tool: ragTool,
        input: { message: event.payload.message } 
    };
}