import http, {OutgoingHttpHeaders} from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import {CHUNK_SIZE, DELAY_PER_CHUNK, KEEP_ALIVE, PORT, PUBLIC_DIR, setContentType, SPEED_LIMIT_KBPS} from "./config.ts";
import {fileStats, handleHeaderRange, throatRequest} from "./utils.ts";


const server = http.createServer(async (req, res) => {
    const protocol = req.headers['x-forwarded-proto'] ?? 'http'

    const url = new URL(req.url ?? '/', `${protocol}://${req.headers.host}`)
    const urlPath = decodeURIComponent(url.pathname)
    const safePath = path.normalize(path.join(PUBLIC_DIR, urlPath))
    const filePath = path.resolve(safePath)

    // Prevent directory traversal
    if (!filePath.startsWith(PUBLIC_DIR)) {
        res.writeHead(403, {'Content-Type': 'text/plain'})
        return res.end('Access denied ' + filePath)
    }

    try {
        const {ext, totalSize, fileName} = await fileStats(filePath)
        const {range} = req.headers
        let startRange = 0;
        let stopRange = totalSize - 1
        const statusCode = 206

        const {start, stop} = handleHeaderRange(range, startRange, stopRange)
        if (start >= totalSize || stop >= totalSize || start > stop) {
            res.writeHead(416, {
                'Content-Range': `bytes */${totalSize}`,
                'Content-Type': 'text/plain'
            })
            return res.end('Requested Range Not Satisfiable')
        }

        let headers: OutgoingHttpHeaders = {
            'Content-Type': setContentType(ext),
            'Connection': KEEP_ALIVE ? 'keep-alive' : 'close',
            'Accept-Ranges': 'bytes',
            'Content-Range': `bytes ${start}-${stop}/${totalSize}`,
            'Content-Length': stop - start + 1,
        }

        res.writeHead(statusCode, headers)

        const fileStream = fs.createReadStream(filePath, {start, end: stop, highWaterMark: CHUNK_SIZE})


        res.on('close', () => {
            console.warn('⚠️ Client closed connection prematurely')
            fileStream.destroy()
        })

        fileStream.on('end', () => {
            console.log(`✅ Finished sending ${fileName}`)
            res.end()
        })

        fileStream.on('error', err => {
            console.error('❌ Stream error:', err.message)
            res.destroy(err)
        })

        fileStream.once('readable', () => throatRequest(fileStream, res))

    } catch (err) {
        if (err instanceof Error) {
            res.writeHead(err?.status || 405, {'Content-Type': 'text/plain'})
            return res.end(err.message)
        }

        throw err
    }
})

server.listen(PORT, () => {
    console.log(`🚀 Mock Server running on http://127.0.0.1:${PORT}/`)
    console.log(`📂 Serving from ${PUBLIC_DIR}`)
    console.log(`⚡ Speed limit: ${SPEED_LIMIT_KBPS} KB/s | Chunk: ${CHUNK_SIZE / 1024} KB | Delay: ${DELAY_PER_CHUNK} ms`)
})
