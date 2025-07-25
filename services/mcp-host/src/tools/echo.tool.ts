import { Tool, MCPContext } from '../types/mcp.types.js';

// Define simple input/output types inline for this basic tool
interface EchoInput { message: string; }
interface EchoOutput { answer: string; }

const echoTool: Tool<EchoInput, EchoOutput> = {
  name: "echo_tool",
  description: "A simple tool that echoes the user's input back to them.",

  async execute(context: MCPContext, input: EchoInput): Promise<{ context: MCPContext; output: EchoOutput }> {
    const userMessage = input.message;
    const output: EchoOutput = {
      answer: `You said: "${userMessage}"`
    };

    context.chat_history.push({ role: 'user', content: userMessage });
    context.chat_history.push({ role: 'assistant', content: output.answer });
    context.metadata.lastToolUsed = this.name;

    return { context, output };
  }
};

export default echoTool;