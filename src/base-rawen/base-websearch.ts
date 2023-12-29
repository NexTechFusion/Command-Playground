import { RetrievalQAChain, loadQARefineChain } from "langchain/chains";
import { BaseLLM } from "langchain/llms/base";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { Embeddings } from "langchain/embeddings/base";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { webResearch } from "../../sdk/main";
import { RemoveEmbeddings } from "../common/remote-embedding";

export class BaseWebsearch {
    private llm: any;
    private embeddings: Embeddings;

    constructor(llm: BaseLLM, embeddings: Embeddings = new RemoveEmbeddings()) {
        this.llm = llm;
        this.embeddings = embeddings;
    }

    async call(prompt: string, callback?: (prompt: string) => void): Promise<string> {
        return new Promise(async (resolve, reject) => {
            try {
                const res = await webResearch(prompt);

                if (callback) {
                    callback("Looking at these websites : \n\n" + res.map((item) => item.url).join("\n\n"));
                }

                if (res.length === 0) {
                    resolve("No results found");
                    return;
                }

                const textSplitter = new RecursiveCharacterTextSplitter({ chunkSize: 600 });
                const docs = await textSplitter.createDocuments(res.map((item) => item.content));
                const vectorStore = await MemoryVectorStore.fromDocuments(docs, this.embeddings);
                const vectorStoreRetriever = vectorStore.asRetriever(2);

                const chain = new RetrievalQAChain({
                    combineDocumentsChain: loadQARefineChain(this.llm),
                    retriever: vectorStoreRetriever,
                    returnSourceDocuments: true
                });

                const response = await chain.call({ query: prompt });

                let result = response.output_text?.trimStart() || "No results found";

                // attaching links as md
                if (result !== "No results found") {
                    result += "\n\n ### Links: \n\n" + res.map((item) => `[${item.title}](${item.url})`).join("\n\n");
                }

                resolve(result);
            } catch (err) {
                reject(err);
            }
        });
    }
}
