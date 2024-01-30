import { ChatOpenAI } from "langchain/chat_models/openai";
import { addPrompt, displayCursorContent, endStream, extractTextFromImage, getActiveDisplay, getActiveWindow, getWindowText, hideCursorContent, labelImage, mouseClickLeft, moveMouseTo, pressEnter, pushContentStream, pushLog, toBase64, writeText } from "../../../sdk/main";
import { BaseVision } from "../base-vision.ts";
import { parseJSONFromString } from "../../common/general.utils";
import { RunnableSequence } from "langchain/schema/runnable";
import { PromptTemplate } from "langchain/prompts";
import { StringOutputParser } from "langchain/schema/output_parser";
import { OpenAI } from "langchain/llms/openai";

const workaorundTempate = "{prompt}"
const promptTemplate = `Act like an AI assisant that is helping a human navigating, interacting or informating based on the text and bounding boxes of the current active window view.
 The human request is : {REQUEST}.
 -----------------
 The window view is:
 {WINDOW_VIEW}
-----------------

 Possible_actions :
    - { "name" : "Mouse_Double_Click"}
    - { "name" : "Mouse_Click", "label" : "Label number"} // Moves the mouse to the center of the label and clicks
    - { "name" : "Mouse_Drag_From", "label" : "Label number" } 
    - { "name" : "Mouse_Drag_To", "label" : "Label number" }
    - { "name" : "Keyboard_Type" "text": ...Text }
    - { "name" : "Keyboard_Enter_Key" }
    - { "name" : "Provide_Information" "text": ...Text },
    - { "name" : "Request_fullFilled", "text" ...Text } // If the request is fullfilled and why

Response JSON of the Actions like this:
[{
    ...// from Possible_actions
 }...(this can repeat N times)]
`;

// Improvements : parse directly on while streaming ~2Sec faster on inital

function clusterWords(words: any[]) {
    words = words.filter(o => o.text.length < 100 && o.text.length > 3);
    const merged: any[] = [];
    for (let word of words) {
        const found = merged.find(o =>
            (o.bbox.y0 == word.bbox.y0 ||
                o.bbox.y0 - 16 < word.bbox.y0 && o.bbox.y0 + 16 > word.bbox.y0) &&
            o.bbox.x1 + word.fontSize + 6 > word.bbox.x0
        );

        if (found && !found.text.includes(word.text)) {
            found.text += " " + word.text;
            found.bbox.x1 = word.bbox.x1;
        } else {
            merged.push(word);
        }

        words = merged;
    }

    return words.map((o, i) => ({ ...o, Label_Number: i + 1 }));
}

const openAIApiKey = "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";
const togetheraiKey = "143499f858f0cf9d9ccda6c8492385e2e9676cd441daf19e312c0e91bc166348";

const llm = new OpenAI({
    openAIApiKey,
    streaming: true,
    verbose: true
});

export async function seeActLabeler(prompt = process.env.prompt ?? "What is the weather in Paris ?", callback?: (prompt: string) => void) {
    return new Promise<void>(async (resolve) => {
        await new Promise((resolve) => setTimeout(resolve, 3000));
        let activeWindow = await getActiveWindow();

        if (!activeWindow) {
            activeWindow = await getActiveDisplay();
        }

        const label = await extractTextFromImage(activeWindow.fileBuffer);
        const clustered = clusterWords(label.words);

        await addPrompt("SeeAct");
        const answerChain = RunnableSequence.from([
            PromptTemplate.fromTemplate(workaorundTempate),
            llm,
            new StringOutputParser()
        ]);

        const stream = await answerChain.stream({
            prompt: promptTemplate.replace("{prompt}", prompt).replace("{WINDOW_VIEW}", JSON.stringify(clustered))
        });

        let result = "";
        for await (const chunk of stream) {
            result += chunk;
            if (callback) {
                callback(chunk);
            }
        }

        console.log("RESULT", result);

        await sleep(500);
        await endStream();
        // End debugging purposes
        const parsed = parseJSONFromString(result) as Action[];
        let isFullfilled = false;
        for (const data of parsed) {
            await addPrompt(`Action ${data.name}`);

            switch (data.name) {
                case "Provide_Information":
                    await pushContentStream(data.text);
                    break;
                case "Mouse_Click":
                    let label = data.label;

                    if (typeof label === "string") {
                        label = parseInt(label);
                    }

                    const field = clustered.find(x => x.Label_Number === label);
                    if (field) {
                        const centerX = field.rect.x + field.rect.width / 3;
                        const centerY = field.rect.y + field.rect.height / 3;
                        await moveMouseTo(centerX, centerY);
                    }

                    await mouseClickLeft();
                    break;
                case "Mouse_Double_Click":
                    break;
                case "Mouse_Drag_From":
                    break;
                case "Mouse_Drag_To":
                    break;
                case "Keyboard_Type":
                    await pushContentStream(data.text);
                    await writeText(data.text);
                    break;
                case "Keyboard_Enter_Key":
                    await pressEnter();
                    break;
                case "Request_fullFilled":
                    await pushContentStream(data.text);
                    isFullfilled = true;
                    break;
            }

            await sleep(1000);
            await endStream();

        }

        if (!isFullfilled) {
            return await seeActLabeler(prompt);
        }

        resolve();
    });
}

async function sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}


type Action =
    | { name: 'Provide_Information'; text: string }
    | { name: 'Mouse_Click', label: number }
    | { name: 'Mouse_Double_Click' }
    | { name: 'Mouse_Drag_From'; label: number }
    | { name: 'Mouse_Drag_To'; label: number }
    | { name: 'Keyboard_Enter_Key' }
    | { name: 'Request_fullFilled', text: string }
    | { name: 'Keyboard_Type'; text: string };