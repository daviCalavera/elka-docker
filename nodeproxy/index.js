const Promise = require('bluebird')
const rp = require('request-promise')
const apmOps = {
  // Only activate the agent if it's running in production
  //active: process.env.NODE_ENV === 'production'
  // Set required service name (allowed characters: a-z, A-Z, 0-9, -, _, and space)
  serviceName: process.env.SERVICE_NAME || 'local-service',
  // Use if APM Server requires a token
  secretToken: '',
  // Set custom APM Server URL (default: http://localhost:8200)
  serverUrl: process.env.APM_SERVER_URL || '',
  logLevel: 'debug'
}
const apm = require('elastic-apm-node').start(apmOps)

const express = require('express')
const app = express()

console.log("APM started: ", apmOps)

const TRACE_HEADERS_TO_PROPAGATE = [
    //'X-Ot-Span-Context',
    //'X-Request-Id',

    // Zipkin headers
    //'X-B3-TraceId',
    //'X-B3-SpanId',
    //'X-B3-ParentSpanId',
    //'X-B3-Sampled',
    //'X-B3-Flags'
]

function fowardTo(req, res, next)  {
  if(!process.env.FOWARD_TO) {
    return next();
  }

  const fowardToURL = process.env.FOWARD_TO;
  let headers = {};

  TRACE_HEADERS_TO_PROPAGATE.forEach(h => {
    headers[h] = req.headers[h];
  })

  if (req.params[0]) {
    const route = fowardToURL.substr(fowardToURL.lastIndexOf('/') + 1);

    if (req.params[0] === route) {

      rp({
        uri: process.env.FOWARD_TO,
        headers
      })
      .then( res.send.bind(res) )
      .catch( res.send.bind(res) );
    }

    var error = new Error('Not Implemented!');
    apm.captureError(error, {
      user : {
        id: 'id_user',
        username: 'foo',
        email: 'foo@user.com'
      }
    });

    throw error;
  }


}

app.get('/envs', (req, res) => res.send(process.env))
app.get('/service/*', fowardTo, (req, res) => res.send(req.headers))
app.get('/error', (req, res) => {
  res.status(500).send('Se rompió!')
})
app.get('/*', (req, res) => res.send(req.path))

// add Elastic APM in the bottom of the middleware stack
app.use(apm.middleware.connect())

app.listen(process.env.PORT || 3000, () => console.log('Example app listening on port 3000!'))
