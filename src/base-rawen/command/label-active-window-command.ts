import { addPrompt, endStream, getActiveWindowTitle, isStreaming, markAreas, openWindow } from "../../../sdk/main";
import { BaseActiveFromKnowledge } from "../base-rawen-active-title-knowledge";

export async function mainerr() {
    const title = await getActiveWindowTitle();
    const res = await new BaseActiveFromKnowledge().call();

    const isStreamingActive = await isStreaming();
    if (!isStreamingActive) {
        await addPrompt("Marking any element of the active window that I know");
    }

    if (res.length === 0) {
        return;
    }

    await openWindow(title, {
        bounds: {
            height: res[0].Window_Sizes.height,
            width: res[0].Window_Sizes.width,
            x: 0,
            y: 0
        }
    });

    console.log(res);

    await markAreas(res.map(x => ({
        height: x.Element_Size.height,
        width: x.Element_Size.width,
        x: x.Element_Position.x,
        y: x.Element_Position.y,
        label: x.About_Element,
        classes: "rounded-md border-violet-500",
        labelClasses: "text-xs bg-violet-500"
    })));

    await endStream();
}