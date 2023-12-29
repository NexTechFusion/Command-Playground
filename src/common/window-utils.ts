import sharp = require("sharp");
import { getActiveWindow } from "../../sdk/main";
import * as fs from "fs";
import { windowManager } from "node-window-manager";
// Temporarily workaround to get the active window buffer cause getActiveWindow out of elctron is not working properly
export async function getActiveWinowBuffer() {
    const bounds = getRealBounds();
    const activeWin = await getActiveWindow();
    await sharp(activeWin.fileBuffer) // Temporarily workaround
        .resize(bounds.width, bounds.height).toFile("tmp.png");

    return fs.readFileSync("tmp.png");
}

export async function getPartOfImage(fromBuffer: Buffer, startX: number, startY: number, width: number, height: number) {
    startX = startX < 0 ? 0 : startX;
    startY = startY < 0 ? 0 : startY;

    const buffer = await sharp(fromBuffer)
        .extract({ left: startX, top: startY, width, height })
        .toBuffer()
    return buffer;
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