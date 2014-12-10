// core
var fs = require('fs'),
    path = require('path');

// npm
var _ = require('lodash'),
    mkdirp = require('mkdirp');

var defaults = {
    viewportSize: {width: 1024, height: 768},
    sizes: [
        {name: 'large',  width: 500,  height: 375},
        {name: 'medium', width: 300,  height: 225},
        {name: 'small',  width: 200,  height: 150},
        {name: 'tiny',   width: 100,  height: 75}
    ],
    timeout: 10000,
    port: 5050,
    maxAge: 30,
    imgPath: './imgs',
    serveImgs: true,
    cachePath: './cache.db'
};

var configPath = path.resolve('./config.json'),
    config = (fs.existsSync(configPath)) ? require(configPath) : {},
    settings = _.defaults(config, defaults);

// If using OpenShift, use the dir they give write access to
var openshiftDir = process.env.OPENSHIFT_DATA_DIR;
if (openshiftDir) {
    settings.imgPath = path.resolve(openshiftDir, settings.imgPath);
    settings.cachePath = path.resolve(openshiftDir, settings.cachePath);
}

// Make a home for images (if doesn't exist)
mkdirp(path.resolve(settings.imgPath), function(err) {
    if (err) {
        console.error('Error making img dir: ', err);
        process.exit(1);
    }
});

module.exports = settings;