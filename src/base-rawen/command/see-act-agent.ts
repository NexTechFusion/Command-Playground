import { ChatOpenAI } from "langchain/chat_models/openai";
import { addPrompt, dragFrom, endStream, getActiveDisplay, getActiveWindow, labelImage, mouseClickLeft, mouseDoubleClick, moveMouseTo, pressEnter, pushContentStream, pushLog, toBase64, writeText } from "../../../sdk/main";
import { BaseVision } from "../base-vision.ts";
import { parseJSONFromString } from "../../common/general.utils";

const promptTemplate = `Act like an AI assisant that is helping a human navigating, interacting or informating based on the number labels and information given by the image which refelcts a current state of an UI.
 The human request is : {REQUEST}.
 -----------------
 Nothing is focused on the UI.
 Do not say actions that are not possible in the current state of the UI.

 Possible_actions :
    - { "name" : "Mouse_Double_Click" , "label" : "Label number"} // Moves the mouse to the center of the label and double clicks
    - { "name" : "Mouse_Click", "label" : "Label number"} // Moves the mouse to the center of the label and clicks
    - { "name" : "Mouse_Drag_From", "label" : "Label number" } // Moves the mouse to the label and starts dragging
    - { "name" : "Mouse_Drag_To", "label" : "Label number" } // Moves the the label and stops dragging
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

export async function main(prompt = process.env.prompt ?? "What is the weather in Paris ?") {
    return new Promise<void>(async (resolve) => {
        await new Promise((resolve) => setTimeout(resolve, 3000));
        let activeWindow = await getActiveWindow();

        if (!activeWindow) {
            activeWindow = await getActiveDisplay();
        }

        const labeled = await labelImage(activeWindow.fileBuffer);
        const vision = new BaseVision(new ChatOpenAI({ modelName: "gpt-4-vision-preview", maxTokens: 1024, openAIApiKey: "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" }));

        // Debugging purposes
        await addPrompt("SeeAct");
        const imgHtml = `<img src="${toBase64(labeled.img)}" />`;
        await pushContentStream(imgHtml);
        const res = await vision.call(labeled.img, promptTemplate.replace("{REQUEST}", prompt));
        await sleep(500);
        await endStream();
        // End debugging purposes
        const parsed = parseJSONFromString(res) as Action[];
        let isFullfilled = false;

        function getLabelCords(label) {
            if (typeof label === "string") {
                label = parseInt(label);
            }

            const field = labeled.fields.find(x => x.number === label);
            if (field) {
                const centerX = field.rect.x + field.rect.width / 3;
                const centerY = field.rect.y + field.rect.height / 3;

                return { x: centerX, y: centerY }
            }

            return null;
        }

        for (const data of parsed) {
            await addPrompt(`Action ${data.name}`);

            switch (data.name) {
                case "Provide_Information":
                    await pushContentStream(data.text);
                    break;
                case "Mouse_Click":
                    const cords = getLabelCords(data.label);

                    if (cords) {
                        await moveMouseTo(cords.x, cords.y);
                    }

                    await mouseClickLeft();
                    break;
                case "Mouse_Double_Click":
                    await mouseDoubleClick();
                    break;
                case "Mouse_Drag_From":
                    const cordsDragFrom = getLabelCords(data.label);

                    if (cordsDragFrom) {
                        await dragFrom(cordsDragFrom.x, cordsDragFrom.y);
                    }
                    break;
                case "Mouse_Drag_To":
                    const cordsDragTo = getLabelCords(data.label);

                    if (cordsDragTo) {
                        await dragFrom(cordsDragTo.x, cordsDragTo.y);
                    }
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
            return await main(prompt);
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