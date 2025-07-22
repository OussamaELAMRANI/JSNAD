import fs from 'node:fs'
import path from 'node:path'
import {fileURLToPath} from 'url'

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename)

export function makeView(name, engine = '--twig') {
    if (!name) return console.error('❌ Please provide a view name.');
    if (!['--twig', 'blade', 'ejs'].includes(engine))
        return console.error('❌ Supported engines: (twig, blade, ejs) !');

    const baseFile = {
        '--twig': () => path.resolve(__dirname, '../template/views/view.twig.stub')
    }
    try {
        const targetPath = `./${name}.${engine.slice(2)}`;
        const view = baseFile[engine]();
        if (fs.existsSync(view)) {
            const content = fs.readFileSync(view, {encoding: 'utf-8'})
            fs.writeFileSync(targetPath, content.replace(/{{name}}/g, name));
            return content
        }
    } catch (err) {
        console.error(err.message)
        process.exit(1)
    }
}