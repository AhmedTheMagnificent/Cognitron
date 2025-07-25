import { Tool, MCPContext, IngestToolInput, IngestToolOutput } from '../types/mcp.types.js';
import { IngestionClient } from "../services/ingestion.client.js";


const ingestDocumentTool: Tool<IngestToolInput, IngestToolOutput> = {
    name: "ingest_document",
    description: "Starts the asynchronous process of ingesting; and creating embeddings for a newly uploaded document.",
    async execute(context: MCPContext, input: IngestToolInput): Promise<{ context: MCPContext; output: IngestToolOutput }> {
        console.log(`[MCP Tool] Executing ingest_document for doc ID: ${input.documentId}`);
        context.courseId = input.courseId;
        console.log(`[MCP Tool] Set active courseId in context to: ${context.courseId}`);
        const result = await IngestionClient.startProcessing({
            filePath: input.filePath,
            courseId: input.courseId,
            documentId: input.documentId
        });
        const output: IngestToolOutput = {
            message: result.message,
            status: "PROCESSING_STARTED",
            documentId: input.documentId
        };

        return { context, output }
    }
};

export default ingestDocumentTool;