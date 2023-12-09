import { displayContentAtPositions } from "../../sdk/main";
const contentHeight = 200;
const contentWidth = 200;

export async function boardySays(message: string, x: number, y: number) {
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