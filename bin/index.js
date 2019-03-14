#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Cesium = require('cesium');
const proj4 = require("proj4");
const yargs = require("yargs");
const fsExtra = require("fs-extra");
const readLines_1 = require("./readLines");
const Cartesian3 = Cesium.Cartesian3;
const Cartographic = Cesium.Cartographic;
const CesiumMath = Cesium.Math;
const Ellipsoid = Cesium.Ellipsoid;
const argv = yargs
    .option('sourceFile', {
    demandOption: true,
    describe: 'The source OBJ file to transform',
    type: 'string'
})
    .option('targetFile', {
    demandOption: true,
    describe: 'The path and filename of the output OBJ file',
    type: 'string'
})
    .option('sourceProjection', {
    demandOption: true,
    describe: 'The projection of the source OBJ file.  This can be any PROJ4 string or "ECEF" for Earth-centered, Earth-fixed Cartesian coordinates.',
    type: 'string'
})
    .option('targetProjection', {
    demandOption: true,
    default: 'WGS84',
    describe: 'The projection of the source OBJ file.  This can be any PROJ4 string, "ECEF" for Earth-centered, Earth-fixed Cartesian coordinates, or "ENU" for a local east-north-up coordinate system centered at the first vertex.',
    type: 'string'
})
    .argv;
const sourceProjection = argv.sourceProjection === 'ECEF' || argv.sourceProjection === 'ENU' ? 'WGS84' : argv.sourceProjection;
const targetProjection = argv.targetProjection === 'ECEF' || argv.targetProjection === 'ENU' ? 'WGS84' : argv.targetProjection;
console.log('Source: ' + sourceProjection);
console.log('Target: ' + targetProjection);
const conversion = proj4(sourceProjection, targetProjection);
const cartesian3Scratch = new Cartesian3();
const cartographicScratch = new Cartographic();
const vertexPattern = /v( +[\d|\.|\+|\-|e|E]+)( +[\d|\.|\+|\-|e|E]+)( +[\d|\.|\+|\-|e|E]+)/;
let center;
let transform;
const out = fsExtra.openSync(argv.targetFile, 'w');
readLines_1.default(argv.sourceFile, function (line) {
    const result = vertexPattern.exec(line);
    if (result !== null) {
        const coordinates = [parseFloat(result[1]), parseFloat(result[2]), parseFloat(result[3])];
        if (argv.sourceProjection === 'ECEF') {
            const cartesian = Cartesian3.fromArray(coordinates, 0, cartesian3Scratch);
            const cartographic = Ellipsoid.WGS84.cartesianToCartographic(cartesian, cartographicScratch);
            coordinates[0] = CesiumMath.toDegrees(cartographic.longitude);
            coordinates[1] = CesiumMath.toDegrees(cartographic.latitude);
            coordinates[2] = cartographic.height;
        }
        const converted = conversion.forward(coordinates);
        if (converted[2] === undefined) {
            converted[2] = coordinates[2];
        }
        if (argv.targetProjection === 'ECEF') {
            // TODO: height is almost certainly referenced to mean sea level, not the WGS84 ellipsoid
            const cartesian = Cartesian3.fromDegrees(converted[0], converted[1], converted[2], Ellipsoid.WGS84, cartesian3Scratch);
            converted[0] = cartesian.x;
            converted[1] = cartesian.z;
            converted[2] = -cartesian.y;
        }
        else if (argv.targetProjection === 'ENU') {
            const cartesian = Cartesian3.fromDegrees(converted[0], converted[1], converted[2], Ellipsoid.WGS84, cartesian3Scratch);
            if (!center) {
                console.log(converted.join(','));
                center = Cesium.Cartesian3.clone(cartesian);
                const enuToFixed = Cesium.Transforms.eastNorthUpToFixedFrame(center);
                transform = Cesium.Matrix4.inverseTransformation(enuToFixed, new Cesium.Matrix4());
            }
            Cesium.Matrix4.multiplyByPoint(transform, cartesian, cartesian);
            converted[0] = cartesian.x;
            converted[1] = cartesian.y;
            converted[2] = cartesian.z;
            // converted[0] = cartesian.x;
            // converted[1] = cartesian.z;
            // converted[2] = -cartesian.y;
        }
        line = 'v ' + converted.join(' ');
    }
    fsExtra.writeSync(out, line + '\n');
});
//# sourceMappingURL=index.js.map