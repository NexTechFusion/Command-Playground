import { BaseLLM } from "langchain/llms/base";
import { extractWebsiteContent, extractYoutubeContent } from "../../sdk/main";
import { BaseSummarize2 } from "./base-summarize-2";
import { Embeddings } from "langchain/embeddings/base";

export class BaseWebsiteExtractor {
    private llm: BaseLLM;
    private embeddings: Embeddings;

    constructor(llm: BaseLLM) {
        this.llm = llm;
    }

    async call(url: string, prompt: string, callback?: (prompt: string) => void) {
        return new Promise(async (resolve, reject) => {
            try {

                let content = "";
                const isYoutube = url.toLowerCase().includes("youtube");

                if (isYoutube) {
                    const response = await extractYoutubeContent(url);
                    const text = response.map((item) => item.text).join("\n");
                    content = text;
                } else {
                    const contents = await extractWebsiteContent(url);
                    content = contents[0].content;
                }

                const result = await new BaseSummarize2(this.llm).call(content, prompt, callback);

                resolve(result);
            } catch (err) {
                reject(err);
            }
        });
    }

}