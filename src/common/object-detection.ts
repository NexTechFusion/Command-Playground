const TransformersApi = Function('return import("@xenova/transformers")')();

async function getPipline() {
    const { pipeline, env } = await TransformersApi;
    env.localModelPath = 'models';
    return pipeline;
}

// est. 20sec
export async function getSegmentsTransformeres(src: string) {
    const pipeline = await getPipline();
    const segmenter = await pipeline('image-segmentation', 'Xenova/detr-resnet-50-panoptic');
    let output = await segmenter(src);

    return output;
}

// est. 2sec
export async function getObjectsTransformers(src: string): Promise<TransformerObject[]> {
    const pipeline = await getPipline();
    const detector = await pipeline('object-detection', 'Xenova/detr-resnet-50');
    let output = await detector(src);

    return output;
}

export async function getUiElementsRoboflow(src: string): Promise<RoboflowResponse> {
    const fs = require("fs");
    const image = fs.readFileSync(src, {
        encoding: "base64"
    });

    const apiUrl = "https://detect.roboflow.com/ui-components-detection/2";
    const apiKey = "hz2d7T8X6TlLawI3rlYW";

    try {
        const response = await fetch(`${apiUrl}?api_key=${apiKey}`, {
            method: 'POST',
            body: image,
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            }
        });

        const result = await response.json();
        return result;
    } catch (error) {
        console.error('Error:', error);
    }
}

export interface RoboflowResponse {
    time: number;
    image: {
        width: number;
        height: number;
    };
    predictions: {
        x: number;
        y: number;
        width: number;
        height: number;
        confidence: number;
        class: string;
        class_id: number;
    }[];
}


export interface TransformerObject {
    score: number;
    label: string;
    box: {
        xmin: number;
        ymin: number;
        xmax: number;
        ymax: number;
    }
}