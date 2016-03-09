# Firechat

[![Version](https://badge.fury.io/gh/firebase%2Ffirechat.svg)](http://badge.fury.io/gh/firebase%2Ffirechat)

Firechat is a chat widget powered by [Firebase](https://www.firebase.com/?utm_source=firechat).
It is intended to serve as a concise, documented foundation for chat products built on Firebase.

## [API overview](https://firechat.firebaseapp.com/docs/#api)

*Event types*

- `user-update` user's metadata changes.
- `room-enter` user successfully enters a room.
- `room-exit` user exists a room.
- `message-add` new message is received.
- `message-remove` message is deleted.
- `room-invite` new room invite is received.
- `room-invite-response` response to invite is received.

## [firebase data structure](https://firechat.firebaseapp.com/docs/#data_structure)

*Collections*

- moderators
- room-messages
- room-metadata
- room-users
- user-names-online
- users

## Refactor

This version of Firechat has undegone major refactoring/cleanup in order to make it more declarative and remove dependencies and loads of ugly hard-coded duplication. It is a WIP.

The code of the orginal "massive/bloated" `.js` files have been divided into logical units for a better undrstanding/overview. ES6 syntax is now used, includding: arrow functions, classes (and soon modules ...).

This version is NOT intended to work!

We have decoupled this chat lib from any reference to View specific libraries or render targets such as jQuery and the browser DOM. By doing this, it should be much easier to understand the basic idea/functionality of the code and port it for whatever platform/environment that suits you.

We plan to pluck pieces of this infrastructure for React Native or a similar platform. You can do the same!

Good luck :)

### firechat.js

`Firechat(firebaseRef, options)`

Creates main Firechat object instance using ref to firebase.

* Instantiate a new connection to Firebase*
`_firebase = firebaseRef`

*User-specific instance variables*

`_user`
`_userId`
`_userName`
`_isModerator = false`

*Commonly-used Firebase references*

Each value references is a child node in firebase that the chat listens to.

`_userRef` : `null`
`_messageRef`: `room-messages`
`_roomRef`: `room-metadata`
`_roomUsers`: `room-users`
`_privateRoomRef`: `room-private-metadata`
`_moderatorsRef`: `moderators`
`_suspensionsRef`: `suspensions`
`_usersOnlineRef`: `user-names-online`

Unique id generated for each session.

`_sessionId`

Mapping of event IDs to an array of callbacks.

`_events = {}`

Mapping of room IDs to a boolean indicating presence.

`_rooms = {}`

Mapping of operations to re-queue on disconnect.

`_presenceBits = {}`

`_options = options || {}`

The number of historical messages to load per room.

`_options.numMaxMessages = _options.numMaxMessages || 50`

### firechat-api.js

`setUser(userId, userName, callback)`

Attempt to authenticate via `this._firebase.onAuth((authData) => { ... })`

On successful auth, configures `_userRef` to listen to the user with `userId` in `users` firebase collection.

`setInvitedUser(userId)`

Listens for any update for user with invite id, then sets current `userId` to this id (assuming invite is accepted on update).

`resumeSession(chatroom)`

Resumes the previous session by automatically entering rooms.

`removeSessions(callback)`

Kicked out of private chat for any rooms that change!?

`createRoom(roomName, roomType, callback)`

Create and automatically enter a new chat room.

`enterRoom(roomId)`

Enter a room by `roomId`. Called by `createRoom`.
- Skip if we're already in this room.
- Save entering this room to resume the session again later.
- Set presence bit for the room and queue it for removal on disconnect.

Enter room by: `_onEnterRoom(roomId, roomName)`

Sets up listeners for room:
- `_onNewMessage` or `leaveRoom` on child node added for room
- `_onRemoveMessage` on child node removed from room

`leaveRoom(roomId, closebutton)`

Remove listener for new messages to this room.

If room is closed by the user
- Remove presence bit for the room and cancel on-disconnect removal.
- Remove session bit for the room.

Calls `_onLeaveRoom(roomId)` to nofify!

`sendMessage(roomId, messageContent, messageType, cb)`

Sends a message to the given room.
If there is no user, require authentication and throw error.

Sets new message using [setWithPriority](https://www.firebase.com/docs/web/api/firebase/setwithpriority.html) and `Firebase.ServerValue.TIMESTAMP` to make sure higher timestamp has higher priority and is listed accordingly!

`deleteMessage(roomId, messageId, cb)`

Deletes a message from the room

`toggleUserMute(userId, name, cb)`

Toggles user mute status on/off.

`removeMutedUsers(id)`

Remove a muted user by Id

`sendSuperuserNotification(userId, notificationType, data, cb)`

Notify superuser with a specific message, such as a warning or suspension of a user (content violation).

`warnUser(userId)`

Warn a user for violating the terms of service or being abusive.

`suspendUser(userId, timeLengthSeconds, cb)`

Suspend a user by putting the user into read-only mode for a period.

`inviteUser(userId, roomId, username, location, tHandle, atk, ats, message)`

Invite a user to a specific chat room.
A lot of stuff here!!

`acceptInvite(inviteId, cb)`

Enter room of invite and set invite accepted in firebase (to notify the inviter).

`declineInvite(inviteId, cb)`

Set decline invite in firebase (to notify the inviter).

`getRoomList(cb)`

Get list of rooms and return snapshot of value (live reference).

`getUsersByRoom()`

Get users for each room, by a query: `_firebase.child('room-users').child(roomId)`. For each username, iterate current sessions and use the first one.

```js
for (var session in usernames[username]) {
    // Skip all other sessions for this user as we only need one.
    usernamesUnique[username] = usernames[username][session];
    break;
}
```

Return map (object) keyed by unique user names, with a session for each.

`getUsersByPrefix(prefix, startAt, endAt, limit, cb)`

Queries Firebase for users by prefix (name, lowercase) and start/end, limit range. Used to search for specific users.

*Helper methods*

`getRoom(roomId, callback)`

Get room by id and return snapshot of value (live reference).

`userIsModerator()`

Determine if current user is a moderator

`warn(msg)`

Write a warning message

### firechat-internals.js

Private (internal) methods used by `firechat-api`

### ui-chat-api.js

The external API of Firebase

`setUser(userId, userName, chatroom)`

Initialize an authenticated session with a user id and name.
This method assumes that the underlying Firebase reference has
already been authenticated.

Initiates chat by calling `_chat.setUser(userId, userName, (user) => { ... }`

`on(eventType, cb)`

Exposes internal chat bindings via this external interface.

`renderAlertPrompt(title, message)`

Given a title and message content, show an alert prompt to the user.

`toggleInputs(isEnabled)`

Toggle input fields if we want limit / unlimit input fields.

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

## firechat-ui.js

Creates UI bindings for:
- UI events
- incoming data events

Note: Also displays the chat component via `_renderLayout()`

### UI events

```js
_bindUIEvents() {
    // Chat-specific custom interactions and functionality.
    this.binder.heightChange();
    this.binder.tabControls();

    this.rooms.roomList();
    this.room.roomListing();

    this.user.userRoomList();
    this.user.userSearch();
    this.user.userMuting();
    this.invite.chatInvites();

    // Generic, non-chat-specific interactive elements.
    this._setupTabs();
    this._setupDropdowns();
    this._bindTextInputFieldLimits();
}
```

### Data events

`_bindDataEvents()`

- `user-update`: `_onUpdateUser`

Bind events for new messages, enter / leaving rooms, and user metadata.

- `room-enter`: `_onEnterRoom`
- `room-exit`: `_onLeaveRoom`
- `message-add`: `_onNewMessage`
- `message-remove`, `_onRemoveMessage`

Bind events related to chat invitations.
- `room-invite`: `_onChatInvite`
- `room-invite-response`: `_onChatInviteResponse`

Binds events related to admin or moderator notifications.
- `notification`: `_onNotification`

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

