import fs from 'node:fs'
import {stat} from 'node:fs/promises'
import path from "node:path";
import {color, formatSize, getGroupOwner, getUserOwner, handlePermission} from "../utils.js";
import * as os from "node:os";

const __dirname = import.meta.url

export function ls(agrs) {
    const currentPath = agrs[0] || "./"
    fs.readdir(currentPath, async (err, files) => {
        if (err) {
            console.error(err.message)
            return
        }
        process.stdout.write('Total ' + files.length + '\n')
        for (const file of files) {
            const stats = await stat(path.resolve(currentPath, file))
            const permission = handlePermission(stats)

            const filename = stats.isDirectory() ? color.green(file) : file
            const links = stats.nlink ?? 1;
            let uid = stats.uid;
            let group = await getGroupOwner(stats.gid);
            const usr = uid === os.userInfo().uid ? os.userInfo().username : await getUserOwner(uid)
            const size = formatSize(stats.size)
            // const createdAt = stats.birthtime.toString()
            const createdAt = stats.atime

            process.stdout.write([permission, links, usr, group, size, color.red(createdAt), filename].join('\t') + '\n')
        }
        process.stdout.write('\n')
    })
}

ls(process.argv.slice(2))

