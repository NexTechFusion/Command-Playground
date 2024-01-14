import { clearAreas, clearContentAtPositions, displayContentAtPositions, extractTextFromImage, getActiveWindow, ingestImages, ingestText, markAreas, openApp, restoreApp, toBase64, updatePrompt, waitForInput, waitUntilMarked } from "../../sdk/main";

interface MarkOptions {
    scanText?: boolean;
}

export class BaseMarkLearn {
    private defaultImageTable = "images";
    private defaultTextTable = "global";

    constructor(imageTable?: string, textTable?: string) {
        if (imageTable) {
            this.defaultImageTable = imageTable;
        }
        if (textTable) {
            this.defaultTextTable = textTable;
        }
    }

    async learn(options?: MarkOptions): Promise<{ explain: string, imgSrc: string }> {
        return new Promise(async (resolve, reject) => {
            try {
                // ==== Mark ====
                const element = await waitUntilMarked();
                const window = await getActiveWindow();
                await markAreas([{
                    ...element.captureRect,
                    label: "Tell me a bit about this marked element",
                    labelClasses: "p-2 bg-white rounded-md shadow-md text-base",
                }]);

                await openApp({
                    keepInteraction: true,
                    bringToFront: true,
                    focus: true,
                    height: 79,
                    onCursor: true,
                    width: 400,
                });

                const explain = await waitForInput();
                await restoreApp();

                let text = null;
                if (options?.scanText) {
                    text = await extractTextFromImage(element.fileBuffer);
                }

                // ==== Ingest ====
                const imageGuid = "Element_Descrption_" + Math.random().toString(36).substring(7);
                const textGuid = "Element_Descrption_" + Math.random().toString(36).substring(7);
                const imageBase64 = toBase64(element.fileBuffer);

                const paths = await ingestImages([imageBase64], {
                    id: imageGuid,
                    relations: [{ id: textGuid, table: this.defaultTextTable }],
                }, this.defaultImageTable);

                await ingestText(this.buildText(explain, element.captureRect, { width: window.bounds.width, height: window.bounds.height }, text), {
                    id: textGuid,
                    relations: [{ id: imageGuid, table: this.defaultImageTable }],
                    file_path: paths[0],
                    tags: "image",
                    keywords: window.name
                }, this.defaultTextTable);

                await displayContentAtPositions([{
                    ...element.captureRect,
                    width: 120,
                    html: `
                    <div class="p-2 rounded-md bg-white shadow-md flex animate-bounce text-green-light">
                    <i class="text-lg" data-feather="check"></i>
                    <span class="text-lg ml-2">Learned!</span>
                    </div>
                    `
                }]);

                await new Promise((resolve) => setTimeout(resolve, 3000));
                await clearAreas();
                await clearContentAtPositions();

                resolve({
                    imgSrc: paths[0],
                    explain
                });

            } catch (err) {
                console.error(err);
                reject(err);
            }
        });
    }

    private buildText(eplxaination: string, rect: { x: number; y: number; width: number; height: number; }, window: { width: number; height: number; }, elementText?: string,) {
        return `<About_Element>
            ${eplxaination}
        </About_Element>
        ${elementText ? `<Element_Text>${elementText}</Element_Text>` : ""}
        </Element_Size>{ "width":${rect.width}, "height":${rect.height} } </Element_Size>
        <Element_Position>{ "x":${rect.x}, "y":${rect.y} } </Element_Position> 
        <Window_Sizes>{ "width":${window.width}, "height":${window.height} } </Window_Sizes>`.trim();
    }
}