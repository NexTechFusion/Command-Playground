import { BaseLLM } from "langchain/llms/base";
import { PromptTemplate } from "langchain/prompts";
import { StringOutputParser } from "langchain/schema/output_parser";
import { RunnableSequence } from "langchain/schema/runnable";

const COMPRESS_PROMPT = `### Instructions:
Compress the following Input by summarizing.

### Input:
{text}

### Response:
`;


const SUMMARY_PROMPT = `### Instructions:
Summarize the following Input.

### Input:
{text}

### Response:
`;

const SUMMARY_REFINE_PROMPT = `### Instructions:
Summarize the following Input.

### Input:
{existing_answer}
{text}

### Response:
`;

export class BaseSummarize {
    private llm: any;

    constructor(llm: BaseLLM) {
        this.llm = llm;
    }

    async call(content: string, callback?: (prompt: string) => void) {
        return new Promise(async (resolve, reject) => {
            const model = this.llm;
            const outPutParser = new StringOutputParser();

            const compressTemplate = PromptTemplate.fromTemplate(COMPRESS_PROMPT);
            const summaryTemplate = PromptTemplate.fromTemplate(SUMMARY_PROMPT);
            const summaryRefineTemplate = PromptTemplate.fromTemplate(SUMMARY_REFINE_PROMPT);

            const summarizationChain = RunnableSequence.from([summaryTemplate, model, outPutParser]);
            const summaryRefineChain = RunnableSequence.from([summaryRefineTemplate, model, outPutParser]);
            const compressChain = RunnableSequence.from([compressTemplate, model, outPutParser]);

            const getNumTokens = async (text: string): Promise<number> => model.getNumTokens(text);

            const compressContent = async (text: string) => {
                return await compressChain.invoke({ text });
            }

            // lazy split until universal toknization is implemented
            const splitCharacters = (text: string) => {
                const maximum_tokens = 2000;

                const textList: string[] = [];
                let wordsCollected = "";
                let iteration = 0;
                const splittedChars = text.split(" ");

                for (let i = 0; i < splittedChars.length; i++) {
                    const word = splittedChars[i];
                    const isLastItem = i === splittedChars.length - 1;

                    const numTokens = (wordsCollected + word).length;
                    if (numTokens < maximum_tokens && !isLastItem) {
                        wordsCollected += " " + word;
                        continue;
                    }

                    textList.push(wordsCollected);
                    wordsCollected = "";
                    iteration++;
                }

                return textList;
            }

            const textList = splitCharacters(content);
            let iteration = 0;
            let result = "";
            let textCollected = "";
            const maximum_tokens = 600;

            for (let i = 0; i < textList.length; i++) {
                const text = textList[i];
                const isLastItem = i === textList.length - 1;

                const numTokens = await getNumTokens(textCollected + text);
                if (numTokens < maximum_tokens && !isLastItem) {
                    textCollected += text;
                    continue;
                }

                if (textCollected.length === 0) {
                    textCollected = text;
                }

                if (iteration > 0) {
                    const stream = await summaryRefineChain.stream({ text: textCollected, existing_answer: result });
                    for await (const chunk of stream) {
                        result += chunk;
                        if (callback) {
                            callback(chunk);
                        }
                    }

                } else {
                    const stream = await summarizationChain.stream({ text: textCollected });
                    for await (const chunk of stream) {
                        result += chunk;
                        if (callback) {
                            callback(chunk);
                        }
                    }
                }

                if (!isLastItem) {
                    const numTokensResult = await getNumTokens(result);

                    if (numTokensResult > maximum_tokens) {
                        const res = await compressContent(result);
                        result = res;
                    }
                }

                textCollected = "";
                iteration++;
            }

            resolve(result);
        });
    }
}