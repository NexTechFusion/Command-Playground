import { addPrompt, addResult, isStreaming } from "../../../sdk/main";
import { BaseMarkLearn } from "../base-rawen-mark-learn";

export async function main() {

    const isStreamingActive = await isStreaming();
    if (!isStreamingActive) {
        await addPrompt("Mark and learn");
    }

    const result = await new BaseMarkLearn().learn();

    const desc = `${result.explain} <br/> <br/> <img src="${result.imgSrc}"}" />`;
    await addResult(desc);
}   