export class PromiseQueue {
    promiseInProgress: boolean;
    queue: any[];
    delay: number;

    constructor(delay?: number) {
        this.promiseInProgress = false;
        this.queue = [];
        this.delay = delay ?? 2000;
    }

    async callFunction(fn, ...args) {
        if (!this.promiseInProgress) {
            this.promiseInProgress = true;
            try {
                const result = await fn(...args);
                this.next();
                return result;
            } catch (error) {
                this.next();
                throw error;
            }
        } else {
            return new Promise((resolve, reject) => {
                this.queue.push({ fn, args, resolve, reject });
            });
        }
    }

    next() {
        if (this.queue.length > 0) {
            setTimeout(() => {
                const { fn, args, resolve, reject } = this.queue.shift();
                fn(...args)
                    .then(resolve)
                    .catch(reject)
                    .finally(() => this.next());
            }, this.delay);
        } else {
            this.promiseInProgress = false;
        }
    }
}