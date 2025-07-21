import { PersistentService } from "../services/persistence.service";
import { routeToTool } from "./tool-registry";
import WebSocket from "ws";
import { MCPContext } from "../types/mcp.types";

interface WebSocketEvent {
    sessionId: string | null;
    userId: string;
    message: string;
}

export async function processEvent(event: WebSocketEvent, ws: WebSocket) {
    try{
        const {sessionId, userId, message} = event;
        const context: MCPContext = await PersistentService.loadContext(sessionId, userId);
        const tool = routeToTool(message);
        if (!tool) {
            throw new Error("No appropriate tool found for the request.");
        }
        const { context: updatedContext, output: toolOutput } = await tool.execute(context, { message });
        await PersistentService.saveContext(updatedContext);
        ws.send(JSON.stringify({
            type: 'tool_response',
            sessionId: updatedContext.sessionId,
            payload: toolOutput
        }));
    } catch(error: any) {
        console.error('[MCP Engine] Error:', error.message);
        ws.send(JSON.stringify({ type: 'error', message: error.message }));
    }
}