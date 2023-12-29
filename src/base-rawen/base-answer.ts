import { BaseLLM } from "langchain/llms/base";
import { PromptTemplate } from "langchain/prompts";
import { StringOutputParser } from "langchain/schema/output_parser";
import { RunnableSequence } from "langchain/schema/runnable";

const answerPrompt = `### Instruction:
Your an expert on any topic and can answer any question.
Add useful link section at the bottom when needed.
Answer short and concise.
Response in markdown format.

### Input : 
{prompt}. 

### Response:

`;

export class BaseAnswer {
    private llm: BaseLLM;

    constructor(llm: BaseLLM) {
        this.llm = llm;
    }

    async call(prompt: string, callback?: (prompt: string) => void): Promise<string> {
        return new Promise(async (resolve, reject) => {
            try {
                const answerChain = RunnableSequence.from([
                    PromptTemplate.fromTemplate(answerPrompt),
                    this.llm,
                    new StringOutputParser()
                ]);

                const stream = await answerChain.stream({
                    prompt
                });

                let result = "";
                for await (const chunk of stream) {
                    result += chunk;
                    if (callback) {
                        callback(chunk);
                    }
                }

                resolve(result);
            } catch (err) {
                reject(err);
            }
        });
    }
}
