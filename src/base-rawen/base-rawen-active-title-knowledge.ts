import { getActiveWindowTitle, getDocsBySimilarity } from "../../sdk/main";

interface MarkIamgeResponse {
    About_Element: string;
    Element_Size: { width: number; height: number; };
    Element_Position: { x: number; y: number; };
    Window_Sizes: { width: number; height: number; };
}

export class BaseActiveFromKnowledge {
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

    async call(): Promise<MarkIamgeResponse[]> {
        return new Promise(async (resolve, reject) => {
            try {
                const title = await getActiveWindowTitle();
                const res = await getDocsBySimilarity("*", 1000, {
                    where: `keywords LIKE '%${title}%'`
                }, this.defaultTextTable);

                const parsedData = res.map((r) => this.parseXml(r.pageContent));
                resolve(parsedData);
            } catch (err) {
                console.error(err);
                resolve(null);
            }
        });
    }
}