import { ChatOpenAI } from "langchain/chat_models/openai";
import { endStream, waitUntilMarked, openApp, pushContentStream, addPrompt, addResult, openNewWindow } from "../sdk/main";
import { ChatPromptTemplate, MessagesPlaceholder } from "langchain/prompts";
import { HumanMessage, SystemMessage } from "langchain/schema";
import { StringOutputParser } from "langchain/schema/output_parser";
import { extractCode } from "./common/extract-code-on-md";
const PROMPT_ANALYZER = `
You are an expert Tailwind developer
You take screenshots of a reference web page from the user, and then build single page apps 
using Tailwind, HTML and JS.
You might also be given a screenshot of a web page that you have already built, and asked to
update it to look more like the reference image.

- Make sure the app looks exactly like the screenshot.
- Pay close attention to background color, text color, font size, font family, 
padding, margin, border, etc. Match the colors and sizes exactly.
- Use the exact text from the screenshot.
- Do not add comments in the code such as "<!-- Add other navigation links as needed -->" and "<!-- ... other news items ... -->" in place of writing the full code. WRITE THE FULL CODE.
- Repeat elements as needed to match the screenshot. For example, if there are 15 items, the code should have 15 items. DO NOT LEAVE comments like "<!-- Repeat for each news item -->" or bad things will happen.
- For images, use placeholder images from https://placehold.co and include a detailed description of the image in the alt text so that an image generation AI can generate the image later.

In terms of libraries,

- Use this script to include Tailwind: <script src="https://cdn.tailwindcss.com"></script>
- You can use Google Fonts
- Font Awesome for icons: <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css"></link>

Return only the full code in <html></html> tags.
`;
//https://github.com/abi/screenshot-to-code inspired by this

async function main() {
    const result = await waitUntilMarked();

    await openApp({
        height: 800,
        width: 1024,
    });
    await addPrompt("Analyzing image...");
    const imageBase64 = "data:image/png;base64," + result.fileBuffer.toString("base64");
    await addResult("<img width='256' src='" + imageBase64 + "' /> <br>");

    await addPrompt("Generating code...");
    const stream = await image2textOpenAi(imageBase64);

    let code = "";
    for await (const chunk of stream) {
        code += chunk;
        await pushContentStream(chunk);
    }
    await endStream();

    const parse = extractCode(code);
    await openNewWindow(parse, {
        bringToFront: true
    });
}


async function image2textOpenAi(imageBase64: string) {
    const chat = new ChatOpenAI({
        modelName: "gpt-4-vision-preview",
        maxTokens: 4050,
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
                },
                {
                    type: "text",
                    text: "Generate code for a web page that looks exactly like this.",
                },],
            }),
        ],
    });
    return result;
}

main();

