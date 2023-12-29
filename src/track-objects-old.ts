import { getActiveDisplay, getActiveWindow, markAreas, openNewWindow } from "../sdk/main";
import { getObjectsTransformers } from "./common/object-detection";
import { getBoundsGoogle, getBoundsTessaract } from "./common/screen-to-boundings";
import * as fs from "fs";
import { windowManager } from "node-window-manager";
import * as sharp from 'sharp';
import { screenshot } from 'screenshot-ftw';

async function main() {
    // await openNewWindow("hi", {
    //     bringToFront: true,
    //     browserWindowOptions: {
    //         frame: false,
    //         fullscreen: true,
    //         autoHideMenuBar: true,
    //         transparent: true
    //     }
    // });
    // highlight positions of objects
    await new Promise(r => setTimeout(r, 3000));
    console.time("getActiveDisplay");
    const activeWin = await getActiveWindow();
    const window = windowManager.getActiveWindow();
    const bounds = window.getBounds();
    await screenshot.captureWindowById("tmp.png", window.id);

    const display = windowManager.getPrimaryMonitor();
    const scaleFactor = display.getScaleFactor();
    const realBounds = {
        x: bounds.x * scaleFactor,
        y: bounds.y * scaleFactor,
        width: bounds.width * scaleFactor,
        height: bounds.height * scaleFactor
    };
    await markAreas([{
        startX: realBounds.x,
        startY: realBounds.y,
        width: realBounds.width,
        height: realBounds.height,
        classes: "rounded-md border-violet-500",
        label: "test",
        labelClasses: "text-xs bg-violet-500"
    }]);
    await sharp(activeWin.fileBuffer)
        .resize(realBounds.width, realBounds.height).toFile("tmp.png");

    const result = await getObjectsTransformers("tmp.png");
    console.log(result);
    const actualAAreas = result.map(o => ({
        startX: o.box.xmin + realBounds.x,
        startY: o.box.ymin + realBounds.y,
        width: o.box.xmax - o.box.xmin,
        height: o.box.ymax - o.box.ymin,
        classes: "rounded-md border-violet-500",
        label: o.label,
        labelClasses: "text-xs bg-violet-500"
    }));
    
    await markAreas(actualAAreas);
    console.timeEnd("getActiveDisplay");

    // const bounds = await getBoundsGoogle(activeWin.fileBuffer);
    // const areas = bounds.map(o => ({
    //     startX: o.boundingBox.x0,
    //     startY: o.boundingBox.y0,
    //     width: o.boundingBox.x1 - o.boundingBox.x0,
    //     height: o.boundingBox.y1 - o.boundingBox.y0,
    //     classes: "rounded-md border-violet-500",
    //     label: o.text,
    //     labelClasses: "text-xs bg-violet-500"
    // }));
    // console.log("AREAS", areas);
    // await markAreas(areas)
}

main();