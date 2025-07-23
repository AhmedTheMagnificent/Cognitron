import express, { Request, Response } from 'express';
import 'dotenv/config';
import { EmbeddingService } from './services/embeddings.service.js';

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3004;

app.post('/process-document', async (req: Request, res: Response) => {
    const { filePath, courseId, documentId } = req.body;
    if (!filePath || !courseId || !documentId) {
        return res.status(400).json({ error: 'filePath, courseId, and documentId are required.' });
    }

    console.log(`[Ingestion Server] Received job for document: ${documentId}`);
    EmbeddingService.processDocument(filePath, courseId, documentId).then((result: {chunksCreated: number}) => {
        console.log(`[Ingestion Server] BACKGROUND JOB SUCCESS for doc: ${documentId}. Chunks: ${result.chunksCreated}.`);
    }).catch((error: any) => {
        console.error(`[Ingestion Server] BACKGROUND JOB FAILED for doc: ${documentId}.`);
    });
    res.status(202).json({ message: `Processing job for document ${documentId} has been accepted.` });
});

app.get('/', (req, res) => res.status(200).send('Ingestion Service is alive.'));

app.listen(PORT, () => {
    console.log(`[Ingestion Server] Service is listening on internal port ${PORT}`);
});