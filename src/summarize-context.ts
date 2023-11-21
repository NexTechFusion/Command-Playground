import { OpenAI } from "langchain/llms/openai";
import { loadSummarizationChain } from "langchain/chains";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { addHeaderContent, getWindowText, openApp, pushContentStream, pushResultLog, stopStream } from "../sdk/main";

async function summarize() {
    await new Promise(r => setTimeout(r, 3000));
    const text = await getWindowText();
    await openApp({
        width: 600,
        height: 300,
    });
    await addHeaderContent("Summarizing text...");

    if (!text) {
        await pushContentStream("No text to summarize");
        await stopStream();
        return;
    }

    const model = new OpenAI();
    const textSplitter = new RecursiveCharacterTextSplitter({ chunkSize: 500 });
    const docs = await textSplitter.createDocuments([text]);

    const chain = loadSummarizationChain(model, { type: "map_reduce" });
    const stream = await chain.stream({
        input_documents: docs
    }, {
        callbacks: [{
            handleLLMStart(t, prompts) {
                console.log("start");
                pushResultLog("Analyzing text...");
            }
        }]
    });

    for await (const chunk of stream) {
        await pushContentStream(chunk.text);
    }

    await stopStream();
}


summarize();