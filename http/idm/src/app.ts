import {composeFile, fetchFileSize} from "./utils.js";
import {__dirname, CONCURRENCY, dist, host} from "./config.js";
import * as path from "node:path";
import {downloadChunk} from "download-manager.js";


async function main() {
    const {size} = await fetchFileSize(host);
    const chunkSize = Math.ceil(size / CONCURRENCY)
    console.log(`📦 Total file size: ${size} bytes`);
    const filename = path.basename(host)
    const out = path.join(__dirname, dist, filename)

    const tasks = []
    for (let i = 0; i < CONCURRENCY; i++) {
        const start = i * chunkSize
        const end = Math.min(chunkSize + start - 1, size - 1);
        tasks.push({start, end, index: i})
    }

    try {
        const results = await Promise.all(tasks.map(task => downloadChunk(host, task.start, task.end, task.index)))
        console.log(results)
        composeFile(out, results)
    } catch (e) {
        console.log(e)
    }
}

await main()


