import { OpenAI } from "langchain/llms/openai";
import { addResult, addPrompt, extractWebsiteContent, extractYoutubeContent, getEmbedding, pushContentStream, pushLog, endStream, waitForInput, webResearch, getImagesBySimilarity, waitForConfirm, waitUntilMarked, extractTextFromImage, moveMouseTo, displayContentAtPositions, getActiveWindow, isStreaming, getDocsBySimilarity, getActiveWindowTitle, markAreas, openWindow, labelImage, toBase64, writeText, dragFrom, dragTo } from "../sdk/main";
import { BaseAnswer } from "./base-rawen/base-answer";
import { PromiseQueue } from "./common/queue.utils";
import { BaseSummarize } from "./base-rawen/base-summarize";
import { BaseSummarize2 } from "./base-rawen/base-summarize-2";
import { BaseVision } from "./base-rawen/base-vision.ts";
import { ChatOpenAI } from "langchain/chat_models/openai";
import { BaseDrawOpenAI } from "./base-rawen/base-draw-openai";
import { PromptTemplate } from "langchain/prompts";
import { BaseWebsearch } from "./base-rawen/base-websearch";
import { BaseKnowledgeQA } from "./base-rawen/base-knowledge-qa";
import { BaseAgent } from "./base-rawen/base-rawen-agent";
import { clusterWords } from "./common/screen-to-boundings";
import { refaceImage } from "./common/stability-ai";
import { boardySays } from "./common/boardy.util";
import { segmentImage } from "./common/local-sam";
import { BaseMarkLearn } from "./base-rawen/base-rawen-mark-learn";
import { BaseMarkCheckKnowledge } from "./base-rawen/base-rawen-mark-knowledge";
import { BaseActiveFromKnowledge } from "./base-rawen/base-rawen-active-title-knowledge";
import { mainerr } from "./base-rawen/command/label-active-window-command";
import { seeActLabeler } from "./base-rawen/command/see-act-text-agent";

const queue = new PromiseQueue(10);
const openAIApiKey = "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";
const togetheraiKey = "143499f858f0cf9d9ccda6c8492385e2e9676cd441daf19e312c0e91bc166348";

const llm = new OpenAI({
    openAIApiKey,
    // callbacks: [{
    //     handleLLMStart(t, prompts) {
    //         console.log("Analyzing text...");
    //     },
    //     handleLLMNewToken(t, prompts) {
    //         console.log("new Token");
    //     }
    // }],
    streaming: true,
    verbose: true
});

const chatModel = new ChatOpenAI({
    openAIApiKey,
    modelName: "gpt-4-vision-preview",
    maxTokens: 3400,
    cache: false
});
async function main() {

    const img = "C:/repos/Command-Playground/imgs/bieber.png"

    // //img to base64
    try {
        // await main("Im playing solitaire, tell me the next step?");
    } catch (err) {
        console.error(err);
    }

    // await ingesImages([img]);

    // const element = await waitUntilMarked();

    // await boardySays("I'm analyzing the image...");
    // const newImg = await refaceImage(element.fileBuffer, element.captureRect.width, element.captureRect.height);
    // const x = element.captureRect.x;
    // const y = element.captureRect.y;
    // const width = element.captureRect.width;
    // const height = element.captureRect.height;

    // await displayContentAtPositions([{
    //     x,
    //     y,
    //     width,
    //     height,
    //     html: `<img style="width:100%" src="data:image/png;base64,${newImg.toString("base64")}" />`
    // }]);

    // const text = await extractTextFromImage(element.fileBuffer);
    // const res = clusterWords(text.words);
    // const text2 = await new BaseVision(chatModel).call(element.fileBuffer, "What do you see ? In 1 sentence!");

    // console.log(text);

    // const res = await getEmbedding(["Hello World", "Hellowerwer World34"], "Xenova/all-MiniLM-L6-v2");
    // console.log(res);
    // const prompt = await waitForInput();
    // await addPrompt(prompt);

    // try {
    //     await new BaseAgent(llm).call(prompt, (chunk) => {
    //         queue.add(pushContentStream, chunk);
    //     }, (chunk) => {
    //         queue.add(pushLog, chunk)
    //     });
    // } catch (err) {
    //     console.log(err);
    //     queue.add(addContent, err.message);
    // } finally {
    //     queue.add(stopStream);
    //     await queue.waitUntilAllDone();
    // }


    // await new BaseKnowledgeQA(llm).call(prompt, (chunk) => {
    //     queue.add(pushContentStream, chunk);
    // });
    // queue.add(stopStream);

    // const result = await new BaseWebsearch(llm).call("Whos dominuc Hückmann", (chunk) => {
    //     queue.add(pushContentStream, chunk);
    // });
    // queue.add(addContent, result);
    // queue.add(stopStream);
    // await queue.waitUntilAllDone();

    // await new BaseAnswer(llm).answer(prompt, (chunk) => {
    //     queue.add(pushContentStream, chunk);
    // });

    // await new BaseSummarize(llm).summarize(prompt, (chunk) => {
    //     queue.add(pushContentStream, chunk);
    // });

    // queue.add(pushLog, "Analyzing text...");
    // const result = await new BaseSummarize2(llm).call(prompt, (chunk) => {
    //     queue.add(pushContentStream, chunk);
    // });
    // queue.add(addContent, result);

    // await new BaseVision(chatModel).call("https://cdn.britannica.com/69/65969-050-8E4B0AB9/Orangutan.jpg", prompt, (chunk) => {
    //     queue.add(pushContentStream, chunk);
    // });

    // const result = await new BaseDrawOpenAI(openAIApiKey).call(prompt);
    // queue.add(addContent, "<img style='width:\"100%\"' src='" + result + "' />");
}
main();
