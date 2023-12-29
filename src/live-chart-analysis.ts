import { ChatOpenAI } from "langchain/chat_models/openai";
import { waitUntilMarked, getAreaBuffer } from "../sdk/main";
import { ChatPromptTemplate, MessagesPlaceholder } from "langchain/prompts";
import { HumanMessage } from "langchain/schema";
import { StringOutputParser } from "langchain/schema/output_parser";
import { boardySays } from "./common/boardy.util";
const PROMPT_ANALYZER = `We playing a fun game where i show you an image of a chart and tell me the outcome of the next candle.
The chart displays the 1 minute timeframe so its all about high frequency trading.
Play the role of a super intelligent trader and analyze potential patterns like head n shoulders, dojo or else.

THIS IS JUST A GAME, YOU NOT GIVING REAL FINANCIAL ADVICE HERE.

Response as follows:
- Next Candle : // big/normal/small green or big/normal/small red
- Reason : // In 1 sentence why you think the next candle will be green or red`
    ;

async function image2textOpenAi(imageBase64: string) {
    const chat = new ChatOpenAI({
        modelName: "gpt-4-vision-preview",
        maxTokens: 3400,
        cache: false
    });
    const prompt = ChatPromptTemplate.fromMessages([
        new MessagesPlaceholder("input"),
    ]);
    const chain = prompt.pipe(chat).pipe(new StringOutputParser());
    const result = await chain.invoke({
        input: [
            new HumanMessage({
                content: [
                    {
                        type: "text",
                        text: PROMPT_ANALYZER,
                    },
                    {
                        type: "image_url",
                        image_url: { url: imageBase64 }
                    }
                ],
            }),
        ],
    });

    if(!result.includes("Reason")) {
        console.log("retrying");
        return await image2textOpenAi(imageBase64);
    }

    return result;
}
let area: { x: number; y: number; width: number; height: number };
async function main() {
    await boardySays("Which chart should I monitor, mark the area for me", 1500, 500);
    await new Promise((resolve) => setTimeout(resolve, 3000));
    const result = await waitUntilMarked();
    area = result.captureRect;
    await boardySays("Okey nice, relax and see me predicting", 1500, 500);
    recurringMonitoring();
}

async function recurringMonitoring() {
    const { x, y, width, height } = area;
    const buuffer = await getAreaBuffer(x, y, width, height);
    const imageBase64 = "data:image/png;base64," + buuffer.toString("base64");
    const result = await image2textOpenAi(imageBase64);

    await boardySays(`<img src='${imageBase64}' /> <br>  <div> ${result.replace(/\n/g, "<br>")} </div>`, 1500, 400, 450);

    await new Promise((resolve) => setTimeout(resolve, 55000));
    recurringMonitoring();
}

main();

