export function createQueue() {
    let promiseRunning = false;
    const queue = [];

    const runNext = () => {
        if (!promiseRunning && queue.length > 0) {
            const nextFunction = queue.shift();
            promiseRunning = true;
            nextFunction().finally(() => {
                promiseRunning = false;
                runNext();
            });
        }
    };

    return function enqueue(func) {
        return new Promise((resolve, reject) => {
            queue.push(() => func().then(resolve).catch(reject));
            runNext();
        });
    };
}