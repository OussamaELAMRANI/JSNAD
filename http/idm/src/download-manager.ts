import fs from "node:fs";
import path from "node:path";
import {pipeline} from "node:stream";
import {dist, host} from "@/config.js";
import {downloadMonitor, getHttpClient} from "@/utils.js";

/**
 * Download function use single connection with the HTTP Server
 * Which is slow if the server handle the bandwidth like our Mock Server 1Mb/s
 *
 * The story if we have a file with 100Mb
 * this function need at least 100s to completely download this file (~ 1min 40s)
 */
async function download() {
    const url = new URL(host)
    const filename = url.pathname
    const writeStream = fs.createWriteStream(path.join(__dirname, dist, filename))
    const client = getHttpClient(host);

    const req = client.request(host, (res) => {
        res.on('data', (chunk) => {
            writeStream.write(chunk, (error) => {
                if (error) {
                    res.destroy()
                    console.log('error #: ', error)
                    return
                }
                console.log(`Write chuck ${chunk.length / 1024}`)
            })
        })

        res.on('close', () => {
            console.log(`Response closed !!`)
        })

        writeStream.on('finish', () => {
            console.log(`File successfully downloaded !`)
        })

    })

    req.end()
}


/**
 *
 * downloadChunk is a function that Download a chunk of file via HTTP/HTTPS
 * Each chunk stored on the Disk file system as (filename-chunk-index.part) .1.part as extension
 *
 * downloadChunk use monitor to indicate the progress of download each chunk on per part file
 *
 * @param url
 * @param start
 * @param end
 * @param index
 *
 */
export async function downloadChunk(url: string, start: number, end: number, index: number): Promise<string> {
    return new Promise((resolve, reject) => {
        const client = getHttpClient(url);
        const {hostname, pathname} = new URL(url)

        const req = client.request(url, {
            hostname,
            path: pathname,
            method: 'GET',
            headers: {
                'Accept': '*/*',
                'User-Agent': 'Node.js IDM',
                'Range': `bytes=${start}-${end}`
            }
        }, (res) => {

            const partPath = `${pathname}-chunk-${index}.part`;
            const out = path.join(__dirname, dist, partPath)
            const monitor = downloadMonitor(end - start + 1, index);
            const fileStream = fs.createWriteStream(out);

            pipeline(res, monitor, fileStream, err => {
                if (err) {
                    console.log(err)
                    reject(err)
                }
            })

            fileStream.on('finish', () => {
                console.log(`\n✅ Chunk ${index} saved to ${partPath}`);
                resolve(partPath);
            });

            fileStream.on('error', reject);
        })

        req.end()
    })
}
