import { loadSummarizationChain } from "langchain/chains";
import { BaseLLM } from "langchain/llms/base";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { Callbacks } from "langchain/callbacks";
import { PromptTemplate } from "langchain/prompts";

export class BaseSummarize2 {
    private llm: BaseLLM;

    constructor(llm: BaseLLM) {
        this.llm = llm;
    }

    // TODO callback
    async call(content: string, prompt?: string, callback?: (prompt: string) => void, options?: { callbacks?: Callbacks }): Promise<string> {
        return new Promise(async (resolve, reject) => {
            try {
                const textSplitter = new RecursiveCharacterTextSplitter({ chunkSize: 500 });
                const docs = await textSplitter.createDocuments([content]);

                const addition = prompt ? `and take ${prompt} into account` : ``;
                const template = `Write a concise summary ${addition} of the following:


                "{text}"
                
                
                CONCISE SUMMARY:`

                const chain = loadSummarizationChain(this.llm, {
                    type: "refine", refinePrompt: new PromptTemplate({
                        template,
                        inputVariables: ['text'],
                    })
                });
                const result = await chain.invoke({
                    input_documents: docs
                }, {
                    callbacks: options?.callbacks
                });

                resolve(result.output_text?.trimStart() ?? "Nothing to summarize");
            } catch (err) {
                reject(err);
            }
        });
    }
}