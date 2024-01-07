import { displayContentAtPositions, waitUntilMarked } from "../sdk/main";
import { refaceImage } from "./common/stability-ai";

export async function main() {
    const element = await waitUntilMarked();

    await displayContentAtPositions([{
        x: element.captureRect.x,
        y: element.captureRect.y,
        width: element.captureRect.width,
        height: element.captureRect.height,
        html: `<img style="width:100%;filter:blur(7px)" src="data:image/png;base64,${element.fileBuffer.toString("base64")}" />`
    }]);

    const newImg = await refaceImage(element.fileBuffer, element.captureRect.width, element.captureRect.height);
    const x = element.captureRect.x;
    const y = element.captureRect.y;
    const width = element.captureRect.width;
    const height = element.captureRect.height;

    await displayContentAtPositions([{
        x,
        y,
        width,
        height,
        html: `<img style="width:100%" src="${newImg}" />`
    }]);
}