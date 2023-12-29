import { ChildProcessWithoutNullStreams, spawn } from "child_process";
import { addPrompt, openApp, pushContentStream, endStream, waitForInput } from "../sdk/main";
import { PromiseQueue } from "./common/queue.utils";
const queue = new PromiseQueue(100); // take it easy 
let pythonProcess: ChildProcessWithoutNullStreams;
let stopTimeout: NodeJS.Timeout;
const py_path = './src/open-interpreter.py';

const api_key = "YOUR API KEY"; // would come over settings, for demonstration purposes as variable
const question = "What operating system are we on?"; // coming from app prompt, for demonstration purposes as variable

async function main() {
    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for 2 seconds
    await openApp({
        stickTo: "Right",
        width: 400,
    });
    await addPrompt("Open-Interpreter :" + question);
    pythonProcess = spawn('python', [py_path, api_key, `"${question}"`], {
        shell: true
    });

    pythonProcess.stdout.on('data', async (data) => {
        const newMsg = cleanString(data.toString());
        debounce(pushContentStream, newMsg);
        resetStopTimeout(newMsg);
    });

    pythonProcess.stderr.on('data', async (data) => {
        const newMsg = cleanString(data.toString());
        debounce(pushContentStream, newMsg);
    });
}

function resetStopTimeout(msg) {
    if (stopTimeout) {
        clearTimeout(stopTimeout);
    }
    stopTimeout = setTimeout(() => {
        stop(msg);
    }, 10000);
}

function cleanString(str) {
    str = str.replace(/\+-+\+>/g, "");
    str = str.replace(/\+-+\+/g, "");
    str = str.replace(/\+-+\+/g, "");
    str = str.replace(/^\s*\|/, "");
    str = str.replace(/\|\s*$/, "<br>");
    str = str.replace(/\|/g, "."); // replace | with .

    return str.trim();
}

async function proceedWithInput() {
    const input = await waitForInput();
    await addPrompt(`> ${input}`);
    pythonProcess.stdin.write(input + '\n');
}

async function stop(msg) {
    debounce(endStream);

    // lazy check better prompt via stop Sequence
    if (msg.includes("?")) {
        await new Promise(resolve => setTimeout(resolve, 5000)); // Wait for 5 seconds
        debounce(proceedWithInput);
    }
}

function debounce(func: any, args?: any) {
    queue.add(func, args);
}

main();