import { addPrompt, getWindows, openCameraStreamWindow, playAudio, pushContentStream } from "../sdk/main";
import { text2speech } from "./common/coqui_text-to-speech-api";
import { ChatOpenAI } from "langchain/chat_models/openai";
import { AIMessage, HumanMessage, SystemMessage } from "langchain/schema";
import { ChatPromptTemplate, MessagesPlaceholder } from "langchain/prompts";
import { StringOutputParser } from "langchain/schema/output_parser";
import { BufferMemory } from "langchain/memory";
import { ConversationChain } from "langchain/chains";
import OpenAI from "openai";
const COQUI_KEY = "COQUI_KEY";
const openai = new OpenAI();
const voice_id_liam = "COQUI_KEY_LIAM";

const PROMPT_RESPONDER = `
    Act like liam nesson playing a role as a strict drill instructor and motivational fitness trainer, you checking out your student at his exercise.
    Sometimes you shout at him, sometimes you motivate him, for example : "ARE YOU KIDDING ME? DO IT AGAIN!" or "COME ON, YOU CAN DO IT OR ILL FIND YOU!"
    Keep it short in 1-2 sentences.
    Don't repeat yourself.
`;
const conversationList = [
    new SystemMessage(PROMPT_RESPONDER),
    new MessagesPlaceholder("history")
];


const PROMPT_ANALYZER = `
The image shows a person doing an exercise, guess the exercise.

Check out what you see in the image and response in SHORT with this details : 
- Exercise : Name of the exercise
- Position : What is the position of the person
- Arm positions : What is the position of the arms (SHORT DESCRIPTION)
- Leg positions : What is the position of the legs (SHORT DESCRIPTION)
-----------------
If there is no exercise in the image, response in 1 sentence what he is doing instead.
`;
async function main() {
    await openCameraStreamWindow();
    await new Promise(r => setTimeout(r, 1000));
    startInstructor();
}

let interation = 0;
async function startInstructor() {
    await addPrompt("Workout iteration - " + interation);
    const cameraScreen = await recurringUntilVideoStarted();
    const imageBase64 = `data:image/png;base64,${cameraScreen.fileBuffer.toString("base64")}`;

    await pushContentStream("<img style='width:\"100%\"' src='" + imageBase64 + "' /> <br>");
    const imageDescription = await image2textOpenAi(imageBase64);
    await pushContentStream(imageDescription + "<br><br>");

    const instructorResponse = await instructor(imageDescription);
    await pushContentStream(instructorResponse.response + "<br><br>");
    speakOpenAi(instructorResponse.response);
    // await speakCoqui(instructorResponse.response);

    interation++;
    startInstructor();
}

async function instructor(imageDescription: string) {
    const llm = new ChatOpenAI({ temperature: 0.3 });
    const instructorTmpl = ChatPromptTemplate.fromMessages([
        ...conversationList,
        ["system", "{input}"],
    ]);

    const chain = new ConversationChain({
        memory: new BufferMemory({ returnMessages: true, memoryKey: "history" }),
        prompt: instructorTmpl,
        llm,
    });

    const response = await chain.call({
        input: imageDescription
    });

    conversationList.push(new SystemMessage(imageDescription));
    conversationList.push(new AIMessage(response.response));

    return response;
}

async function image2textOpenAi(imageBase64: string): Promise<string> {
    console.time("image2textOpenAi");
    const chat = new ChatOpenAI({
        modelName: "gpt-4-vision-preview",
        maxTokens: 3400,
        cache: false
    });
    const prompt = ChatPromptTemplate.fromMessages([
        new SystemMessage(PROMPT_ANALYZER),
        new MessagesPlaceholder("input"),
    ]);
    const chain = prompt.pipe(chat).pipe(new StringOutputParser());
    const result = await chain.invoke({
        input: [
            new HumanMessage({
                content: [{
                    type: "image_url",
                    image_url: imageBase64
                }],
            }),
        ],
    });
    console.timeEnd("image2textOpenAi");
    return result;
}


async function speakCoqui(text: string) {
    const result = await text2speech(text, {
        voice_id: voice_id_liam,
        apiKey: COQUI_KEY,
        speed: 1,
        language: "de"
    });

    await playAudio(result.audio_url);
}

async function speakOpenAi(text: string) {
    console.time("speakOpenAi");
    const mp3 = await openai.audio.speech.create({
        model: "tts-1",
        voice: "onyx",
        input: text,
        speed: 1.2
    });
    const buffer = Buffer.from(await mp3.arrayBuffer());
    playAudio(JSON.stringify(buffer), true);
    console.timeEnd("speakOpenAi");
}

async function recurringUntilVideoStarted() {
    const screens = await getWindows('Camera Stream');
    if (screens == null || screens?.length === 0) {
        return recurringUntilVideoStarted();
    }

    const cameraScreen = screens[0];
    if (cameraScreen && cameraScreen.fileBuffer.length > 0) {
        return cameraScreen;
    }

    await new Promise(r => setTimeout(r, 1000));
    return recurringUntilVideoStarted();
}

main();
