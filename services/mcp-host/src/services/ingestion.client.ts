import 'dotenv/config';

const INGESTION_SERVICE_URL = process.env.INGESTION_SERVICE_URL;
if (!INGESTION_SERVICE_URL) throw new Error("INGESTION_SERVICE_URL is not defined in the .env file for mcp-host.");

interface IngestionJobPayload {
    filePath: string;
    courseId: string;
    documentId: string;
}

interface IngestionJobResponse {
    message: string;
}

export class IngestionClient {
    public static async startProcessing(payload: IngestionJobPayload): Promise<IngestionJobResponse> {
        try {
            console.log(`[IngestionClient]\ Sending job to ${INGESTION_SERVICE_URL}/process-document`);
            const response = await fetch(`${INGESTION_SERVICE_URL}/process-document`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!response.ok) {
                const errorBody = await response.text();
                throw new Error(`Ingestion service returned a non-ok status: ${response.status} - ${errorBody}`);
            }

            return await response.json();
        } catch(error) {
            console.error('[IngestionClient] A network or fetch error occurred:', error);
            throw error;
        }
    }
}