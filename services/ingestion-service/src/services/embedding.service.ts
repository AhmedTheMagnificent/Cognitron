import { createRequire } from 'module';
import fs from 'fs/promises';

// This creates a CommonJS-style 'require' function within our ES Module.
// It's the most robust way to import a CJS library like 'pdf-parse'.
const require = createRequire(import.meta.url);

// --- This section is correct and remains unchanged ---
class EmbeddingPipeline {
    static task: 'feature-extraction' = 'feature-extraction';
    static model = 'Xenova/all-MiniLM-L6-v2';
    static instance: any | null = null;
    static async getInstance(): Promise<any> {
        if (this.instance === null) {
            console.log('[Embedding Pipeline] Model not loaded. Initializing...');
            const { pipeline } = await import('@xenova/transformers');
            this.instance = await pipeline(this.task, this.model);
            console.log('[Embedding Pipeline] Model loaded successfully.');
        }
        return this.instance;
    }
}
async function getEmbeddingForChunk(chunk: string): Promise<number[]> {
    const extractor = await EmbeddingPipeline.getInstance();
    const result = await extractor(chunk, { pooling: 'mean', normalize: true });
    return Array.from(result.data);
}
interface EmbeddingEntry {
    chunkId: string;
    courseId: string;
    documentId: string;
    text: string;
    embedding: number[];
}
// --- End of unchanged section ---

export class EmbeddingService {
    public static async processDocument(filePath: string, courseId: string, documentId: string): Promise<{ chunksCreated: number }> {
        try {
            console.log(`[Ingestion Service] Starting PDF parsing for document: ${documentId}`);
            const dataBuffer = await fs.readFile(filePath);

            const pdf = require('pdf-parse');
            const data = await pdf(dataBuffer);
            const fullText = data.text;

            console.log(`[Ingestion Service] PDF parsing completed. Extracted ${fullText.length} characters.`);

            if (!fullText.trim()) {
                console.warn(`[Ingestion Service] No text could be extracted from PDF ${documentId}`);
                return { chunksCreated: 0 };
            }

            // *** THE FIX IS ON THIS LINE ***
            // Added explicit '(c: string)' types to satisfy TypeScript's strict mode.
            const chunks = fullText.split(/\n\s*\n/).filter((c: string) => c.trim().length > 20).map((c: string) => c.replace(/\s+/g, ' ').trim());

            if (chunks.length === 0) {
                console.warn(`[Ingestion Service] Document ${documentId} produced 0 chunks after parsing.`);
                return { chunksCreated: 0 };
            }
            console.log(`[Ingestion Service] Document ${documentId} was split into ${chunks.length} chunks.`);

            const embeddingFilePath = process.env.EMBEDDING_FILE_PATH!;
            let allEmbeddings: EmbeddingEntry[] = [];

            try {
                const existingData = await fs.readFile(embeddingFilePath, 'utf-8');
                allEmbeddings = JSON.parse(existingData);
            } catch (error) {
                console.log(`[Ingestion Service] Embeddings file not found. A new one will be created.`);
            }

            for (let i = 0; i < chunks.length; i++) {
                const chunk = chunks[i];
                const embeddingVector = await getEmbeddingForChunk(chunk);
                allEmbeddings.push({
                    chunkId: `${documentId}-chunk-${i}`,
                    courseId,
                    documentId,
                    text: chunk,
                    embedding: embeddingVector
                });
            }

            await fs.writeFile(embeddingFilePath, JSON.stringify(allEmbeddings, null, 2));
            console.log(`[Ingestion Service] Successfully saved ${chunks.length} new embeddings.`);

            return { chunksCreated: chunks.length };
        } catch (error) {
            console.error(`[Ingestion Service] FATAL ERROR processing document ${documentId}:`, error);
            throw error;
        }
    }
}