export interface ChatMessage { 
    role: 'user' | 'assistant' | 'system';
    content: string;
}

export interface MCPContext {
    sessionId: string;
    userId: string;
    chat_history: ChatMessage[];
    metadata: {
    createdAt: string;
    lastToolUsed?: string; // The question mark makes this property optional
    [key: string]: any; // Allows for other dynamic metadata
  };
}

export interface ToolInput {
    message: string;
}

export interface ToolOutput {
    answer: string;
}

export interface Tool {
    name: string;
    description: string;
    execute: (context: MCPContext, input: any) => Promise<{ context: MCPContext; output: any }>;
}