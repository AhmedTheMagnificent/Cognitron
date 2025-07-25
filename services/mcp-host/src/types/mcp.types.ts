export interface ChatMessage { 
    role: 'user' | 'assistant' | 'system';
    content: string;
}

export interface MCPContext {
    sessionId: string;
    userId: string;
    courseId?: string;
    chat_history: ChatMessage[];
    metadata: {
        createdAt: string;
        lastToolUsed?: string; // The question mark makes this property optional
        [key: string]: any; // Allows for other dynamic metadata
    };
}

export interface Tool<InputType = any, OutputType = any> {
    name: string;
    description: string;
    execute: (context: MCPContext, input: InputType) => Promise<{ context: MCPContext; output: OutputType }>;
}

export interface RagToolInput {
    message: string;
}

export interface RagToolOutput {
    answer: string;
    sources: string[]; // It's good practice to return the sources used
}

export interface IngestToolInput {
    documentId: string;
    filePath: string;
    courseId: string;
}
export interface IngestToolOutput {
    message: string;
    status: 'PROCESSING_STARTED' | 'COMPLETED' | 'FAILED';
    documentId: string;
}