// CHANNEL_ID is defined in the index.ejs file
const drone = new Scaledrone(CHANNEL_ID);

drone.on('open', error => {
  if (error) {
    return console.error(error);
  }
  fetch('auth/' + drone.clientId)
    .then(response => response.text())
    .then(jwt => drone.authenticate(jwt));
});

drone.on('close', event => console.log('Connection was closed', event));
drone.on('error', error => console.error(error));

const room = drone.subscribe('feed', {
  historyCount: 100 // ask for the 100 latest messages from history
});

room.on('history_message', ({data}) => {
  console.log(data);
  addFeedItemToTop(data);
});

room.on('data', data => {
  console.log(data);
  addFeedItemToTop(data);
});

//------------- DOM STUFF

const DOM = {
  submitButton: document.querySelector('button'),
  textarea: document.querySelector('textarea'),
  feed: document.querySelector('.feed'),
};

DOM.submitButton.addEventListener('click', sendMessage);

function sendMessage() {
  const value = DOM.textarea.value;
  if (!value) {
    return;
  }
  drone.publish({
    room: 'feed',
    message: {
      feedMessage: value,
      color: generateRandomColorHex(),
    },
  });
  DOM.textarea.value = '';
}

function addFeedItemToTop(item) {
  DOM.feed.insertBefore(createFeedItem(item), DOM.feed.firstChild);
}

function createFeedItem(item) {
  const {feedMessage, color} = item;
  const el = document.createElement('div');
  el.appendChild(document.createTextNode(feedMessage));
  el.className = 'feed-item';
  el.style.borderBottomColor = color;
  return el;
}

function generateRandomColorHex() {
  return '#' + Math.floor(Math.random() * 0xFFFFFF).toString(16);
}
