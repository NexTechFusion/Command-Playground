import sharp = require("sharp");
import { addResult, addPrompt, clearAreas, clearContentAtPositions, clickImage, markAreas, openApp, waitForInput } from "../sdk/main";
import { getObjectsTransformers } from "./common/object-detection";
import { windowManager } from "node-window-manager";
import { getActiveWinowBuffer, getPartOfImage } from "./common/window-utils";
import { boardySays } from "./common/boardy.util";
const display = windowManager.getPrimaryMonitor();
const { width, height } = display.getBounds();

async function main() {
    await boardySays("Im scanning your screen, gimme a sec...", width / 2, height / 2);
    const activeWinFileBuffer = await getActiveWinowBuffer();
    const elements = await findAndMarkElements();

    for (const element of elements) {
        try {
            await boardySays(`Tell me a bit about this ${element.label}`, element.x + element.width, element.y);
            await markAreas([element]);
            openApp({
                bringToFront: true,
                keepInteraction: true,
                focus: true,
                height: 76,
                width: 400,
            })
            const input = await waitForInput();
            await addPrompt(`${element.label} = ${input}`);

            const partBuffer = await getPartOfImage(activeWinFileBuffer, element.x, element.y, element.width, element.height);
            const imageBase64 = `data:image/png;base64,${partBuffer.toString("base64")}`;
            await addResult(`<img src='${imageBase64}' />`);
            await clickImage("public/matchers/needle.png");
        } catch (e) {
            console.error(e);
        }
    }

    await clearAreas();
    await clearContentAtPositions();

    openApp({
        bringToFront: true,
        keepInteraction: true,
        focus: true
    })
}

async function findAndMarkElements(startX: number = 0, startY: number = 0) {

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