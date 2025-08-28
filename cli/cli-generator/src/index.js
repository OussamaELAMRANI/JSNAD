#!/usr/bin/env node

import {makeComponent} from "./maker/component.js";
import {makeView} from "./maker/view.js";

const argv = process.argv.slice(2)

const [cmd, ...args] = argv
const help = () => {
    console.log(`
Node CLI Generator Help:

Usage:
  make component <name>         Create a component file
  make controller <name>        Create a controller file
  make view <name> <engine>     Create a view file (--twig, --blade, --ejs)

Examples:
  make component Header
  make controller UserController
  make view home twig
  `);
};


switch (cmd) {
    case 'component':
        makeComponent(args[0])
        break;
    case 'view':
        makeView(args[0], args[1])
        break;
    case '--help' || '-h':
    case '--guide' || '-g':
    default:
        help()
        break;
}