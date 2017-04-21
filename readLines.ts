import * as eventStream from 'event-stream';
import * as fsExtra from 'fs-extra';

/**
 * Read a file line-by-line.
 *
 * @param {String} path Path to the file.
 * @param {Function} callback Function to call when reading each line.
 * @returns {Promise} A promise when the reader is finished.
 *
 * @private
 */
export default function readLines(path: string, callback: (line: string) => any) {
    return new Promise(function(resolve, reject) {
        fsExtra.createReadStream(path)
            .on('error', reject)
            .on('end', resolve)
            .pipe(eventStream.split('\n'))
            .pipe(eventStream.mapSync(function (line: string) {
                callback(line);
            }));
    });
}
