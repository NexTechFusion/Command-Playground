import { LLMChain, RefineDocumentsChain, RetrievalQAChain, loadQARefineChain } from "langchain/chains";
import { BaseLLM } from "langchain/llms/base";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { Embeddings } from "langchain/embeddings/base";
import { getDocsBySimilarity, webResearch } from "../../sdk/main";
import { RemoveEmbeddings } from "../common/remote-embedding";
import { PromptTemplate } from "langchain/prompts";
const questionPromptTemplateStringRag = `Context information is below.
---------------------
{context}
---------------------
Given the context information and no prior knowledge, answer the question: {question}`;
const ANSWER_INDICATOR = "OA";
const DEFAULT_REFINE_PROMPT_TMPL = `The original question is as follows: {question}
We have provided an existing answer: {existing_answer}
We have the opportunity to refine the existing answer
(only if needed) with some more context below.
------------
{context}
------------
Given the new context, refine the existing answer to better answer the question or 
If the context isn't useful for refining the answer, return the existing answer but with a prefix "${ANSWER_INDICATOR} \n\n".
`;
const refinePromptTmpl = new PromptTemplate({
    inputVariables: ["question", "existing_answer", "context"],
    template: DEFAULT_REFINE_PROMPT_TMPL,
});

export class BaseKnowledgeQA {
    private llm: any;
    private embeddings: Embeddings;
    private abortController = new AbortController(); // TODO

    constructor(llm: BaseLLM, embeddings: Embeddings = new RemoveEmbeddings()) {
        this.llm = llm;
        this.embeddings = embeddings;
    }

    async call(query: string, callback?: (prompt: string) => void): Promise<string> {
        return new Promise(async (resolve, reject) => {
            try {
                const docs = await getDocsBySimilarity(query, 3);

                if (docs.length === 0) {
                    resolve("No knowledge found");
                    return;
                }

                const vectorStore = await MemoryVectorStore.fromDocuments(docs as any, this.embeddings);
                const vectorStoreRetriever = vectorStore.asRetriever();
                const questionPromptTmpl = new PromptTemplate({
                    inputVariables: ["context", "question"],
                    template: questionPromptTemplateStringRag,
                });

                const combineDocumentsChain = new RefineDocumentsChain({
                    llmChain: new LLMChain({ prompt: questionPromptTmpl, llm: this.llm }),
                    refineLLMChain: new LLMChain({ prompt: refinePromptTmpl, llm: this.llm })
                });

                const chain = new RetrievalQAChain({
                    combineDocumentsChain,
                    retriever: vectorStoreRetriever,
                    returnSourceDocuments: true,
                });

                let hasAnswer = false;
                let stopCallback = false;
                let collectedText = "";
                let sourceDocuments: any[] = [];
                let response = await chain.call({ query, signal: this.abortController.signal }, {
                    callbacks: [
                        {
                            handleRetrieverEnd(documents: any) {
                                sourceDocuments.push(...documents);
                            },
                            handleLLMStart() {
                                if (hasAnswer) {
                                    stopCallback = true;
                                    if (this.abortController) {
                                        this.abortController.abort("Answer found");
                                    }
                                    return;
                                }
                                hasAnswer = docs.length === 1;
                                collectedText = "";
                            },
                            handleLLMNewToken(token: string) {
                                if (stopCallback) {
                                    return;
                                }

                                if (hasAnswer) {
                                    collectedText += token;
                                    callback(token.replace(ANSWER_INDICATOR, ""));
                                } else {
                                    collectedText += token;
                                    if (collectedText.includes(ANSWER_INDICATOR)) {
                                        collectedText = collectedText.replace(ANSWER_INDICATOR, "");
                                        hasAnswer = true;
                                    }
                                }
                            },
                        },
                    ],
                });
                response.output_text = response.output_text.replace(ANSWER_INDICATOR, "");

                resolve(response.output_text?.trimStart());
            } catch (err) {
                reject(err);
            }
        });
    }
}
