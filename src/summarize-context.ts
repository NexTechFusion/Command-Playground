import { OpenAI } from "langchain/llms/openai";
import { loadSummarizationChain } from "langchain/chains";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { addPrompt, getWindowText, openApp, pushContentStream, waitForConfirm, pushLog, stopStream } from "../sdk/main";

async function summarize() {
    const text = await getWindowText();
    await openApp({
        width: 600,
        height: 340,
    });
    await addPrompt("Checking text...");

    if (!text) {
        await pushContentStream("No text to summarize");
        await stopStream();
        return;
    }

    const model = new OpenAI();
    const textSplitter = new RecursiveCharacterTextSplitter({ chunkSize: 500 });
    const docs = await textSplitter.createDocuments([text]);

    if (docs.length > 50) {
        await waitForConfirm(`<div class='text-orange-400 text-lg text-center'> 
        <img src="https://media.tenor.com/OyWwTAp8PY0AAAAC/money-wallet.gif" width="128" class="m-auto mb-2 rounded-sm" />
        You summarizing a huge text, this would take some time and money. <br>
        </div>`, [{
            text: "Yes, go on"
        }]);
    }
    await addPrompt("Summarizing text...");
    const chain = loadSummarizationChain(model, { type: "map_reduce" });
    const stream = await chain.stream({
        input_documents: docs
    }, {
        callbacks: [{
            handleLLMStart(t, prompts) {
                pushLog("Analyzing text...");
            }
        }]
    });

    for await (const chunk of stream) {
        await pushContentStream(chunk.text);
    }

    await stopStream();
}


summarize();

