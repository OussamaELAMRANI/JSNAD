import fs from "node:fs/promises";

/**
 *
 * @param stats
 * @return {string}
 *  drwxr-xr-x
 *  drwx---r--
 *  {
 *  user, group, another
 *  directory read-write-execute - read-write-execute - read-write-execute
 *  }
 */
export function handlePermission(stats) {
    const isDir = stats.isDirectory();
    const typeChar = isDir ? 'd' : '-';
    const mode = (stats.mode & 0o777).toString(8).padStart(3, '0');
    const permission = mode
        .split('')
        .map(o => {
            const n = parseInt(o, 10);
            return `${n & 4 ? 'r' : '-'}${n & 2 ? 'w' : '-'}${n & 1 ? 'x' : '-'}`;
        })
        .join('');

    return typeChar + permission
}

export const color = {
    red: (text) => `\x1b[31m${text}\x1b[0m`,
    green: (text) => `\x1b[32m${text}\x1b[0m`,
    yellow: (text) => `\x1b[33m${text}\x1b[0m`,
    cyan: (text) => `\x1b[36m${text}\x1b[0m`
};

export async function getUserOwner(uid) {
    const passwd = await fs.readFile('/etc/passwd', {encoding: 'utf-8'});

    return passwd
        .split('\n')
        .find(line => line.split(':')[2] == uid)
        ?.split(':')[0] ?? uid;
}

export async function getGroupOwner(gid) {
    const group = await fs.readFile('/etc/group', {encoding: 'utf-8'});

    const lines = group.split('\n');
    for (let line of lines) {
        if (line.match(`:${gid}:`)) {
            return line.split(':')[0]
        }
    }
    return gid
}


export function formatSize(size) {
    if (size >= 1024 ** 3) {
        return (size / (1024 ** 3)).toFixed(1) + 'GB';
    } else if (size >= 1024 ** 2) {
        return (size / (1024 ** 2)).toFixed(1) + 'MB';
    } else if (size >= 1024) {
        return (size / 1024).toFixed(1) + 'KB';
    }
    return size + 'B';
}
