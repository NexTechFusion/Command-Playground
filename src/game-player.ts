import { OpenAI } from "langchain/llms/openai";
import { PromptTemplate } from "langchain/prompts";
import { StringOutputParser } from "langchain/schema/output_parser";
import { RunnableSequence } from "langchain/schema/runnable";
import { addPrompt, addResult, endStream, markAreas, pushContentStream, waitForConfirm, waitForInput, waitUntilMarked } from "../sdk/main";
import { boardySays } from "./common/boardy.util";
const openAIApiKey = "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";
let isMarking = false;
let gameName;
let gameExplanation;
let gameElements: GameElement[] = [];

interface GameElement {
    element: {
        fileBuffer: Buffer;
        captureRect: {
            x: number;
            y: number;
            width: number;
            height: number;
        };
    }
    explain: string;
}

const llm = new OpenAI({
    openAIApiKey,
    modelName: "gpt-3.5-turbo-1106",
    streaming: true,
    verbose: true
});

const gameExplainPrompt = `Give me a brief summarization of the game rules of the game : {prompt}
---
say "I don't know" if you don't know the game`;

async function gameExplainer(gameName: string) {
    const explainGameChain = RunnableSequence.from([
        PromptTemplate.fromTemplate(gameExplainPrompt),
        llm,
        new StringOutputParser()
    ]);

    const stream = await explainGameChain.stream({
        prompt: gameName
    });

    let result = "";
    for await (const chunk of stream) {
        result += chunk;
    }

    if (result.toLowerCase().includes("i don't know")) {
        await pushContentStream("I don't know that game, can u explain it to me?");
        await endStream();

        const explain = await waitForInput();
        await addPrompt(`Your explanation of the game : ${gameName}`);
        await pushContentStream(explain);
        await endStream();

        return explain;
    }

    await pushContentStream(result);
    await endStream();

    return result;
}

async function addMessage(message: string) {
    await boardySays(message);
}

async function markGameElements() {

    const element = await waitUntilMarked();

    // await openApp({
    //     bringToFront: true,
    //     keepInteraction: true,
    //     focus: true,
    //     height: 76,
    //     width: 400,
    // })
    await addMessage(`Tell me a bit about this marked element`);
    await markAreas([element.captureRect]);
    const explain = await waitForInput();

    await addPrompt("Eplaination of the marked element : " + gameElements.length);
    const imageBase64 = `data:image/png;base64,${element.fileBuffer.toString("base64")}`;
    await addResult(`<img src='${imageBase64}' /> <br /> ${explain}`);
    gameElements.push({ element, explain });

    const answer = await waitForConfirm("Are we done?", [{ text: "Yes" }, { text: "No" }]);

    if (answer == 0) {
        return;
    }

    await markGameElements();
}

async function main() {
    await addMessage("What game shall I play?");
    gameName = await waitForInput();
    await addMessage(`Checking if I know the game : ${gameName}`);
    await addPrompt(`Checking if I know the game : ${gameName}`);

    // 1 try to explain the game
    gameExplanation = await gameExplainer(gameName);

    // 2. play the game
    await addMessage("Mark the areas of the game that are relevant");
    await markGameElements();
}

main();