import { BaseMarkCheckKnowledge } from "../base-rawen-mark-knowledge";
import { addPrompt, addResult, isStreaming } from "../../../sdk/main";

export async function main() {

    const isStreamingActive = await isStreaming();
    if (!isStreamingActive) {
        await addPrompt("Mark and inform");
    }

    const result = await new BaseMarkCheckKnowledge().call();

    if (!result) {
        await addResult("Not found");
        return;
    }

    const img = `${result.About_Element} <br/> <br/> <img src="${result.image.path}"}" />`;

    await addResult(img);
}