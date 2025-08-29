import * as https from "node:https";
import * as http from "node:http";
import {PassThrough} from 'stream'
import {
    createWriteStream,
    existsSync,
    readFileSync,
    createReadStream,
} from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";
import {__dirname, dist} from "./config.ts";
import {createHash} from "node:crypto";
import * as readline from "node:readline";

export function getHttpClient(url: string) {
    return url.startsWith('https') ? https : http
}

export function fetchFileSize(url: string): Promise<{ size: number }> {
    const client = getHttpClient(url);
    const {hostname, pathname} = new URL(url)
    return new Promise((resolve, reject) => {
        const req = client.request(url, {
            hostname,
            path: pathname,
            method: 'GET',
            headers: {
                'Accept': '*/*',
                'User-Agent': 'Node.js IDM',
                'Range': 'bytes=0-0'
            }
        }, (res) => {
            // // We don't want to download the body; headers are enough.
            res.once('readable', () => {
                res.destroy()
            })

            const code = res.statusCode || 0
            if (code > 400) {
                const msg = `HTTP ${code}: ${res.statusMessage || ""}`.trim();
                reject(new Error(msg))
            }

            if (code === 206) {
                const total = parseRangeHeader(res.headers["content-range"] ?? '')
                if (total != null) return resolve({size: total});
                return reject(new Error("Missing/invalid Content-Range header on 206 response"));
            }
        })

        req.on('error', (err) => {
            console.log(err)
            req.destroy()
            reject(err)
        })

        req.end()
    })
}


// matches either "bytes 0-0/12345" or "bytes */12345"
function parseRangeHeader(range: string) {
    const matcher = /^bytes\s+(?:\d+-\d+|\*)\/(\d+)$/.exec(range);
    return matcher ? Number(matcher[1]) : null;
}

export function downloadMonitor(total: number, chunkIndex: number) {
    let downloaded = 0;
    const startTime = process.hrtime.bigint(); // high-precision start time

    return new PassThrough({
        write(chunk, _encoding, callback) {
            downloaded += chunk.length;

            const now = process.hrtime.bigint(); // current high-precision time
            const elapsedNs = now - startTime;
            const elapsedSec = Number(elapsedNs) / 1_000_000_000;

            const percent = ((downloaded / total) * 100).toFixed(2);

            process.stdout.write(
                `\r🧩 Chunk ${chunkIndex}: ${percent}% (${downloaded}/${total} bytes) - ${elapsedSec.toFixed(2)}s`
            );

            this.push(chunk);
            callback();
        },
        final(callback) {
            const now = process.hrtime.bigint();
            const elapsedNs = now - startTime;
            const elapsedSec = Number(elapsedNs) / 1_000_000_000;
            console.log(`\n✅ Chunk ${chunkIndex} finalized in ${elapsedSec.toFixed(2)}s`);
            callback();
        }
    });
}

/**
 * composeFile a sync function for merging each file part to be a final file (filename.ext)
 *
 * @param outputPath
 * @param files
 */
export function composeFile(outputPath: string, files: string[]) {
    const output = createWriteStream(outputPath)

    for (const file of files) {
        const filePath = path.join(__dirname, dist, file)
        const data = readFileSync(filePath)
        output.write(data)
        // unlinkSync(filePath);
    }

    output.end();
    console.log(`\n🎉 Merged file saved as ${outputPath}`);
}


export function calculateChecksum(filePath: string, algorithm: 'sha256' | 'md5' = 'sha256'): string {
    const hash = createHash(algorithm);
    const data = readFileSync(filePath);
    hash.update(data);
    return hash.digest('hex');
}

export async function checksumAppend(partPath: string) {
    const dirPath = path.join(__dirname, dist);
    const csvPath = path.join(dirPath, '.checksum.csv');

    const line = `${partPath}\n`;
    await fs.appendFile(csvPath, line, 'utf-8');

    console.log(`📝 Appended checksum for ${partPath}`);
}

export async function loadChecksums() {
    const csvPath = path.join(__dirname, dist, '.checksum.csv');
    const result: Record<string, string> = {};

    const content = await fs.readFile(csvPath, 'utf-8');
    for (const line of content.trim().split('\n')) {
        result[line] = '';
    }

    return result;
}

export async function hasChecksum(partPath: string): Promise<boolean> {
    const csvPath = path.join(__dirname, dist, '.checksum.csv');
    if (!existsSync(csvPath)) return false;
    const fileStream = createReadStream(csvPath, {encoding: 'utf-8'});

    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });

    for await (const line of rl) {
        if (line === partPath) {
            return true;
        }
    }

    return false;
}