import fs from 'fs/promises';


class EmbeddingPipeline {
    static task: 'feature-extraction' = 'feature-extraction';
    static model = 'Xenova/all-MiniLM-L6-v2';
    static instance: any | null = null;

    static async getInstance(): Promise<any> {
        if (this.instance == null) {
            const { pipeline } = await import('@xenova/transformers');
            this.instance = await pipeline(this.task, this.model);
        }
        return this.instance
    }
}

function cosineSimilarity(vecA: number[], vecB: number[]): number {
    let dotProduct = 0;
    let magnitudeA = 0;
    let magnitudeB = 0;
    for (let i = 0; i < vecA.length; i++) {
        dotProduct += vecA[i] * vecB[i];
        magnitudeA += vecA[i] * vecA[i];
        magnitudeB += vecB[i] * vecB[i];
    }
    if (magnitudeA === 0 || magnitudeB === 0) {
        return 0;
    }
    return dotProduct / (Math.sqrt(magnitudeA) * Math.sqrt(magnitudeB));
}

export class AIService {
    private static async getEmbedding(text: string): Promise<number[]> {
        const extractor = await EmbeddingPipeline.getInstance();
        const result = await extractor(text, { pooling: 'mean', normalize: true });
        return Array.from(result.data);
    }

    public static async findRelevantChunks(question: string, courseId: string): Promise<string[]> {
        const embeddingFilePath = process.env.EMBEDDING_FILE_PATH;
        if (!embeddingFilePath) {
            throw new Error("EMBEDDING_FILE_PATH is not set in the .env file for mcp-host.");
        }
        console.log(`[AI Service] Finding relevant chunks for course: ${courseId}`);
        const questionEmbedding = await this.getEmbedding(question);
        let allEmbeddings: any[] = [];
        try {
            const data = await fs.readFile(embeddingFilePath, 'utf-8');
            allEmbeddings = JSON.parse(data);
        } catch {
            console.warn('[AI Service] embeddings.json not found. Cannot perform search.');
            return ["I couldn't find any documents to search through. Please upload some course material first."];
        }

        const courseEmbeddings = allEmbeddings.filter(e => e.courseId == courseId);
        if (courseEmbeddings.length === 0) {
            console.warn(`[AI Service] No embeddings found for courseId: ${courseId}`);
            return ["I found some documents, but none seem to belong to this specific course."];
        }
        const chunksWithSimilarity = courseEmbeddings.map(chunk => ({
            text: chunk.text,
            similarity: cosineSimilarity(questionEmbedding, chunk.embedding)
        }));
        chunksWithSimilarity.sort((a, b) => b.similarity - a.similarity);
        const topChunks = chunksWithSimilarity.slice(0, 3).map(c => c.text);

        console.log(`[AI Service] Found ${topChunks.length} relevant chunks.`);
        return topChunks;
    }


}