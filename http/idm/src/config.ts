import * as path from "node:path";

const argv = process.argv.slice(2)

const __filename = import.meta.filename
export const __dirname = path.dirname(__filename)


export const host = argv[0] ?? "http://127.0.0.1:3000/v.mp4"
export const dist = argv[1] ?? "../dist"
export const CONCURRENCY = parseInt(argv[2]) || 16