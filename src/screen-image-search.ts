import sharp = require("sharp");
import { clearContentAtPositions, markAreas } from "../sdk/main";
import { getObjectsTransformers } from "./common/object-detection";
import { windowManager } from "node-window-manager";
import { ingestImages, retriveImages } from "./common/image-store";
import { boardySays } from "./common/boardy.util";
import { getActiveWinowBuffer, getPartOfImage } from "./common/window-utils";

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

    const activeWinFileBuffer = await getActiveWinowBuffer();
    if (!activeWinFileBuffer) { scan(); return };

    const objects = await getDetectedObjects();

    for (const object of objects) {
        try {
            const partBuffer = await getPartOfImage(activeWinFileBuffer, object.x, object.y, object.width, object.height);
            const res = await retriveImages(partBuffer, 1);
            if (res.length > 0) {
                const match = res[0];
                await boardySays("Found at my knowledge : " + match.text, object.x + object.width, object.y);
                await markAreas([object]);
                return;
            }
        } catch (e) {
            console.log("ERROR", e);
        }
    }

    scan();
}

async function getDetectedObjects(startX: number = 0, startY: number = 0) {
    const result = await getObjectsTransformers("tmp.png");
    const actualAAreas = result.map(o => ({
        x: o.box.xmin + startX,
        y: o.box.ymin + startY,
        width: o.box.xmax - o.box.xmin,
        height: o.box.ymax - o.box.ymin,
        classes: "rounded-md border-violet-500",
        label: o.label,
        labelClasses: "text-xs bg-violet-500"
    }));

    return actualAAreas;
}

main();