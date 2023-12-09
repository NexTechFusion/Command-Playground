import { MetricType, OpenAIEmbeddingFunction, connect, } from 'vectordb';
import { initTransformers, pipeline } from './transformerjs-wrapper';
const dbPath = 'lancedb'
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
    metricType?: MetricType;
}

export interface DeleteOptions {
    table: string;
    filter: string;
}

export interface UpdateOptions {
    table: string;
    data: Record<string, unknown>[]
}
export function setEmbeddingFn(fn) {
    embedFunction = fn;
}

export async function useLocalEmbedding() {
    await initTransformers();
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

            const toRemove = options.data.map(o => `'${o.id}'`).join(", ");
            await tbl.delete("id IN (" + toRemove + ")");

            await tbl.add(options.data)
        } else {
            await db.createTable(options.table, options.data, embedFunction)
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

export async function retrive<T>(options: RetriveOptions) {
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

            if (options.metricType) {
                build.metricType(options.metricType)
            }

            if (options.limit) {
                build.limit(options.limit)
            }
            const results = await build.execute();
            return results as T[];
        } else {
            return new Error("Table does not exist")
        }
    }
    catch (e) {
        console.error(e);
        throw e;
    }
}