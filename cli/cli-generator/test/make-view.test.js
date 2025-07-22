import assert from 'node:assert/strict'
import fs from "node:fs";
import path from "node:path";
import {describe, it} from 'node:test'
import {execSync} from 'node:child_process'
import {makeView} from "../src/maker/view.js";

describe("MakeView Node CLI", {}, () => {
    it('should show error when name is missing', () => {
        let errorOutput = '';
        console.error = (msg) => (errorOutput = msg);
        makeView(null);
        assert.ok(errorOutput.match(/Please provide a view name./g));
    });

    it('should show error when engine is invalid', () => {
        let errorOutput = '';
        console.error = (msg) => (errorOutput = msg);
        makeView('home', 'invalid');
        assert.ok(errorOutput.match(/Supported engines/g));
    });

    it('Should makeView::function create the view file', () => {
        const fileName = 'home'
        const ext = 'twig'
        const twig = path.resolve(import.meta.dirname, `../${fileName}.${ext}`);
        try {
            if (fs.existsSync(twig)) fs.unlinkSync(twig)
            makeView(fileName, '--twig');
            assert.ok(fs.existsSync(twig), 'View file not created')
        } catch (err) {
            console.error('❌make-view.test.js failed:', err.message);
            process.exit(1);
        } finally {
            if (fs.existsSync(twig)) fs.unlinkSync(twig)
        }
    })

    it('should run the gen cmd to create view', () => {
        const node = process.argv[0]
        const exc = path.resolve(import.meta.dirname, '../src/index.js')
        const run = (cmd) => execSync(`${node} ${exc} ${cmd}`)

        const fileName = 'home'
        const ext = 'twig'
        const twig = path.resolve(import.meta.dirname, `../${fileName}.${ext}`);
        let cmd = null
        try {
            if (fs.existsSync(twig)) fs.unlinkSync(twig)
            cmd = run(`view home --twig`)
            assert.ok(fs.existsSync(twig), 'View file not created')
        } catch (err) {
            console.error('❌make-view.test.js failed:', err.message);
            process.exit(1);
        } finally {
            if (fs.existsSync(twig)) fs.unlinkSync(twig)
        }
    });
})