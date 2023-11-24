import { ConversationChain } from "langchain/chains";
import { ChatOpenAI } from "langchain/chat_models/openai";
import { BufferMemory } from "langchain/memory";
import { ChatPromptTemplate, MessagesPlaceholder } from "langchain/prompts";
import { SystemMessage } from "langchain/schema";
import { openApp } from "sdk/main";
const llm = new ChatOpenAI({ temperature: 0.3 });

const conversationList = [
    new SystemMessage("A friendly chat with Liam Neeson and Donald Trump. You are {user}."),
    new MessagesPlaceholder("history")
];




async function main() {
    await openApp({
        stickTo: "Right"
    });

    recurringTalk("test");
}

function recurringTalk(userName: string) {
    const instructorTmpl = ChatPromptTemplate.fromMessages([
        ...conversationList,
        [userName, "{input}"],
    ]);

    const chain = new ConversationChain({
        memory: new BufferMemory({ returnMessages: true, memoryKey: "history" }),
        prompt: instructorTmpl,
        llm,
    });

    // const response = await chain.call({
    //     input: imageDescription
    // });

    // conversationList.push(new SystemMessage(imageDescription));
    // conversationList.push(new AIMessage(response.response));

}

main();
