# Firechat

[![Version](https://badge.fury.io/gh/firebase%2Ffirechat.svg)](http://badge.fury.io/gh/firebase%2Ffirechat)

Firechat is a chat widget powered by [Firebase](https://www.firebase.com/?utm_source=firechat).
It is intended to serve as a concise, documented foundation for chat products built on Firebase.

It works out of the box, and can be extended.

## Refactor

This version of Firechat has undegone major refactoring/cleanup in order to make it more declarative. The code of the massive `.js` files has now been divided into logical units for a better overview. ES6 syntax is used, includding: arrow functions, classes and modules.

### chat-api.js

The external API of Firebase

`setUser(userId, userName, chatroom)`

initiate chat in a chat room

### message.js

`_onNewMessage(roomId, message)`

Receives a message and determines if it should be displayed.
If so calls `this.showMessage(roomId, message);` on .

`_onRemoveMessage(roomId, messageId)`

Removes message

`showMessage(roomId, rawMessage)`

Called by `_onNewMessage`
Handles display of message. Will first trim message (elipsis: `...`) 
and re-format it for display, such as rendering links, emoticons etc.
Adds formatted message to list of messages.
Scrolls messageList.

`removeMessage(roomId, messageId)`

Called by `_onRemoveMessage`
Removes message from room.

### rooms.js

`roomList()`

Binds room list dropdown to populate room list on-demand.

`userRoomList()`

Binds user list dropdown per room to populate user list on-demand.

Calls `this._chat.getRoomList((rooms) => {})` to get list of rooms 
which are added to `this.roomList` to be displayed.
If a room is clicked the room is entered.

`roomListing()`

Binds to room dropdown button, menu items, and *create room button*.
Handle click of the create new room prompt-button.
Handle click of the create new room button.

### tabs.js

`bindTabControls()`

on `close` tab, closes tab and leaves room.

`attachTab(roomId, roomName ,roomType)`

Gives focus to chatroom of tab. 
Sets `messages` to messages of the room id for the tab.
Configures text input to submit message on ENTER.
Highligts room in room listing.

`focusTab(roomId)`

Focus tab for selected room.

`removeTab(roomId)`

Remove tab for a given `roomId`

### user.js

`userSearch()`

Binds user search buttons, dropdowns, and input fields for searching all
active users currently in chat.

Sets up:
- `handleUserSearchSubmit(event)` 
- `userSearch(targetId, templateId, controlsId, prefix, startAt, endAt)`

This function is UGLY AS HELL!!

`userMuting()`

Binds user mute toggles and removes all messages for a given user upon mute.

`superuserUIEvents()`

Binds a custom context menu to messages for superusers to warn or ban
users for violating terms of service.
See `context-menu.js`

### context-menu.js

`show(event)`

Shows the context menu for the message in the current room.

`_configureEvents()`

Configures events on Context menu, ie. actions that can be performed on any message in the list.

- `close` (menu)
- `resend-message`
- `delete-message`

Warnings

- `user-warn`
- `user-suspend-hour`
- `user-suspend-day`

### prompt.js

`promptCreateRoom()`

Prompts user to create room. Sets user as moderator.
Sets up events on Dialog:
- `submit` button: creates the room
- room name field `enter`: creates private room
- `close`

`promptLoginRequired()`

Prompts user to login

`promptInvite()`

Launch a prompt to allow the user to Add user handle.

`prompt(title, content)`

Inner method to launch a prompt given a specific title and content.

### chat-event-manager.js

`_onUpdateUser(user)`

Update our interface to reflect which users are muted or not.
Ensure that all messages from muted users are removed.

`_onEnterRoom(room)`

Creates a tab for the room.

`_onLeaveRoom(roomId)`

Removes tab.

`_onChatInvite(invitation)`

Displays a Invitation prompt to enter a conversation (chat room).
- `accept` : `_chat.acceptInvite(invitation.id)`
- `decline`, `close` : `_chat.declineInvite(invitation.id)`



`_onChatInviteResponse(invitation)`

Handles invite response.
`accept` makes the user accepting the invite enter that room.
In any case a accept/decline status message is displayed.

`_onNotification(notification)`

Events related to admin or moderator notifications.
- `warning` : alert prompt with suspension warning
- `suspension` : alert prompt that you are being suspended with a count down of time remaining


### invite.js

handles invitations as well as room creation and entering.

`renderInvitePrompt(event)`

Prompts user for accepting chat room invitation. 
On `accept` calls `chat.inviteUser(userId, roomId, room.name)`

`renderPrivateInvitePrompt(event)`

Same as general invite prompt but for private rooms only.
Currently you can only have 3 chat tabs open. Then it will ask you if you
want to stop for more invites.

`renderInviteUserPrompt()`

Prompts to add people to group and also asks for and handles Twitter tweet permissions.



## Live Demo

Visit [firechat.firebaseapp.com](https://firechat.firebaseapp.com/) to see a live demo of Firechat.

[![A screenshot of Jenny and Lexi the cat chatting on the Firechat demo](screenshot.png)](https://firechat.firebaseapp.com/)

## Setup

Firechat uses [Firebase](https://www.firebase.com/?utm_source=firechat) as a backend, so it requires no server-side
code. It can be added to any web app by including a few JavaScript files

```HTML
<!-- jQuery -->
<script src='https://cdnjs.cloudflare.com/ajax/libs/jquery/2.1.1/jquery.min.js'></script>

<!-- Firebase -->
<script src='https://cdn.firebase.com/js/client/2.1.0/firebase.js'></script>

<!-- Firechat -->
<link rel='stylesheet' href='https://cdn.firebase.com/libs/firechat/2.0.1/firechat.min.css' />
<script src='https://cdn.firebase.com/libs/firechat/2.0.1/firechat.min.js'></script>
```

giving your users a way to authenticate

```HTML
<script>
// Create a new Firebase reference, and a new instance of the Login client
var chatRef = new Firebase('https://<YOUR-FIREBASE>.firebaseio.com/chat');

function login() {
  chatRef.authWithOAuthPopup("twitter", function(error, authData) {
    if (error) {
      console.log(error);
    }
  });
}

chatRef.onAuth(function(authData) {
  // Once authenticated, instantiate Firechat with our user id and user name
  if (authData) {
    initChat(authData);
  }
});
</script>

<a href='#' onclick='login();'>Login with Twitter</a>
```
    
and initializing the chat.

```HTML
<script>
function initChat(authData) {
  var chat = new FirechatUI(chatRef, document.getElementById('firechat-wrapper'));
  chat.setUser(authData.uid, authData[authData.provider].displayName);
}
</script>

<div id='firechat-wrapper'></div>
```

For detailed integration instructions, see the [Firechat documentation](https://firechat.firebaseapp.com/docs/).

## Getting Started with Firebase

Firechat requires Firebase in order to store data. You can
[sign up here](https://www.firebase.com/signup/?utm_source=firechat) for a free account.

## Getting Help

If you have a question about Firechat, search the 
[Firebase tag on Stack Overflow](http://stackoverflow.com/questions/tagged/firebase) to see if it has already been 
answered. If it hasn't been asked, post a [new question](http://stackoverflow.com/questions/ask?tags=firebase+firechat). 
We keep a close eye on those tags, and will answer your question soon.

