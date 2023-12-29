import { BaseLLM } from "langchain/llms/base";

export class BaseAppOpener {
    private llm: BaseLLM;

    constructor(llm: BaseLLM) {
        this.llm = llm;
    }

    async call(prompt: string): Promise<string> {
        return new Promise(async (resolve, reject) => {
            try {



                resolve(image_url);
            } catch (err) {
                reject(err);
            }
        });
    }
}

// 1. seek links in docs with high similarity
// 2. if no links found, use websearch to find links or open it via bash/shell
// 3. if 2 ask user to add link to knowledge base