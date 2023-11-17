const key = "test";
const serverUrl = "http://localhost:3440/execute";

async function codeExec(code: string): Promise<any> {
    console.log(`Executing code: ${code}`);
    try {
        const req: ExternalCodeRequest = { code, key };
        const response = await fetch(serverUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(req),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        return data.result;
    } catch (e) {
        console.log(e);
        throw new Error(e);
    }
}

// Opens the app with the given options
export async function openApp(options?: { width?: number, height?: number, focus?: boolean, bringToFront?: boolean, prompt?: string }) {
    const code = `await openApp(${JSON.stringify(options ?? {})});`;
    await codeExec(code);
}

// Saves the text to the instance knowledge base
export async function ingestText(text: string, metadata?: any): Promise<void> {
    const code = `await ingestText(\`${text}\`, ${JSON.stringify(metadata ?? {})});`;
    await codeExec(code);
}

// TODO
async function ingestFile(path: string, metadata?: any) {
    const code = `await ingestFile(\`${path}\`, ${JSON.stringify(metadata ?? {})});`;
    await codeExec(code);
}

// Opens a new interaction
export async function newInteraction(): Promise<string> {
    const code = `return await newInteraction();`;
    const conversationId = await codeExec(code);
    return conversationId;
}

// Gets the current interaction results 
export async function getInteractionResults(): Promise<any[]> {
    const code = `return await getInteractionResults();`;
    const results = await codeExec(code);
    return results;
}

// Content for direct interaction e.g QA on a specific text
export async function addInteractionContent(text: string): Promise<void> {
    const code = `await addInteractionContent(\`${text}\`);`;
    await codeExec(code);
}

// Gets the current screen data, buffer needs to be parsed with JSON.parse
export async function getActiveDisplay(): Promise<ScreenData> {
    const code = "return await getActiveDisplay();";
    const data = await codeExec(code);
    const buffer = Buffer.from(JSON.parse(data.fileBuffer));
    return { ...data, fileBuffer: buffer } as ScreenData;
}

export async function getWindows(filtered: string): Promise<ScreenData[]> {
    const code = `return await getWindows(\`${filtered}\`);`;
    const data = await codeExec(code);
    const screens = data?.map((d: any) => ({ ...d, fileBuffer: Buffer.from(JSON.parse(d.fileBuffer)) }));
    return screens as ScreenData[];
}

// Gets the current active window data, buffer needs to be parsed with JSON.parse
export async function getActiveWindow(): Promise<ScreenData> {
    const code = "return await getActiveWindow();";
    const data = await codeExec(code);
    const buffer = Buffer.from(JSON.parse(data.fileBuffer));
    return { ...data, fileBuffer: buffer } as ScreenData;
}

// Sets the current interaction prompt
export async function setInput(text: string): Promise<void> {
    const code = `await setInput(\`${text}\`);`;
    await codeExec(code);
}

// Submits and starts the interaction
export async function submitPrompt(text?: string): Promise<void> {
    const code = `await submitPrompt(\`${text}\`);`;
    await codeExec(code);
}

export async function getKeyValues(): Promise<KeyValueSetting[]> {
    const code = `return await getKeyValues();`;
    const keyValues = await codeExec(code);
    return keyValues;
}

export async function getCommands(): Promise<CommandModel[]> {
    const code = `return await getCommands();`;
    const commands = await codeExec(code);
    return commands;
}

export async function executeCommand<T>(input: string, cmdId: string): Promise<T> {
    const code = `return await execCommand(\`${input}\`, \`${cmdId}\`);`;
    return await codeExec(code);
}

export async function addPrompt(cmd: string, taskName: string = "", sus: any[] = []): Promise<void> {
    const code = `await addInteractionPrompt(getConvoId(), \`${cmd}\`, \`${taskName}\`, ${JSON.stringify(sus)});`;
    await codeExec(code);
}

export async function updatePrompt(result: string): Promise<void> {
    const code = `await updatePrompt(\`${result}\`);`;
    await codeExec(code);
}

export async function addResult(result: string): Promise<void> {
    const code = `await addResult(\`${result}\`);`;
    await codeExec(code);
}

export async function pushResultLog(log: string): Promise<void> {
    const code = `await pushResultLog(\`${log}\`);`;
    await codeExec(code);
}

export async function pushHtml(html: string): Promise<void> {
    const code = `await pushHtml(\`${html}\`);`;
    await codeExec(code);
}

export async function pushResultStream(token: string): Promise<void> {
    const code = `pushResultStream(\`${token}\`);`;
    await codeExec(code);
}

export async function pushInlineConfirm(text: string, buttons: { text: string, action: () => void }[]): Promise<void> {
    const buttonsenc = buttons ? buttons.map(b => ({ ...b, action: b.action.toString() })) : null;
    const code = `await pushInlineConfirm(\`${text}\`, ${buttons ? JSON.stringify(buttonsenc) : null});`;
    await codeExec(code);
}

export async function startAudioRecording(): Promise<any[]> {
    const code = `return await startAudioRecording();`;
    const autidoChunks = await codeExec(code);
    return autidoChunks;
}

export async function stopAudioRecording(): Promise<void> {
    const code = `stopAudioRecording();`;
    await codeExec(code);
}

export async function getMarkedText(): Promise<string> {
    const code = `return await getMarkedText();`;
    const markedText = await codeExec(code);
    return markedText;
}

export async function getWindowText(): Promise<string> {
    const code = `return await getWindowText();`;
    const selectedText = await codeExec(code);
    return selectedText;
}

export async function getActiveWindowTitle(): Promise<string> {
    const code = `return await activeWindowTitle();`;
    const title = await codeExec(code);
    return title;
}

export async function getCursorPosition(): Promise<CursorPosition> {
    const code = `return await cursorPosition();`;
    const cursorPos = await codeExec(code);
    return cursorPos;
}

export async function moveMouseTo(x: number, y: number): Promise<void> {
    const code = `await moveMouseTo(${x}, ${y});`;
    await codeExec(code);
}

export async function mouseClickLeft(): Promise<void> {
    const code = `await mouseClick();`;
    await codeExec(code);
}

export async function pressEnter(): Promise<void> {
    const code = `await pressEnter();`;
    await codeExec(code);
}

export async function clickText(text: string): Promise<void> {
    const code = `await clickText(\`${text}\`);`;
    await codeExec(code);
}

export async function writeText(text: string): Promise<void> {
    const code = `await writeText(\`${text}\`);`;
    await codeExec(code);
}

export async function pasteText(text: string): Promise<void> {
    const code = `await pasteText(\`${text}\`);`;
    await codeExec(code);
}

// define an area by dragging the mouse
export async function markArea(): Promise<{
    fileBuffer: Buffer,
    captureRect: { x: number, y: number, width: number, height: number }
}> {
    const code = `return await markArea();`;
    const result = await codeExec(code);
    const buffer = Buffer.from(JSON.parse(result.fileBuffer));
    return { fileBuffer: buffer, captureRect: result.captureRect };
}

export async function getAreaBuffer(x: number, y: number, width: number, height: number): Promise<Buffer> {
    const code = `return await getAreaBuffer(${x}, ${y}, ${width}, ${height});`;
    const result = await codeExec(code);
    const buffer = Buffer.from(JSON.parse(result.fileBuffer));
    return buffer;
}

export async function openNewWindow(htmlOrFilePath: string, options?: BrowserWindowOptions): Promise<void> {
    const code = `await openBrowserWindow(\`${htmlOrFilePath}\`, ${JSON.stringify(options ?? {})});`;
    await codeExec(code);
}

export async function displayCursorContent(html: string): Promise<void> {
    const code = `await displayCursorContent(\`${html}\`);`;
    await codeExec(code);
}

export async function hideCursorContent(): Promise<void> {
    const code = `await hideCursorContent();`;
    await codeExec(code);
}

export async function playAudio(urlOrArrayBufferStr: string, isArrayBuffer?: boolean): Promise<void> {
    const code = `await playAudio(\`${urlOrArrayBufferStr}\`, ${isArrayBuffer});`;
    await codeExec(code);
}

export async function openCameraStreamWindow(): Promise<void> {
    const code = `await openCameraStreamWindow();`;
    await codeExec(code);
}

export interface ExternalCodeRequest {
    key: string;
    code: string;
}

export interface ScreenData {
    id: string;
    name: string;
    display_id?: string;
    fileBuffer: Buffer;
    isAppWindow?: boolean; // if its a electron browser window
    isActiveDisplay?: boolean;
}

export interface CursorPosition {
    x: number;
    y: number;
}

export interface BrowserWindowOptions {
    browserWindowOptions?: any//Electron.BrowserWindowConstructorOptions,
    position?: { x: number, y: number },
    size?: { width: number, height: number },
    bringToFront?: boolean
    focus?: boolean,
    asFile?: string,
    code: string
}
export interface LlmResultModel {
    input: string;
    result?: string;
    date: Date;
    resultDate?: Date;
    taskName?: string;
    sources?: any[];
    html?: string[];
    logs?: string[];
    inlineElements?: any[];
}

export interface CommandModel {
    id: string;
    name: string;
}
export interface KeyValueSetting {
    id: string | DefaultKeys;
    name: string;
    values: any; // { [key: string]: any };
    isDefault?: boolean;
}

export enum DefaultKeys {
    ALEPH = "ALEPH",
    OPENAI = "OPENAI"
}