const express = require('express');
const jwt = require('jsonwebtoken');
const log = require('tracer').colorConsole();
const url = require('url');
const {SCALEDRONE_CHANNEL, SCALEDRONE_SECRET, NODE_ENV} = process.env;
const PORT = process.env.PORT || 1234;

if (!SCALEDRONE_CHANNEL) {
  log.error('Please provide a SCALEDRONE_CHANNEL environmental variable');
  process.exit();
}
if (!SCALEDRONE_SECRET) {
  log.error('Please provide a SCALEDRONE_SECRET environmental variable');
  process.exit();
}

const app = express();
app.set('view engine', 'ejs'); // EJS is used to add channelID to the html file
app.use(express.static('public'));

app.get('/', function(req, res) {
  res.render('index', {SCALEDRONE_CHANNEL});
});

app.get('/auth/:clientId', function(req, res) {
  if (hasChannelAccess(req)) {
    const payload = {
      client: req.params.clientId,
      channel: SCALEDRONE_CHANNEL,
      permissions: {
        '^feed$': {
          publish: true,
          subscribe: true,
          history: 100,
        },
      },
      exp: Date.now() + 180000 // client can use this token for 3 minutes (UTC0)
    };
    const token = jwt.sign(payload, SCALEDRONE_SECRET, {algorithm: 'HS256'});
    res.status(200).end(token);
  } else {
    res.status(403).end('Sorry! You are not allowed.');
  }
});

function hasChannelAccess(req) {
  // Your should implement your own authentication code here.
  // You could query your user from your database and see if they are allowed to
  // connect or give them user-scoped access using JWT permissions
  const referer = url.parse(req.headers.referrer || req.headers.referer);
  if (NODE_ENV === 'production') {
    return referer.host === 'www.scaledrone.com';
  } else { // local
    return referer.host === `localhost:${PORT}`;
  }
}

app.listen(PORT);
log.info(`Server is running on port ${PORT}. Visit http://localhost:${PORT}`);
