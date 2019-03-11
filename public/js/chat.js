//the client side is initialised and stored in a variable
const socket = io();

//Elements
const $messageForm = document.querySelector('#form1');
const $messageFormInput = $messageForm.querySelector('#inputPlace');
const $messageFormButton = $messageForm.querySelector('#submitButton');
const $sendLocationButton = document.querySelector('#send-location');
const $messages = document.querySelector('#messages');
const $sidebar = document.querySelector('#sidebar');

//Templates
const messageTemplate = document.querySelector('#message-template').innerHTML
const locationTemplate = document.querySelector('#location-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML
//Options
//directly destructuring the object that gets returned from Qs.parse, and attaining the attributes : username and room
const {username, room} = Qs.parse(location.search, { ignoreQueryPrefix : true });

const autoscroll = () => {
  //New Message Element
  const $newMessage = $messages.lastElementChild

  //Height of the new message
  const newMessageStyles = getComputedStyle($newMessage);
  const newMessageMargin = parseInt(newMessageStyles.marginBottom) + parseInt(newMessageStyles.marginTop)
  const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

  //Visible height of the whole chat
  const visibleHeight = $messages.offsetHeight

  //Actual whole height of the messages container
  const containerHeight = $messages.scrollHeight

  //How far have I scrolled?
  const scrollOffset = $messages.scrollTop + visibleHeight

  if(containerHeight - newMessageHeight <= scrollOffset){
    $messages.scrollTop = $messages.scrollHeight
  }
}
//make sure that 'countUpdated' is exactly the same name on both server(index.js) and client(chat.js) sides.
//the client receives the event 'countUpdated' here and a callback function is executed.
//the callback function receives an argument from the event that server sent, the argument can be named anything, although we give it the same name as on the server side for fluidity
// socket.on('countUpdated', (count) => {
//
//   //note that this log message prints on the console of the client, i.e., the browser. Ctrl+Shift+j shortcut for chrome.
//   //Here the server is sending information to the client(browser) in the client's console.
//   console.log('The count has been updated!', count);
// });

socket.on('Message', (message) => {
  const html = Mustache.render(messageTemplate, {
    username : message.username,
    msg : message.text,
    createdAt : moment(message.createdAt).format('h:mm a')
  });
  $messages.insertAdjacentHTML('beforeend', html); //this ensures that the newest messages are at the bottom( just before end of the $messages div)
  autoscroll()
});
// document.querySelector('#increment').addEventListener('click', () => {
//   console.log('Clicked');
//   socket.emit('increment');
// });

socket.on('locationMessage', (urlObject) => {
  const html = Mustache.render(locationTemplate, {
    username : urlObject.username,
    location : urlObject.locationURL,
    createdAt : moment(urlObject.createdAt).format('h:mm a')
  });
  $messages.insertAdjacentHTML('beforeend', html);
  autoscroll()
});

$messageForm.addEventListener('submit', (event) => {
  event.preventDefault(); //to prevent the default action of refreshing the page when the form is submitted
  $messageFormButton.setAttribute('disabled', ''); //even an empty string means that the 'disabled' attribute is turned to true. Remove the attribute to turn it false.

  var message = event.target.elements.inputmsg.value; // (event.target) refers to the form in question. (elements) refers to all the elements of that form.
                                                      // (inputmsg) is the name of the element we want to refer to in that form // (.value) extracts the value of that element

  //the socket.emit() function can have any number of arguments.
  // Just the last argument is used for acknowledgment(optional) -- in this case it is a function which is called in socket.on() on the server side.
  socket.emit('inputMessage', message, (ackMsg) => {
    console.log(ackMsg);
    $messageFormButton.removeAttribute('disabled');
    $messageFormInput.value = '';
    $messageFormInput.focus();
  });
});

$sendLocationButton.addEventListener('click', () => {
  if (!navigator.geolocation) {
    return alert('You have an obsolete browser HUMAN. I prefer Google Chrome by the way :)');
  }
  $sendLocationButton.setAttribute('disabled', '');
  //getCurrentPosition() is an asynchronous function. Once it is executed, a callback function is called.
  navigator.geolocation.getCurrentPosition((position) => {
    // console.log(position);
    var loc = {lat : position.coords.latitude, lng : position.coords.longitude};
    socket.emit('sendLocation', loc, (ackMsg) => {
      console.log(ackMsg);
      $sendLocationButton.removeAttribute('disabled');
    });
  });
});

socket.emit('joinActivity', {username, room}, (errorMsg) => {
  if(errorMsg){
    alert(errorMsg)
    location.href = '/'
  }
});

socket.on('roomData', ({ room, users }) => {
  const html = Mustache.render(sidebarTemplate, { room, users });
  $sidebar.innerHTML = html;
})
