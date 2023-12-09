import sharp = require("sharp");
import { addContent, addHeaderContent, clearAreas, clearContentAtPositions, clickImage, displayContentAtPositions, getActiveDisplay, getActiveWindow, markAreas, moveMouseToImage, openApp, openNewWindow, waitForInput } from "../sdk/main";
import { getObjectsTransformers, getUiElementsRoboflow } from "./common/object-detection";
import * as fs from "fs";
import { windowManager } from "node-window-manager";
const contentHeight = 200;
const contentWidth = 200;
const display = windowManager.getPrimaryMonitor();
const { width, height } = display.getBounds();

async function main() {
    await displayMessage("Im scanning your screen, gimme a sec...", width / 2, height / 2);
    const bounds = getRealBounds();
    const activeWinFileBuffer = await getCalculatedActiveWinowBuffer(bounds);
    const elements = await findAndMarkElements();

    for (const element of elements) {
        try {
            await displayMessage(`Tell me a bit about this ${element.label}`, element.startX + element.width, element.startY);
            await markAreas([element]);
            openApp({
                bringToFront: true,
                keepInteraction: true,
                focus: true,
                height: 76,
                width: 400,
            })
            const input = await waitForInput();
            await addHeaderContent(`${element.label} = ${input}`);

            const partBuffer = await getPartOfImage(activeWinFileBuffer, element.startX, element.startY, element.width, element.height);
            const imageBase64 = `data:image/png;base64,${partBuffer.toString("base64")}`;
            await addContent(`<img src='${imageBase64}' />`);
            await clickImage("public/matchers/needle.png");
        } catch (e) {
            console.error(e);
        }
    }

    await clearAreas();
    await clearContentAtPositions();

    openApp({
        stickTo: "TopCenter",
        bringToFront: true,
        keepInteraction: true,
        focus: true
    })
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
    await sharp(activeWin.fileBuffer) // Temporarily workaround
        .resize(bounds.width, bounds.height).toFile("tmp.png");

    return fs.readFileSync("tmp.png");
}

async function findAndMarkElements(startX: number = 0, startY: number = 0) {

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
    const buffer = await sharp(fromBuffer)
        .extract({ left: startX, top: startY, width, height })
        .toBuffer()
    return buffer;
}

async function displayMessage(message: string, x: number, y: number) {
    await displayContentAtPositions([{
        x,
        y,
        width: contentHeight,
        height: contentWidth,
        html: buildBoardy(message)
    }]);
}

function buildBoardy(message: string) {
    const boardySrc = "C:\\repos\\Command-Playground\\boardy.png";
    return `
    <div class="p-2 bg-white rounded-md shadow-md">
    ${message}
    </div>
    <img class="animate-bounce p-8" src=${boardySrc} />
    `
}


main();