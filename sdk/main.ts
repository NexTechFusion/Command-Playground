const key = "test";
const clientUrl = "http://localhost:3440/execute";
const serverUrl = "http://localhost:3400/api";

async function codeExec(code: string, retryCount = 0): Promise<any> {
    try {
        const req: ExternalCodeRequest = { code, key };
        const response = await fetch(clientUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(req)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        return data.result;
    } catch (e) {
        console.log(e);
        retryCount++;
        if (retryCount === 3) {
            throw new Error(e);
        }
        return codeExec(code, retryCount);
    }
}

async function codeExecSSR(req: {}, route = "code/exec"): Promise<any> {
    try {
        const response = await fetch(`${serverUrl}/${route}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(req)
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

interface OpenAppOptions {
    width?: number;
    height?: number;
    focus?: boolean;
    bringToFront?: boolean;
    prompt?: string;
    stickTo?: "Right" | "Left" | "TopCenter";
    x?: number;
    y?: number;
    keepInteraction?: boolean;
}

// Opens the app with the given options
export async function openApp(options?: OpenAppOptions) {
    const code = `await openApp(${JSON.stringify(options ?? {})});`;
    await codeExec(code);
}

export async function getAllDocs(): Promise<DocumentData[]> {
    const code = `return await getAllDocs();`;
    const docs = await codeExec(code);
    return docs;
}

export async function getDocsBySimilarity(text: string, topK: number = 2, options: VectorCallOptions = {}): Promise<DocumentData[]> {
    const code = `return await getDocsBySimilarity(\`${stripChars(text)}\`, ${topK}, ${JSON.stringify(options)});`;
    const docs = await codeExec(code);
    return docs;
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
export async function getInteractionState(): Promise<{
    conversationId: string,
    history: LlmResultModel[]
}> {
    const code = `return await getInteractionState();`;
    const results = await codeExec(code);
    return results;
}

// Content for direct interaction e.g QA on a specific text
export async function addInteractionContent(text: string): Promise<void> {
    const code = `await addInteractionContent(\`${text}\`);`;
    await codeExec(code);
}

// Gets the current screen data, buffer
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

// Gets the current active window data, buffer 
export async function getActiveWindow(): Promise<ScreenData> {
    const code = "return await getActiveWindow();";
    const data = await codeExec(code);

    if (!data) return null;

    const buffer = Buffer.from(JSON.parse(data.fileBuffer));
    return { ...data, fileBuffer: buffer } as ScreenData;
}

export async function getLatestWindows(): Promise<any[]> {
    const code = "return await getLatestWindows();";
    const data = await codeExec(code);;
    return data;
}

export async function openLastWindow(click = false): Promise<void> {
    const code = `await openLastWindow(${click});`;
    await codeExec(code);
}

export async function openWindow(id, click = false): Promise<void> {
    const code = `await openWindow(${id},${click});`;
    await codeExec(code);
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

export async function getOpenAiSettings(): Promise<OpenAiKeyValueSetting> {
    const settings = await getKeyValues();
    const openAiSettings = settings.find(s => s.id === DefaultKeys.OPENAI);
    return openAiSettings;
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

export async function addPrompt(html: string): Promise<void> {
    const code = `addPrompt(\`${encodeContent(html)}\`, true);`;
    await codeExec(code);
}

export async function updatePrompt(html: string): Promise<void> {
    const code = `updatePrompt(\`${encodeContent(html)}\`, true);`;
    await codeExec(code);
}

export async function addResult(result: string): Promise<void> {
    const code = `addResult(\`${encodeContent(result)}\`, null, true);`;
    await codeExec(code);
}

export async function pushLog(log: string): Promise<void> {
    const code = `pushLog(\`${encodeContent(log)}\`, true);`;
    await codeExec(code);
}

export async function pushContentStream(token: string): Promise<void> {
    const code = `pushContentStream(\`${encodeContent(token)}\`);`;
    await codeExec(code);
}

export async function stopStream(): Promise<void> {
    const code = `endStream();`;
    await codeExec(code);
}

export async function startStream(): Promise<void> {
    const code = `await startStream();`;
    await codeExec(code);
}

export async function waitForConfirm(text: string, buttons: { text: string, classes?: string }[]): Promise<number> {
    const code = `return await waitForConfirm(\`${stripChars(text)}\`, ${JSON.stringify(buttons)});`;
    return await codeExec(code);
}

export async function waitForInput(): Promise<string> {
    const code = `return await waitForInput();`;
    return await codeExec(code);
}

// VAD and stops the audio recording if a voice ended
export async function startAudioRecording(): Promise<Buffer | null> {
    const code = `return await startAudioRecording();`;
    const bufferStr = await codeExec(code);
    return bufferStr ? Buffer.from(JSON.parse(bufferStr)) : null;
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

export async function moveMouseToImage(srcOrBase64: string): Promise<void> {
    const code = `await moveMouseToImage(\`${srcOrBase64}\`);`;
    await codeExec(code);
}

export async function clickImage(srcOrBase64: string): Promise<void> {
    const code = `await clickImage(\`${srcOrBase64}\`);`;
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

// mark areas on the screen
export async function markAreas(areas: Area[]) {
    const code = `await markAreas(${JSON.stringify(areas)});`;
    await codeExec(code);
}

export async function clearAreas() {
    const code = `await clearAreas();`;
    await codeExec(code);
}

// define an area by dragging the mouse
export async function waitUntilMarked(): Promise<{
    fileBuffer: Buffer,
    captureRect: { x: number, y: number, width: number, height: number }
}> {
    const code = `return await waitUntilMarked();`;
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

export async function displayContentAtPositions(contents: ContentPosition[], options = {
    clickable: false,
    additionalCss: ""
    // function: () => { } // will be exec on start
}): Promise<void> {
    const contentStr = encodeContent(contents);
    const optionsStr = encodeContent(options);
    const code = `await displayContentAtPositions(\`${(contentStr)}\`, \`${optionsStr}\`);`;
    await codeExec(code);
}

export async function clearContentAtPositions(): Promise<void> {
    const code = `await clearContentAtPositions();`;
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

export async function extractWebsiteContent(url: string, maxDepth: number = 1): Promise<{ url: string, content: string }[]> {
    const code = `return await extractWebsiteContent(\`${url}\`, ${maxDepth}, true);`;
    const contents = await codeExecSSR({ code });
    return JSON.parse(contents);
}

export async function extractYoutubeContent(url: string): Promise<TranscriptResponse[]> {
    const code = `return await extractYoutubeContent(\`${url}\`, true);`;
    const contents = await codeExec(code);
    return JSON.parse(contents);
}

export async function webResearch(query: string): Promise<{ url: string, content: string, title: string }[]> {
    const code = `return await webResearch(\`${query}\`, true);`;
    const contents = await codeExecSSR({ code });
    return contents ? JSON.parse(contents) : [];
}

export async function getEmbedding(texts: string[], model?: string): Promise<any> {
    const contents = await codeExecSSR({ texts, model }, "vector/embedding");
    return contents;
}

function encodeContent(content: any): string {
    if (!content) {
        return "";
    }

    if (typeof content !== "string") {
        content = JSON.stringify(content);
    }

    return encodeURI(content);
}

// TODO encode properly
function stripChars(text): string {
    if (!text) {
        return "";
    }

    if (typeof text !== "string") {
        text = text.toString();
    }

    return text.replace(/`/g, '\\`')
}

export interface TranscriptResponse {
    text: string;
    duration: number;
    offset: number;
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
    code?: string
}
export interface LlmResultModel {
    header?: string;
    content?: string;
    date: Date;
    sources?: DocumentData[];
    logs?: string[];
    confirmElements?: { text: string, classes?: string }[];
}

export interface CommandModel {
    id: string;
    name: string;
    isTool?: boolean;
    description?: string;
}
export interface KeyValueSetting {
    id: string | DefaultKeys;
    name: string;
    values: any; // { [key: string]: any };
    isDefault?: boolean;
}

export interface OpenAiKeyValueSetting extends KeyValueSetting {
    values: OpenAiValues;
}

export interface OpenAiValues {
    ApiKey: string | undefined,
    Model: string | undefined
}

export enum DefaultKeys {
    ALEPH = "ALEPH",
    OPENAI = "OPENAI"
}

export interface DocumentData {
    pageContent: string;
    metadata: DocumentMetaData;
}

export interface DocumentMetaData {
    id: string;
    date: string;
    tags: string;
    file_path: string;
    file_total_pages: number;
    file_page_number: number;
    file_page_lines_from: number;
    file_page_lines_to: number;
    keywords: string;
}

export interface Area {
    startX: number;
    startY: number;
    width: number;
    height: number;
    classes?: string;
    label?: string;
    labelClasses?: string;
}

export interface ContentPosition {
    x: number;
    y: number;
    html: string;
    width?: number;
    height?: number;
}

export interface VectorCallOptions {
    tags?: string;
}