"use strict";

function rateControl(options) {
  if (options.constructor.name === "IncomingMessage") {
    throw new Error('Usage: "app.use(rateControl())" and not "app.use(rateControl)".');
  }
  options = options || {};
  options.onBlocked = typeof options.onBlocked === 'function' ? options.onBlocked : (_req, res) => res.sendStatus(429);
  options.requestsPerMinute = options.requestsPerMinute || 60;

  // Setup mutex
  const Mutex = require('async-mutex').Mutex;
  const mutex = new Mutex();

  // Setup DB
  const mongoose = require('mongoose');
  const requestEntrySchema = new mongoose.Schema({
    identifier: {
      type: String,
      unique: true,
      required: true
    },
    tokens: {
      type: Number,
      default: options.requestsPerMinute - 1,
      min: 0,
      required: true
    },
    timeStamps: {
      type: [Date],
      required: true,
      default: [Date.now()]
    },
  });
  requestEntrySchema.index({ createdAt: 1 }, { expireAfterSeconds: 600 });
  var requestEntry = mongoose.model('RequestEntry', requestEntrySchema);
  requestEntry.deleteMany({}, err => {
    if (err) console.error(err);
  });

  return function rateControl(req, res, next) {
    mutex.acquire().then(async function (release) {
      var ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
      var currentRequest;

      /* Search for entry */
      try {
        currentRequest = await requestEntry.findOne({ identifier: ip });
      } catch (err) {
        release();
        console.error(err);
        return res.sendStatus(500);
      }

      /* Create new entry */
      if (!currentRequest) {
        try {
          await requestEntry.create({ identifier: ip });
        } catch (err) {
          console.error(err);
          return res.sendStatus(500);
        } finally {
          release();
        }
        return next();
      }

      else {
        /* Check if first timestamp passed limit */
        if (currentRequest.timeStamps[0] < Date.now() - 60000) {
          currentRequest.timeStamps.shift();
          currentRequest.timeStamps.push(Date.now());
          await currentRequest.save();
          release();
          return next();
        }

        try {
          /* Use 1 token and add timestamp */
          currentRequest.timeStamps.push(Date.now());
          currentRequest.tokens--;
          await currentRequest.save();
        } catch (err) {
          release();
          return options.onBlocked(req, res);
        }
        release();
        next();
      }
    });
  };
}

module.exports = rateControl;