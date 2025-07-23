import fs from 'fs/promises';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

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

// Alternative PDF text extraction using system tools (fallback option)
async function extractTextWithSystemTools(filePath: string): Promise<string> {
    try {
        // Try pdftotext (part of poppler-utils) if available
        const { stdout } = await execAsync(`pdftotext "${filePath}" -`);
        return stdout;
    } catch (error) {
        console.warn('[PDF Extraction] pdftotext not available, trying alternative...');
        throw new Error('No PDF extraction method available');
    }
}

export class EmbeddingService {
    public static async processDocument(filePath: string, courseId: string, documentId: string): Promise<{ chunksCreated: number }> {
        try {
            console.log(`[Ingestion Service] Starting processing for document: ${documentId} from path: ${filePath}`);
            
            let fullText = '';
            
            // Try system-based extraction first (most reliable)
            try {
                fullText = await extractTextWithSystemTools(filePath);
                console.log(`[Ingestion Service] Extracted ${fullText.length} characters using system tools`);
            } catch (systemError) {
                console.log('[Ingestion Service] System tools not available, falling back to manual parsing...');
                
                // Fallback: Simple text extraction for basic PDFs
                // This is a very basic approach - in production you'd want a more robust solution
                const dataBuffer = await fs.readFile(filePath);
                const pdfText = dataBuffer.toString('latin1');
                
                // Extract text between stream objects (very basic PDF parsing)
                const textMatches = pdfText.match(/stream\s*(.*?)\s*endstream/gs) || [];
                fullText = textMatches
                    .map(match => match.replace(/stream|endstream/g, ''))
                    .join(' ')
                    .replace(/[^\x20-\x7E]/g, ' ') // Remove non-printable characters
                    .replace(/\s+/g, ' ')
                    .trim();
                
                console.log(`[Ingestion Service] Extracted ${fullText.length} characters using basic parsing`);
            }
            
            if (!fullText.trim()) {
                console.warn(`[Ingestion Service] No text could be extracted from PDF ${documentId}`);
                return { chunksCreated: 0 };
            }
            
            const chunks = fullText
                .split(/\.\s+/)  // Split on sentence boundaries
                .filter((c: string) => c.trim().length > 20)
                .map((c: string) => c.replace(/\s+/g, ' ').trim());
            
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