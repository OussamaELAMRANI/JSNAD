import * as https from "node:https";
import * as http from "node:http";
import {PassThrough} from 'stream'
import fs from "node:fs";
import path from "node:path";
import {__dirname, dist} from "config.js";

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

export function downloadMonitor(total: number, chunkIndex: any) {
    let downloaded = 0;
    let startTime = Date.now();


    return new PassThrough({
        write(chunk: any, encoding: BufferEncoding, callback: (error?: (Error | null)) => void) {
            downloaded += chunk.length;
            const percentage = Number((downloaded / total) * 100).toFixed(2)
            const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

            process.stdout.write(
                `\r🧩 Chunk ${chunkIndex}: ${percentage}% (${downloaded}/${total} bytes) - ${elapsed}s elapsed`
            );
            this.push(chunk);
            callback();
        },
    })
}

/**
 * composeFile a sync function for merging each file part to be a final file (filename.ext)
 *
 * @param outputPath
 * @param files
 */
export function composeFile(outputPath: string, files: string[]) {
    const output = fs.createWriteStream(outputPath)

    for (const file of files) {
        const filePath = path.join(__dirname, dist, file)
        const data = fs.readFileSync(filePath)
        output.write(data)
        fs.unlinkSync(filePath);
    }

    output.end();
    console.log(`\n🎉 Merged file saved as ${outputPath}`);
}