import { ImageStoreModel, extractTextFromImage, getDocsBySimilarity, getImagesBySimilarity, waitUntilMarked } from "../../sdk/main";

interface MarkIamgeResponse {
    About_Element: string;
    Element_Size: { width: number; height: number; };
    Element_Position: { x: number; y: number; };
    Window_Sizes: { width: number; height: number; };
}

interface MarkCallResponse extends MarkIamgeResponse {
    image: ImageStoreModel;
}

export class BaseMarkCheckKnowledge {
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

    private parseXml(xmlString: string) {
        const regex = /<([^>]+)>([^<>]+)<\/\1>/g;
        const parsedData = {};
        let match;
        while ((match = regex.exec(xmlString)) !== null) {
            const tagName = match[1];
            let content = match[2]?.trim();

            if (["Window_Sizes", "Element_Size", "Element_Position"].includes(tagName)) {
                try {
                    content = JSON.parse(content);
                } catch (err) {
                    console.error(err);
                }
            }

            parsedData[tagName] = content;
        }
        return parsedData as MarkIamgeResponse;
    }

    async call(options?: { scanText?: boolean }): Promise<MarkCallResponse> {
        return new Promise(async (resolve, reject) => {
            try {
                const element = await waitUntilMarked();

                if (options?.scanText) {
                    const text = await extractTextFromImage(element.fileBuffer);
                }

                const result = await getImagesBySimilarity(element.fileBuffer, 1, undefined, this.defaultImageTable);

                if (!result || result.length === 0) {
                    return undefined;
                }

                const image = result[0];

                if (!image) {
                    throw new Error("Not found");
                }

                const textToImage = await getDocsBySimilarity("*", 100, {
                    where: ` id = '${image.relations[0].id}'`
                }, this.defaultTextTable);

                if (!textToImage || textToImage.length === 0) {
                    throw new Error("Not found");
                }

                const parsed = this.parseXml(textToImage[0].pageContent);

                resolve({ ...parsed, image });
            } catch (err) {
                console.error(err);
                resolve(null);
            }
        });
    }
}