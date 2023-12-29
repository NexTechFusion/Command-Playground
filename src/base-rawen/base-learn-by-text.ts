export class BaseOpener {
    private openai: OpenAI;

    constructor(apiKey: string) {
        this.openai = new OpenAI({
            apiKey
        });
    }

    async call(prompt: string): Promise<string> {
        return new Promise(async (resolve, reject) => {
            try {
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