import 'dotenv/config';

const INGESTION_SERVICE_URL = process.env.INGESTION_SERVICE_URL;

if (!INGESTION_SERVICE_URL) {
  throw new Error("INGESTION_SERVICE_URL is not defined in the .env file for mcp-host.");
}

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
        const targetUrl = `${INGESTION_SERVICE_URL}/process-document`;
        const requestBody = JSON.stringify(payload);

        // --- DEBUGGING LOGS ---
        // This will print the exact URL and body to your mcp-host logs.
        console.log(`[IngestionClient] Preparing to send job to: ${targetUrl}`);
        console.log(`[IngestionClient] Request Body being sent: ${requestBody}`);

        try {
            const response = await fetch(targetUrl, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Accept': 'application/json' // Add this for best practice
                },
                body: requestBody,
            });

            // --- MORE DEBUGGING LOGS ---
            // This tells us what the server thought of our request.
            console.log(`[IngestionClient] Received status code: ${response.status} from ingestion-service`);

            if (!response.ok) {
                const errorBody = await response.text();
                // This will show us the exact error message from the server.
                console.error(`[IngestionClient] Ingestion service returned an error. Body:`, errorBody);
                throw new Error(`Ingestion service returned a non-ok status: ${response.status} - ${errorBody}`);
            }

            return await response.json();
            
        } catch(error) {
            console.error('[IngestionClient] A network or fetch error occurred:', error);
            throw error;
        }
    }
}