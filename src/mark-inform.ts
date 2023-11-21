import { ChatOpenAI } from "langchain/chat_models/openai";
import { stopStream, markArea, openApp, pushContentStream, startStream } from "../sdk/main";
import { ChatPromptTemplate, MessagesPlaceholder } from "langchain/prompts";
import { HumanMessage, SystemMessage } from "langchain/schema";
import { StringOutputParser } from "langchain/schema/output_parser";
const PROMPT_ANALYZER = `Explain what the image is about in 1-2 sentences.`;

async function image2textOpenAi(imageBase64: string) {
    const chat = new ChatOpenAI({
        modelName: "gpt-4-vision-preview",
        maxTokens: 3400,
        cache: false
    });
    const prompt = ChatPromptTemplate.fromMessages([
        new SystemMessage(PROMPT_ANALYZER),
        new MessagesPlaceholder("input"),
    ]);
    const chain = prompt.pipe(chat).pipe(new StringOutputParser());
    const result = await chain.stream({
        input: [
            new HumanMessage({
                content: [{
                    type: "image_url",
                    image_url: imageBase64
                }],
            }),
        ],
    });
    return result;
}
async function main() {
    const result = await markArea();

    await openApp({
        height: 364,
        width: 412,
    });
    await startStream();
    const imageBase64 = "data:image/png;base64," + result.fileBuffer.toString("base64");
    pushContentStream("<img width='128px' src='" + imageBase64 + "' /> <br>");
    const stream = await image2textOpenAi(imageBase64);

    for await (const chunk of stream) {
        await pushContentStream(chunk);
    }

    await stopStream();
}

main();

