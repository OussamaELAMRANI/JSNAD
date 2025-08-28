import fs from "node:fs/promises";
import path from "node:path";
import {NotFoundException} from "./Exceptions.js";
import {DELAY_PER_CHUNK} from "./config.js";
import {ReadStream} from "node:fs";
import {ServerResponse} from "node:http";

type FileStatType = {
    totalSize: number
    ext: string
    fileName: string
}

export async function fileStats(filePath: string): Promise<FileStatType> {
    try {
        const ext = path.extname(filePath)
        const fileName = path.basename(filePath)
        const stats = await fs.stat(filePath);

        return {
            totalSize: stats.size,
            ext,
            fileName,
        }
    } catch (err) {
        throw new NotFoundException("File does not exist", err)
    }
}

/**
 *
 * @param range
 * @param startRange
 * @param stopRange
 *
 * Example range: bytes=10-1000
 */
export function handleHeaderRange(range: string | undefined, startRange: number, stopRange: number) {
    let start = startRange;
    let stop = stopRange;

    const match = range?.match(/bytes=(\d*)-(\d*)/);
    if (match) {
        start = match[1] ? parseInt(match[1], 10) : startRange;
        stop = match[2] ? parseInt(match[2], 10) : stopRange;
    }

    return { start, stop };
}

// Throttle using manual chunk + delay loop
export function throatRequest(fileStream: ReadStream, res: ServerResponse) {
    if (res.writableEnded) return;

    const chunk = fileStream.read();
    if (chunk) {
        const ok = res.write(chunk);
        console.log(`📦 Sent chunk: ${chunk.length} bytes`);
        const retry = () => throatRequest(fileStream, res);

        if (!ok) {
            res.once('drain', () => setTimeout(retry, DELAY_PER_CHUNK));
        } else {
            setTimeout(retry, DELAY_PER_CHUNK);
        }
    } else {
        fileStream.once('readable', () => throatRequest(fileStream, res));
    }
}
