import { BaseChatModel } from "langchain/chat_models/base";
import { ChatPromptTemplate, MessagesPlaceholder } from "langchain/prompts";
import { HumanMessage } from "langchain/schema";
import { StringOutputParser } from "langchain/schema/output_parser";

export class BaseVision {
    private llm: BaseChatModel;

    constructor(llm: BaseChatModel) {
        this.llm = llm;
    }

    async call(imageSrcOrBuffer: string | Buffer, question?: string, callback?: (prompt: string) => void): Promise<string> {
        return new Promise(async (resolve, reject) => {
            try {
                if (!Buffer.isBuffer(imageSrcOrBuffer)) {
                    const response = await fetch(imageSrcOrBuffer);
                    const arrayBuffer = await response.arrayBuffer();
                    imageSrcOrBuffer = Buffer.from(arrayBuffer);
                }

                if (!imageSrcOrBuffer.toString().startsWith("data:image")) {
                    imageSrcOrBuffer = `data:image/png;base64,${imageSrcOrBuffer.toString("base64")}`
                }

                const prompt = ChatPromptTemplate.fromMessages([
                    new MessagesPlaceholder("input")
                ]);

                const chain = prompt.pipe(this.llm).pipe(new StringOutputParser());
                const stream = await chain.stream({
                    input: [
                        new HumanMessage({
                            content: [
                                {
                                    type: "text",
                                    text: question ?? "What's in this image?",
                                },
                                {
                                    type: "image_url",
                                    image_url: { url: imageSrcOrBuffer as string }
                                }
                            ],
                        }),
                    ],
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