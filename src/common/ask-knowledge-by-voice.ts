import { addResult, addPrompt, addInteractionContent, getDocsBySimilarity, getInteractionState, pushContentStream, startAudioRecording, endStream, } from "../../sdk/main";
import OpenAI, { toFile } from "openai";
import { RunnableSequence } from "langchain/schema/runnable";
import { PromptTemplate } from "langchain/prompts";
import { ChatOpenAI } from "langchain/chat_models/openai";
import { StringOutputParser } from "langchain/schema/output_parser";

async function main() {
    const buffer = await startAudioRecording();
    
    if (buffer && buffer.byteLength > 5000) {
        const text = await transcribe(buffer);
        await addPrompt("Question : " + text);
        const result = await askKnowledge(text);
        await addResult(result);
    }

    // main();
}
async function askKnowledge(text: string) {
    const model = new ChatOpenAI();
    const questionPrompt = PromptTemplate.fromTemplate(
        `Use the following pieces of context to answer the question at the end. If you don't know the answer, just say that you don't know, don't try to make up an answer.
  ----------------2
  CONTEXT: {context}
  ----------------
  CHAT HISTORY: {chatHistory}
  ----------------
  QUESTION: {question}
  ----------------
  Helpful Answer:`
    );
    const chain = RunnableSequence.from([
        {
            question: (input: { question: string; chatHistory?: string }) =>
                input.question,
            chatHistory: (input: { question: string; chatHistory?: string }) =>
                input.chatHistory ?? "",
            context: async (input: { question: string; chatHistory?: string }) => {
                const docs = await getDocsBySimilarity(text);
                return docs?.map((doc) => doc.pageContent).join("\n\n") ?? "";
            },
        },
        questionPrompt,
        model,
        new StringOutputParser(),
    ]);

    const state = await getInteractionState();
    const chatHistory = state?.history?.map((message) => message.content).join("\n\n");

    const resultOne = await chain.invoke({
        chatHistory,
        question: text,
    });

    return resultOne;
}

async function transcribe(buffer: Buffer) {
    const openAi = new OpenAI();
    const file = await toFile(buffer, 'speech.mp3');
    const result = await openAi.audio.transcriptions.create({
        file,
        language: 'en',
        model: 'whisper-1'
    });

    return result.text;
}

main();
