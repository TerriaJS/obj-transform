"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const eventStream = require("event-stream");
const fsExtra = require("fs-extra");
/**
 * Read a file line-by-line.
 *
 * @param {String} path Path to the file.
 * @param {Function} callback Function to call when reading each line.
 * @returns {Promise} A promise when the reader is finished.
 *
 * @private
 */
function readLines(path, callback) {
    return new Promise(function (resolve, reject) {
        fsExtra.createReadStream(path)
            .on('error', reject)
            .on('end', resolve)
            .pipe(eventStream.split('\n'))
            .pipe(eventStream.mapSync(function (line) {
            callback(line);
        }));
    });
}
exports.default = readLines;
//# sourceMappingURL=readLines.js.map