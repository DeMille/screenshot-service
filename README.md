# Screenshot-Service

**Quickly roll you own screenshot service with [Node](http://nodejs.org/) and [PhantomJS](http://phantomjs.org/)**

~~[DEMO]()~~ (almost ready)

Screenshot-Service uses [phridge](https://github.com/peerigon/phridge) so it doesn't have to spawn up a new phantom instance everytime you need a screenshot.  It's also out of the box ready for OpenShift, which has an awesome free plan.

## Requirements
- [Node.js](http://nodejs.org/)
- imagemagick


## Install

Clone the repo and fetch dependencies (including phantomjs) with npm:

```
$ git clone git://github.com/demille/screenshot-service.git && cd screenshot-service
$ npm install
```

Screenshot-Service can be deployed on [OpenShift](https://www.openshift.com/) without any changes.  See more detailed OpenShift instructions [below](#openshift).

## How to use

Start Screenshot-Service with:

```
$ node app.js
```

Capture screenshots with GET requests (port 5050 by default):

```
GET /?url={url}&size={size}&key={key}
```

Ex:

```
GET /?url=http%3A%2F%2Fgoogle.com&size=small&key=GF4dfs64eDS

returns:

{ img: "http://yourdomain.tld/imgs/6905a773-small.jpg" }
```


Using a key is optional and not required by default. You can add your own key to provide some form of security in `config.json`.

Some sizes (small, medium, large...) are set by default. You can remove these / add your own in `config.json` as well.


## Options and Configuration

Below is the default configuration. All options can be overridden / customized by adding a `config.json` to the root of the project.

##### Viewport
```json
"viewportSize": {"width": 1024, "height": 768}
```
This is the size of the screen the PhantomJS will render.  You could make it smaller to get screenshots of responsive designs for example.

##### Screenshot Sizes
```json
"sizes": [
    {"name": "large",  "width": 500,  "height": 375},
    {"name": "medium", "width": 300,  "height": 225},
    {"name": "small",  "width": 200,  "height": 150},
    {"name": "tiny",   "width": 100,  "height": 75}
],
```
When a screenshot is requested, the viewport will be rendered, resized, and saved for every specified size. You can make your own sizes in your `config.json`. If you only want one size to be generated, add only one size to your `config.json`, it will override these default sizes.

##### Timeout
```json
"timeout": 10000
```
How long PhantomJS will wait before timing out a page render request.

##### Port
```json
"port": 5050
```
Port that Screenshot-Service listens to.

##### maxAge
```json
"maxAge": 30
```
Number of days to cache screenshots without rendering a new one.  0 for no caching.

##### imgPath
```json
"imgPath": "./imgs"
```
Path to store screenshots. Can be relative or absolute. Screenshot-Service will try to make the directory if it does not exist.

##### cachePath
```json
"cachePath": "./cache.db"
```
Path to store the cache file. Uses nedb to cache screenshot requests. Can be relative or absolute.

##### serveImgs
```json
"serveImgs": true
```
By default Screenshot-Service will serve the screenshots with node. If you want to serve them with Nginx or something else, set to false.  If set to false, the response will be of the form: `{"img": "imageName-sizeRequested.jpg" }` so you can formulate whatever URL path you want.

##### API Key
```json
"key": undefined
```
If you add an API key, it will be required to process a screenshot. Undefined by default.  You can add whatever random string you want, like: `"key": "asd45t3ASD3aaff"`.  It's just meant to add a small, inelegant layer of security.

##### CORS
```json
"cors": undefined
```
You can enable cors by setting either `"cors": true` (for all origins) or `"cors": ["whitelisted.tld", "other.tld"]` for whitelisted domains only.

**Note:** If you set both CORS and an API key, you can perform cors requests from the browser without the API key and Screenshot-Service will still try to require API key usage from other sources. This obviously isn't real security, but it might deter less motivated punks. Even with a cors "whitelist," client side access just isn't secure (without more hassle than it's worth here). Your call.


## Example Config.json
```json
{
    "key": "some-made-up-string",
    "sizes": [
        {"name": "size1", "width": 300, "height": 225},
        {"name": "size2", "width": 100, "height": 70}
    ],
    "maxAge": 0
}
```
This config (placed in the project root) forces API key usage, stops caching, and sets two sizes to use.



<a name="openshift" />
## OpenShift Installation

Screenshot-Service is configured to run on Red Hat's PaaS [OpenShift](https://www.openshift.com/) out of the box, so you can set it up there pretty quickly.

You can follow the [getting started guide](https://developers.openshift.com/en/getting-started-overview.html) to install the OpenShift command line tool (rhc) or you can do this all within the web console. Your OpenShift app will be located at \<app_name>-\<namespace>.rhcloud.com so be prepared to make up an app name and namespace during this process.

First, create the app with the rhc tool, importing this repo's codebase. <br/>
This will set up an app with 1 gear.

```
$ rhc app create <app_name> nodejs-0.10 --from-code git://github.com/demille/screenshot-service.git
```

When this completes it will show your app's git address. OpenShift runs whatever code you push to that address. If you need to get the address later you can run:

```
$ rhc show-app <app_name>
```

Your OpenShift app will now be running a clone of this repo. To make changes to the defaults, like specifying an api key or enabling cors, you need to clone whats running on OpenShift. (You won't need to change imgPath or cachePath, however).

```
$ git clone <openshift-repo>
```

Make any changes you need (like adding a `config.json`) and push the changes back. This will update & restart the app.

**A note about auto-scaling on OpenShift:**

You *could* use the `-s` flag with `rhc app create` to enable scaling, but it would break Screenshot-Service. Scaling puts your app behind HAProxy and spins up 'gears' as needed.  Screenshot-Service doesn't account for this setup right now.

Even if you only use 1 gear in scaling mode, it would still be behind HAProxy and you would need to disable/modify the health check in `haproxy.cfg` or else you would get 503 errors. (Look for the `option httpchk GET /` line if you go that route.)


## License

The MIT License (MIT)

Copyright (c) 2014 Sterling DeMille &lt;sterlingdemille@gmail.com&gt;

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
the Software, and to permit persons to whom the Software is furnished to do so,
subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.