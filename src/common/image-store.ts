import * as fs from "node:fs/promises";
import { initTransformers, AutoProcessor, CLIPVisionModelWithProjection, RawImage } from "./transformerjs-wrapper";
import { retrive, setEmbeddingFn, update } from "./lancedb-util";
import { MetricType } from "vectordb";
let processor;
let vision_model;
let loaded = false;
const table = "images";
const sourceColumn = "image";
const imgPath = `${process.cwd()}/img`;
const model_id = 'Xenova/clip-vit-base-patch16';

export async function ingestImages(imgs: Array<{
    src: string | Buffer,
    metaData?: Record<string, unknown>
}>) {
    await ensureLoaded();

    const data = [];
    for (const img of imgs) {
        const srcOrBuffer = img.src;
        let image = srcOrBuffer;
        if (typeof srcOrBuffer !== "string") {
            let saveToName = Math.random().toString(36).substring(7) + ".png";
            await fs.writeFile(saveToName, srcOrBuffer);
            image = `${imgPath}/${saveToName}`;
        }

        //check if file exists
        await fs.access(image);

        data.push({
            id: image,
            image,
            date: new Date().toISOString(),
            ...img.metaData
        });
    }

    await update({
        data,
        table
    });
}

export interface ImageStoreModel {
    id: number;
    image: string;
    date: string;
    [key: string]: any;
    distance?: number;
}

export async function retriveImages(srcOrBuffer: string | any, limit = 10, maxDistance = 0.1) {
    await ensureLoaded();
    let isBuffer = false;

    if (typeof srcOrBuffer !== "string") {
        isBuffer = true;
        const tmpFileName = Math.random().toString(36).substring(7) + ".png";
        await fs.writeFile(tmpFileName, srcOrBuffer);
        srcOrBuffer = `${process.cwd()}/${tmpFileName}`;
    }

    const result: any = await retrive({
        query: srcOrBuffer,
        table,
        limit,
        metricType: MetricType.Cosine
    });

    if (isBuffer) {
        await fs.unlink(srcOrBuffer);
    }

    const filterdByScore = result.sort(
        (a, b) => a._distance - b._distance
    ).filter(o => o._distance < maxDistance);

    return filterdByScore.map(o => ({
        ...o,
        distance: o._distance,
    })) as ImageStoreModel[];
}

const ensureLoaded = async () => {
    if (loaded) return;
    console.log("Loading model...");
    await initTransformers();
    processor = await AutoProcessor.from_pretrained(model_id);
    vision_model = await CLIPVisionModelWithProjection.from_pretrained(model_id, {
        quantized: false,
    });

    setEmbeddingFn(embed_fn);

    loaded = true;
}

async function getImgEmbedding(imgPath: string) {
    await ensureLoaded();
    const image = await RawImage.read(imgPath);
    let image_inputs = await processor(image);
    const { image_embeds } = await vision_model(image_inputs);
    const embed_as_list = image_embeds.tolist()[0];
    return embed_as_list;
}

const embed_fn = {
    sourceColumn,
    embed: async function (batch) {
        let result = []
        for (let src of batch) {
            const res = await getImgEmbedding(src)
            result.push(res)
        }
        return (result)
    }
}
