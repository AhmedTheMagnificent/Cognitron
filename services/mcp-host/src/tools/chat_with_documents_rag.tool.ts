import { AIService } from "../services/ai.service.js";
import { Tool, MCPContext, RagToolInput, RagToolOutput } from '../types/mcp.types.js';

const ragTool: Tool<RagToolInput, RagToolOutput> = {
    name: "chat_with_documents_rag",
    description: "Answers a user's question using the content of their uploaded documents.",

    async execute(context: MCPContext, input: RagToolInput): Promise<{ context: MCPContext; output: RagToolOutput }> {
        const userMessage = input.message;
        console.log(`[RAG Tool] Received question: "${userMessage}"`);
        if (!context.courseId) {
            console.warn('[RAG Tool] Attempted to use RAG tool without a courseId in the context.');

            const helpfulError = "I'm not sure which course's documents to search. Please select a course first.";

            context.chat_history.push({ role: 'user', content: userMessage });
            context.chat_history.push({ role: 'assistant', content: helpfulError });

            return {
                context,
                output: { answer: helpfulError, sources: [] }
            };
        }
        const relevantChunks = await AIService.findRelevantChunks(userMessage, context.courseId);
        const history = context.chat_history.map(turn => `${turn.role}: ${turn.content}`).join('\n');
        const contextString = relevantChunks.join('\n---\n');
        const prompt = `
                        You are a helpful AI study assistant. Answer the user's question based ONLY on the provided context. If the context is not sufficient, say "I could not find information about that in your documents."

                        --- CONVERSATIONAL HISTORY ---
                        ${history}

                        --- RELEVANT DOCUMENT CONTEXT ---
                        ${contextString}

                        --- NEW QUESTION ---
                        user: ${userMessage}
                        assistant:`;
        console.log("--- PROMPT FOR LLM ---");
        console.log(prompt);
        console.log("----------------------");
        const llmAnswer = `(I am a simulated LLM.) Based on the context, here's what I found about "${userMessage}":\n\n- ${relevantChunks.join('\n- ')}`;
        context.chat_history.push({ role: 'user', content: userMessage });
        context.chat_history.push({ role: 'assistant', content: llmAnswer });
        context.metadata.lastToolUsed = this.name;
        return {
            context: context,
            output: {
                answer: llmAnswer,
                sources: relevantChunks
            }
        };
    }

};

export default ragTool;
