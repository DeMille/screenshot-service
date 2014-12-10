// local
var settings = require('./settings');

//
// Phantom Obj
//
var phantom = {};

// Hold onto the phantom process so we can come back to it
phantom.process = null;

phantom.takeScreenshot = function(url, callback) {
    // make new page
    var page = phantom.process.createPage();

    page.run(url, settings, renderURL)
        .catch(function(err) {
            page.dispose();
            callback(err);
        })
        .then(function(result) {
            page.dispose();
            callback(null, result);
        });
};

// Long fct. Everyting here is in the phantomjs webpage context,
// so we can't put it anywhere else
function renderURL(url, settings, resolve, reject) {

    var thisPage = this,
        hash = hashFnv32a(url),
        output = settings.imgPath + '/' + hash + '.jpg';

    // configure page
    thisPage.viewportSize = settings.viewportSize;
    thisPage.clipRect = {
        top: 0,
        left: 0,
        width:  settings.viewportSize.width,
        height: settings.viewportSize.height
    };

    // set timer for the render fct to complete
    var timer = setTimeout(function() {
        reject(new Error('timeout'));
    }, settings.timeout);

    // now open the page and render it
    thisPage.open(url, function (status) {
        if (status !== 'success') {
            clearTimeout(timer);
            return reject(new Error('load'));
        }
        thisPage.render(output);
        clearTimeout(timer);
        resolve(hash);
    });

    // Hash url to make simple, unique filenames.
    //
    // Calculate a 32 bit FNV-1a hash
    // Found here: https://gist.github.com/vaiorabbit/5657561
    // Ref.: http://isthe.com/chongo/tech/comp/fnv/
    function hashFnv32a(str) {
        var i, l, hval = 0x811c9dc5;
        for (i = 0, l = str.length; i < l; i++) {
            hval ^= str.charCodeAt(i);
            hval += (hval << 1) + (hval << 4) + (hval << 7) + (hval << 8) + (hval << 24);
        }
        return ("0000000" + (hval >>> 0).toString(16)).substr(-8);
    }
}

// Export
module.exports = phantom;