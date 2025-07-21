import { v4 as uuidv4 } from 'uuid';
import Context from '../models/context.model';
import { MCPContext } from '../types/mcp.types';
import { userInfo } from 'os';

export class PersistentService {
    public static async loadContext(sessionId: string | null, userId: string): Promise<MCPContext> {
        if (sessionId) {
            const contextRecord = await Context.findByPk(sessionId);
            if (contextRecord) {
                return contextRecord.get('context_data') as MCPContext;
            }
        }

        const newSessionId = uuidv4();
        const newContext: MCPContext = {
            sessionId: newSessionId,
            userId: userId,
            chat_history: [],
            metadata: { createdAt: new Date().toISOString() }
        };

        await Context.create({
            sessionId: newSessionId,
            userId: userId,
            context_data: newContext
        });

        return newContext;
    }

    public static async saveContext(context: MCPContext): Promise<void> {
        const { sessionId } = context;
        await Context.upsert({
            sessionId: sessionId,
            userId: context.userId,
            context_data: context
        });
    }
}
