// core
var fs = require('fs'),
    path = require('path');

// npm
var _ = require('lodash'),
    gm = require('gm'),
    cors = require('cors'),
    async = require('async'),
    validUrl = require('valid-url'),
    Datastore = require('nedb'),
    useragent = require('express-useragent');

// local
var phantom = require('./phantom'),
    settings = require('./settings');


// Configure
var corsOptions = {
    origin: function(origin, callback) {
        // CORS ok for all
        if (_.isBoolean(settings.cors) && settings.cors) {
            return callback(null, true);
        }
        // CORS by whitelist only
        if (settings.cors && !_.contains(settings.cors, origin)) {
            return callback(null, true);
        }
        // no CORS for you
        callback(null, false);
    }
};

var db = new Datastore({
    filename: settings.cachePath,
    autoload: true
});

var im = gm.subClass({imageMagick: true});

var MS_PER_DAY = 1000 * 60 * 60 * 24,
    MAX_AGE = MS_PER_DAY * settings.maxAge;


// Middleware
function checkKey(req, res, next) {
    // ghetto obscurity security!
    //
    // Without implementing something more complex, you have to choose:
    // 1- Authorizing requests with a secret API key (secure)
    // 2- Making service available to client side js (no security)
    //
    // If you choose 2, we can still try to check API keys for requests
    // originating from places other than a browser. I know, I know,
    // obviously this can be spoofed, but adding an annoying hoop might
    // prevent the less motivated from trying to use the service unauthorized.
    //
    // Here we check if cors is enabled (a sign that we want client side usage)
    // and if the request looks like if came from a browser we skip the key
    // check.
    if (settings.cors && looksLikeBrowser(req)) return next();

    if (settings.key && req.param('key') !== settings.key) {
        return res.status(403).json({error: 'denied'});
    }
    next();
}

// No way to be sure if its a browser, but we can be annoying
function looksLikeBrowser(req) {
    return !!req.get('origin') &&
           (req.useragent.isDesktop || req.useragent.isMobile);
}

function notFoundHandler(req, res, next) {
    res.status(404).send('404 Not Found');
}


// Route logic
function getScreenshot(req, res) {
    var url = req.param('url'),
        size = req.param('size'),
        urlErr = (!url || !validUrl.isWebUri(url)),
        sizeErr = (!size || !_.find(settings.sizes, {name: size}));

    if (urlErr)  return res.status(400).json({error: 'bad url'});
    if (sizeErr) return res.status(400).json({error: 'bad size'});

    var query = {
        url: url,
        time: {
            $gte: _.now() - MAX_AGE
        }
    };

    // check cache first for anything fresh enough
    db.findOne(query, function (err, doc) {
        if (err) return res.status(500).json({error: 'db error'});
        if (doc) return res.json({img: getURL(doc.img, size, req)});

        // if not in cache, need to process screenshot
        processUrl(url, function(err, doc) {
            if (err) return res.status(500).json({error: 'processing error'});
            res.json({img: getURL(doc.img, size, req)});
        });
    });
}

function processUrl(url, onComplete) {
    var imgBase;

    async.waterfall([
        function(cb) {
            phantom.takeScreenshot(url, cb);
        },
        function(base, cb) {
            imgBase = base;
            resizeImages(imgBase, cb);
        },
        function(cb) {
            // Delete viewport render after resizing
            fs.unlink(getPath(imgBase), cb);
        },
        function(cb) {
            save(url, imgBase, cb);
        }
    ], onComplete);
}

function resizeImages(imgBase, onComplete) {
    var fullsizeImg = getPath(imgBase);

    async.each(settings.sizes, function(size, callback) {
        im(fullsizeImg)
            .resize(size.width, size.height, '!')
            .write(getPath(imgBase, size.name), callback);
    }, onComplete);
}

function save(url, imgBase, onComplete) {
    db.insert({
        url: url,
        img: imgBase,
        time: _.now()
    }, onComplete);
}

// Format img names: %hash%-%size%.jpg
function getName(base, size) {
    if (!size) return base + '.jpg';
    return base + '-' + size + '.jpg';
}

// Get absolute path to image
function getPath(base, size) {
    return path.resolve(settings.imgPath, getName(base, size));
}

// If node is serving the images, return the location
// else just return the image name
function getURL(base, size, req) {
    if (!settings.serveImgs) return getName(base, size);
    return req.protocol + '://' + req.get('host') + '/imgs/' +
           getName(base, size);
}


//
// Export express routes/middleware
//
module.exports = function(app, express) {
    app.disable('x-powered-by');
    // Middleware
    app.use(cors(corsOptions));
    app.use(useragent.express());
    // Optionally serve imgs
    if (settings.serveImgs) {
        app.use('/imgs', express.static(settings.imgPath));
    }
    // Routes
    app.get('/', checkKey, getScreenshot);
    // 404
    app.use(notFoundHandler);
};