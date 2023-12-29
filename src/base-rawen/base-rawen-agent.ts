import { RunnableSequence } from "langchain/schema/runnable";
import { PromptTemplate } from "langchain/prompts";
import { StringOutputParser } from "langchain/schema/output_parser";
import { BaseSummarize2 } from "./base-summarize-2";
import { BaseLLM } from "langchain/llms/base";
import { BaseAnswer } from "./base-answer";
import { BaseWebsearch } from "./base-websearch";
import { BaseKnowledgeQA } from "./base-knowledge-qa";
import { Embeddings } from "langchain/embeddings/base";
import { RemoveEmbeddings } from "../common/remote-embedding";
const customOutputParser = (msg): any => msg;
const customPromptOutputParser = (prompt): any => ({ prompt });

const tools = [
    { id: "dwopke", description: "Answer directly if you as an AI know with confident the right answer" }, // a
    { id: "lsrdfjk", description: "Searches the Web to find the answer" }, //c
    { id: "ertfg546", description: "Searches the system knowledge base, useful for specific knowledge" }, // d
];

const toolSelctorPrompt = `You are a tool selector AI. 
Select the correct tool to the **Query**. 
Reply with the tool A-Z like this : 'Selecting : - <${tools[0].id}>' or 'Selecting : <${tools[2].id}>' or 'Selecting : <${tools[1].id}>' and in one sentence why.
Your Tools: 
${tools.map((option) => `<${option.id}>  : ${option.description}`).join("\n")}

<Query>
    {prompt}
</Query>
`;


export interface Tool {
    id: number;
    description: string;
}

export class BaseAgent {
    private llm: BaseLLM;
    private embeddings: Embeddings;

    constructor(llm: BaseLLM, embeddings: Embeddings = new RemoveEmbeddings()) {
        this.llm = llm;
        this.embeddings = embeddings;
    }

    async call(prompt: string, callback?: (prompt: string) => void, callbackLog?: (prompt: string) => void) {
        return new Promise(async (resolve, reject) => {
            const summarizeChain = RunnableSequence.from([
                {
                    content: async (req: { prompt: string; topic: string }) => {
                        const content = await new BaseSummarize2(this.llm).call(req.prompt);
                        callback(content);
                        return content;
                    }
                },
                new StringOutputParser()
            ]);

            const answerChain = RunnableSequence.from([
                {
                    content: async (req: { prompt: string; topic: string }) => {
                        const content = await new BaseAnswer(this.llm).call(req.prompt, callback);
                        return content;
                    }
                },
                new StringOutputParser()
            ]);

            const websearchChain = RunnableSequence.from([
                {
                    content: async (req: { prompt: string; topic: string }) => {
                        const content = await new BaseWebsearch(this.llm, this.embeddings).call(req.prompt, callbackLog);
                        callback(content);
                        return content;
                    }
                },
                new StringOutputParser()
            ]);

            const knowledgeChain = RunnableSequence.from([
                {
                    content: async (req: { prompt: string; topic: string }) => {
                        const content = await new BaseKnowledgeQA(this.llm, this.embeddings).call(req.prompt, callback);
                        return content;
                    }
                },
                new StringOutputParser()
            ]);

            const toolSelectorChain = RunnableSequence.from([
                PromptTemplate.fromTemplate(toolSelctorPrompt),
                this.llm,
                customOutputParser
            ]);

            const route = ({ topic }: { prompt: string; topic: string }) => {

                if (topic.toLowerCase().includes(tools[0].id)) {
                    return answerChain;
                }

                if (topic.toLowerCase().includes(tools[1].id)) {
                    return websearchChain;
                }

                if (topic.toLowerCase().includes(tools[2].id)) {
                    return knowledgeChain;
                }

                return "I don't know"
            };

            const fullChain = RunnableSequence.from([
                {
                    topic: toolSelectorChain,
                    prompt: (input: { prompt: string }) => input.prompt,
                },
                route
            ]);

            const result = await fullChain.invoke({
                prompt
            });

            resolve(result);
        });
    }
}
