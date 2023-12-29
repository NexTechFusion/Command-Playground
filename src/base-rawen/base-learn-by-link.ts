import { getDocsBySimilarity } from "sdk/main";

export class BaseLearnLink {

    async call(prompt: string): Promise<string> {
        return new Promise(async (resolve, reject) => {
            try {
                const docs = await getDocsBySimilarity(prompt, 1, { tags: "links" });
                const linkDocs = docs[0]?.metadata?.file_date

                const response = await this.openai.images.generate({
                    prompt,
                    model: "dall-e-3",
                    n: 1,
                    size: "512x512"
                })
                const image_url = response.data[0].url;
                resolve(image_url);
            } catch (err) {
                reject(err);
            }
        });
    }
}

// "learn dextools.com good tool"
// extract url from  string
// {urL : "dextools.com", description: "dextools.com good tool"}