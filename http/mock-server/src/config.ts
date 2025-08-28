import {fileURLToPath} from "node:url";
import path from "node:path";

const args = process.argv.slice(2)
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export const PORT = process.env.PORT || 3000
export const PUBLIC_DIR = path.join(__dirname, '../public')

const parsedArgs: Record<string, string | boolean> = {};

for (const arg of args) {
    if (arg.startsWith("--")) {
        const [key, value] = arg.slice(2).split("=");
        parsedArgs[key] = value ?? true; // flag = true if no value
    }
}

// === CONFIG ===
export const KEEP_ALIVE = parsedArgs?.alive || false
export const SPEED_LIMIT_KBPS = parsedArgs.limit ?? 1024 // 1Mb/s
export const CHUNK_SIZE = 64 * 1024 // 64 KB
export const DELAY_PER_CHUNK = Math.ceil((CHUNK_SIZE / (SPEED_LIMIT_KBPS * 1024)) * 1000)


export function setContentType(ext: string) {
    const extensions: Record<string, any> = {
        '.mp4': 'video/mp4',
        '.pdf': 'application/pdf',
        '.zip': 'application/zip',
        '.jpg': 'image/jpeg',
        '.png': 'image/png',
        '.txt': 'text/plain',
    }
    return (extensions[ext] || 'application/octet-stream')
}
