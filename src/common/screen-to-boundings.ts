import vision from "@google-cloud/vision";
import * as Tesseract from 'tesseract.js';

export async function getBoundsGoogle(buffer: Buffer) {
    try {
        const client = new vision.ImageAnnotatorClient({
            keyFilename: "google-key.json"
        })
        const [result] = await client.textDetection(buffer);
        const texts = result.textAnnotations;
        return texts.map(o => ({
            text: o.description,
            boundingBox: {
                x0: o.boundingPoly.vertices[0].x,
                y0: o.boundingPoly.vertices[1].y,
                x1: o.boundingPoly.vertices[1].x,
                y1: o.boundingPoly.vertices[2].y
            }
        }))
    } catch (e) {
        console.log(e);
    }
}

export async function getBoundsTessaract(screenshotBuffer: Buffer) {
    const result = await Tesseract.recognize(
        screenshotBuffer,
        'eng'
    );

    let labelPositions: any[] = [];
    console.log(result.data);
    result.data.words.forEach(word => {
        let position = {
            text: word.text,
            boundingBox: {
                x0: word.bbox.x0,
                y0: word.bbox.y0,
                x1: word.bbox.x1,
                y1: word.bbox.y1
            }
        };
        labelPositions.push(position);
    });

    return labelPositions;
}