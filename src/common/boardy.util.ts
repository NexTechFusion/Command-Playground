import { displayContentAtPositions } from "../../sdk/main";
const contentHeight = 300;
const contentWidth = 300;

export async function boardySays(message: string, x: number = 1500, y: number = 500, width: number = contentWidth, height: number = contentHeight) {
    await displayContentAtPositions([{
        x,
        y,
        width,
        height,
        html: buildBoardy(message)
    }]);
}

function buildBoardy(message: string) {
    const boardySrc = __dirname + "\\rawen.png";
    console.log("boardySrc", boardySrc);
    return `
    <div class="p-2 bg-white rounded-md shadow-md">
    ${message}
    </div>
    <img class="animate-bounce p-8" src=${boardySrc} />
    `
}