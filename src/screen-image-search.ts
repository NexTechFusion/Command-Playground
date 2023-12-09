import sharp = require("sharp");
import { clearAreas, clearContentAtPositions, getActiveWindow, markAreas } from "../sdk/main";
import { getObjectsTransformers } from "./common/object-detection";
import * as fs from "fs";
import { windowManager } from "node-window-manager";
import { ingestImages, retriveImages } from "./common/image-store";
import { boardySays } from "./common/boardy.util";

const display = windowManager.getPrimaryMonitor();

async function main() {
    await ingestImages([{
        src: "./imgs/elon_no_hairs.png",
        metaData: {
            text: "Elon Musk as a young dude with no hairs"
        }
    }]);

    await boardySays("Okay, I will now monitor your PC until I find something within my knowledge.", 1500, 500);
    setTimeout(() => {
        clearContentAtPositions();
    }, 5000);

    scan();
}

async function scan() {
    console.log("scanning...");

    const bounds = getRealBounds();
    const activeWinFileBuffer = await getCalculatedActiveWinowBuffer(bounds);
    if (!activeWinFileBuffer) { scan(); return };

    const objects = await getDetectedObjects();

    for (const object of objects) {
        try {
            const partBuffer = await getPartOfImage(activeWinFileBuffer, object.startX, object.startY, object.width, object.height);
            const res = await retriveImages(partBuffer, 1);
            if (res.length > 0) {
                const match = res[0];
                await boardySays("Found at my knowledge : " + match.text, object.startX + object.width, object.startY);
                await markAreas([object]);
                return;
            }
        } catch (e) {
            console.log("ERROR", e);
        }
    }

    scan();
}

function getRealBounds() {
    const window = windowManager.getActiveWindow();
    const bounds = window.getBounds();
    const display = windowManager.getPrimaryMonitor();
    const scaleFactor = display.getScaleFactor();
    const realBounds = {
        x: bounds.x * scaleFactor,
        y: bounds.y * scaleFactor,
        width: bounds.width * scaleFactor,
        height: bounds.height * scaleFactor
    };
    return realBounds;
}

async function getCalculatedActiveWinowBuffer(bounds) {
    const activeWin = await getActiveWindow();
    if (!activeWin?.fileBuffer) return null;

    await sharp(activeWin.fileBuffer) // Temporarily workaround
        .resize(bounds.width, bounds.height).toFile("tmp.png");

    return fs.readFileSync("tmp.png");
}

async function getDetectedObjects(startX: number = 0, startY: number = 0) {

    const result = await getObjectsTransformers("tmp.png");
    const actualAAreas = result.map(o => ({
        startX: o.box.xmin + startX,
        startY: o.box.ymin + startY,
        width: o.box.xmax - o.box.xmin,
        height: o.box.ymax - o.box.ymin,
        classes: "rounded-md border-violet-500",
        label: o.label,
        labelClasses: "text-xs bg-violet-500"
    }));

    return actualAAreas;
}

async function getPartOfImage(fromBuffer: Buffer, startX: number, startY: number, width: number, height: number) {
    startX = startX < 0 ? 0 : startX;
    startY = startY < 0 ? 0 : startY;

    const buffer = await sharp(fromBuffer)
        .extract({ left: startX, top: startY, width, height })
        .toBuffer()
    return buffer;
}




main();