[![MIT License](https://img.shields.io/github/license/markkuhn/mongoose-express-rate-limiter.svg?style=flat-square)](https://github.com/markkuhn/mongoose-express-rate-limiter/blob/main/LICENSE)

![GitHub repo size](https://img.shields.io/github/repo-size/markkuhn/express-rate-limiter?style=flat-square)

<h3 align="center">Mongoose Express Rate Limiter</h3>
<p align="center">Express rate limiter for apps using mongoose</p>

### Installation

``` sh
npm i @markkuhn/express-rate-limiter
```

### Usage

``` js
var express = require('express');
var app = express();
var mongoose = require('mongoose');

var rateLimiter = require('@markkuhn/express-rate-limiter');

app.use(rateLimiter({
    requestsPerMinute: 100,
    identifier: function(req) {
        return req.headers['x-forwarded-to'];
    },
    onBlocked: function(req, res) {
        res.sendStatus(429);
        console.log('Too many requests');
    }
}));
```

### API options

``` js
rateLimiter(options)
```

 - `requestsPerMinute` : `Number` amount of requests allowed per minute (default: `60`).

 - `identifier` : `Function` returns an identifier for a request (default: `req.headers['x-forwarded-to'] || req.connection.remoteAddress`).

 - `onBlocked` : `Function` called when limit has been reached (default: `res.sendStatus(429)`).

[license-shield]: https://img.shields.io/github/license/markkuhn/mongoose-express-rate-limiter.svg?style=flat-square
[license-url]: https://github.com/markkuhn/mongoose-express-rate-limiter/blob/main/LICENSE
