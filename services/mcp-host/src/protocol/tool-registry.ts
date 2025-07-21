import { Tool } from "../types/mcp.types";
import echoTool from "../tools/echo.tool";

const tools = new Map<string, Tool>();

tools.set(echoTool.name, echoTool);

export function getTool(name: string): Tool | undefined {
    return tools.get(name);
}

export function routeToTool(message: string): Tool {
    return echoTool;
}