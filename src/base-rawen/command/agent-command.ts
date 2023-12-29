import { addResult, pushContentStream, pushLog, endStream } from "../../../sdk/main"
import { BaseAgent } from "../base-rawen-agent";
import { OpenAI } from "langchain/llms/openai";
import { PromiseQueue } from "../../common/queue.utils";

export async function main() {
    const queue = new PromiseQueue(10);
    const openAIApiKey = "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";
    const llm = new OpenAI({
        openAIApiKey,
        streaming: true
    });

    try {
        await new BaseAgent(llm).call(process.env.prompt, (chunk) => {
            queue.add(pushContentStream, chunk);
        }, (chunk) => {
            queue.add(pushLog, chunk)
        });
        queue.add(endStream);
    } catch (err) {
        console.log(err);
        queue.add(addResult, err.message);
    } finally {
        queue.add(endStream);
        await queue.waitUntilAllDone();
    }
}