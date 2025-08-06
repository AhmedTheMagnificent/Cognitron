import { Groq } from 'groq-sdk';
import { AIService } from '../services/ai.service.js';
import { Tool, MCPContext, RagToolInput, RagToolOutput } from '../types/mcp.types.js';

// Initialize the Groq client. It will automatically look for the GROQ_API_KEY in process.env.
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

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

        // 1. Retrieve relevant context from our documents.
        const relevantChunks = await AIService.findRelevantChunks(userMessage, context.courseId);
        const contextString = relevantChunks.join('\n---\n');

        // 2. Define the prompts for the LLM.
        const systemPrompt = `You are a helpful AI study assistant. Your name is Cognitron. Answer the user's question based ONLY on the provided "RELEVANT DOCUMENT CONTEXT". Do not use any outside knowledge. If the context is not sufficient to answer, you MUST say "I could not find information about that in your documents." Be concise and clear.`;
        const userPrompt = `--- RELEVANT DOCUMENT CONTEXT ---\n${contextString}\n\n--- QUESTION ---\n${userMessage}`;
        
        console.log("--- SENDING TO GROQ LLM ---");
        
        // --- 3. THE REAL LLM CALL ---
        // This section replaces the old simulation.
        let llmAnswer = "Sorry, I encountered an error and couldn't generate an answer.";
        try {
            const chatCompletion = await groq.chat.completions.create({
                // Model selection: Llama3 8B is fast and capable.
                model: "llama3-8b-8192", 
                messages: [
                    // Provide the system prompt to define the AI's persona and rules.
                    { role: "system", content: systemPrompt },
                    // Provide the user's actual question along with the retrieved context.
                    { role: "user", content: userPrompt }
                ],
                // Optional parameters to control creativity vs. factuality.
                temperature: 0.3, // Lower temperature for more factual, less creative answers.
                max_tokens: 1024,
                top_p: 1,
            });
            
            // Safely get the content from the response.
            llmAnswer = chatCompletion.choices[0]?.message?.content || llmAnswer;

        } catch (error) {
            console.error("[RAG Tool] Error calling Groq API:", error);
            // The llmAnswer will keep its default error message.
        }
        
        // 4. Update context with the REAL answer and return the output.
        context.chat_history.push({ role: 'user', content: userMessage });
        context.chat_history.push({ role: 'assistant', content: llmAnswer });
        context.metadata.lastToolUsed = this.name;

        return {
            context: context,
            output: {
                answer: llmAnswer,
                sources: relevantChunks // It's good practice to return the sources used.
            }
        };
    }
};

export default ragTool;