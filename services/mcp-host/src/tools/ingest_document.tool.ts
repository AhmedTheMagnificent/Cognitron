import { Tool, MCPContext } from "../types/mcp.types";
import { IngestionClient } from "../services/ingestion.client";

interface IngestToolInput {
    documentId: string;
    courseId: string;
    filePath: string;
}

const IngestDocumentTool: Tool = {
    name: "ingest_document",
    description: "Starts the asynchronous process of ingesting; and creating embeddings for a newly uploaded document.",
    async execute(context: MCPContext, input: IngestToolInput): Promise<{ context: MCPContext; output: any }> {
        console.log(`[MCP Tool] Executing ingest_document for doc ID: ${input.documentId}`);
        const result = await IngestionClient.startProcessing({
            filePath: input.filePath,
            courseId: input.courseId,
            documentId: input.documentId
        });
        const output = {
            message: result.message,
            status: "PROCESSING_STARTED",
            documentId: input.documentId
        };

        return { context, output }
    }
};

export default IngestDocumentTool;