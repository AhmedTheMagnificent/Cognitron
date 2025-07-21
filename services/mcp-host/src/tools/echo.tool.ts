import { Tool, ToolInput, ToolOutput, MCPContext } from "../types/mcp.types";

const echoTool: Tool = {
    name: "echo_tool",
    description: "A simple tool that echoes user's input back to them.",
    async execute(context: MCPContext, input: ToolInput): Promise<{ context: MCPContext; output: ToolOutput }> {
        const userMessage = input.message;
        const output: ToolOutput = {
            answer: `You said: "${userMessage}"`
        };
        context.chat_history.push({ role: 'user', content: userMessage });
        context.chat_history.push({ role: 'assistant', content: output.answer });
        context.metadata.lastToolUsed = this.name; 
        return { context, output };
    }
};

export default echoTool;