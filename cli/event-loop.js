// Save as: event-loop.js
const fs = require('fs')

console.log("🚀 Start");

process.nextTick(() => {
    console.log("⚡ nextTick");
});

Promise.resolve().then(() => {
    console.log("🌀 Promise microtask");
});

setTimeout(() => {
    console.log("⏰ Timeout");
}, 0);

setImmediate(() => {
    console.log("🧾 setImmediate");
});

fs.readFile(__filename, () => {
    console.log("📄 I/O finished (Poll Phase)");
});






const agrs = process.argv