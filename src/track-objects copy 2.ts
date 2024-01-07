import { getActiveDisplay, getActiveWindow, markAreas, openNewWindow } from "../sdk/main";
import { getObjectsTransformers, getUiElementsRoboflow } from "./common/object-detection";
import { getBoundsGoogle, getBoundsTessaract } from "./common/screen-to-boundings";
import * as fs from "fs";
import { windowManager } from "node-window-manager";
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
    const window = windowManager.getActiveWindow();
    const bounds = window.getBounds();
    // await screenshot.captureWindowById("tmp.png", window.id); // DEAD REPLACE

    const display = windowManager.getPrimaryMonitor();
    const scaleFactor = display.getScaleFactor();
    const realBounds = {
        x: bounds.x * scaleFactor,
        y: bounds.y * scaleFactor,
        width: bounds.width * scaleFactor,
        height: bounds.height * scaleFactor
    };

    // const result = await getObjectsTransformers("tmp.png");
    // const actualAAreas = result.map(o => ({
    //     startX: o.box.xmin + realBounds.x,
    //     startY: o.box.ymin + realBounds.y,
    //     width: o.box.xmax - o.box.xmin,
    //     height: o.box.ymax - o.box.ymin,
    //     classes: "rounded-md border-violet-500",
    //     label: o.label,
    //     labelClasses: "text-xs bg-violet-500"
    // }));
    // await markAreas(actualAAreas);
    console.time("getActiveDisplay");
    const response = await getUiElementsRoboflow("tmp.png");
    console.timeEnd("getActiveDisplay");

    const areas = response.predictions.map(o => ({
        x: o.x + realBounds.x,
        y: o.y + realBounds.y,
        width: o.width,
        height: o.height,
        classes: "rounded-md border-violet-500",
        label: o.class,
        labelClasses: "text-xs bg-violet-500"
    }));
    await markAreas(areas);
    console.log("response", response);

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