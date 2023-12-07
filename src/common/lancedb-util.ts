import { OpenAIEmbeddingFunction, connect, } from 'vectordb';
const dbPath = 'db'
let embedFunction;

export interface IngestOptions {
    table: string;
    data: Array<Record<string, unknown>>;
}

export interface RetriveOptions {
    query: string;
    table: string;
    limit?: number;
    filter?: string;
    select?: Array<string>;
}

export interface DeleteOptions {
    table: string;
    filter: string;
}

export interface UpdateOptions {
    table: string;
    data: Record<string, unknown>[]
}

export async function useLocalEmbedding() {
    const TransformersApi = Function('return import("@xenova/transformers")')();
    const { pipeline } = await TransformersApi;
    const pipe = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');

    const embed_fun: any = {};
    embed_fun.sourceColumn = 'pageContent';
    embed_fun.embed = async function (batch) {
        let result = [];
        for (let text of batch) {
            const res = await pipe(text, { pooling: 'mean', normalize: true });
            result.push(Array.from(res['data']));
        }
        return (result);
    }

    embedFunction = embed_fun;
}

export function useOpenAiEmbedding(apiKey: string, sourceColumn = 'pageContent') {
    embedFunction = new OpenAIEmbeddingFunction(sourceColumn, apiKey)
}

export async function update(options: UpdateOptions) {
    try {
        const db = await connect(dbPath)

        if ((await db.tableNames()).includes(options.table)) {
            const tbl = await db.openTable(options.table, embedFunction)
            await tbl.overwrite(options.data)
        } else {
            return new Error("Table does not exist")
        }
    } catch (e) {
        console.error(e);
        throw e;
    }
}

export async function remove(options: DeleteOptions) {
    try {
        const db = await connect(dbPath)

        if ((await db.tableNames()).includes(options.table)) {
            const tbl = await db.openTable(options.table, embedFunction)
            await tbl.delete(options.filter)
        } else {
            return new Error("Table does not exist")
        }
    } catch (e) {
        console.error(e);
        throw e;
    }
}

export async function ingest(options: IngestOptions) {
    try {
        const db = await connect(dbPath)
        if ((await db.tableNames()).includes(options.table)) {
            const tbl = await db.openTable(options.table, embedFunction)
            await tbl.overwrite(options.data)
        } else {
            await db.createTable(options.table, options.data, embedFunction)
        }
    }
    catch (e) {
        console.error(e);
        throw e;
    }
}

export async function retrive(options: RetriveOptions) {
    try {
        const db = await connect(dbPath)

        if ((await db.tableNames()).includes(options.table)) {
            const tbl = await db.openTable(options.table, embedFunction)
            const build = tbl.search(options.query);

            if (options.filter) {
                build.filter(options.filter)
            }

            if (options.select) {
                build.select(options.select)
            }

            if (options.limit) {
                build.limit(options.limit)
            }

            const results = await build.execute();
            return results;
        } else {
            return new Error("Table does not exist")
        }
    }
    catch (e) {
        console.error(e);
        throw e;
    }
}