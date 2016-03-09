// Firechat is a simple, easily-extensible data layer for multi-user,
// multi-room chat, built entirely on [Firebase](https://firebase.com).
//
// The Firechat object is the primary conduit for all underlying data events.
// It exposes a number of methods for binding event listeners, creating,
// entering, or leaving chat rooms, initiating chats, sending messages,
// and moderator actions such as warning, kicking, or suspending users.
//
//     Firechat.js 0.0.0
//     https://firebase.com
//     (c) 2014 Firebase
//     License: MIT

// Setup
// --------------
(function(Firebase) {

    // Establish a reference to the `window` object, and save the previous value
    // of the `Firechat` variable.
    var root = this,
        previousFirechat = root.Firechat;

    function Firechat(firebaseRef, options) {

        // Instantiate a new connection to Firebase.
        this._firebase = firebaseRef;

        // User-specific instance variables.
        this._user = null;
        this._userId = null;
        this._userName = null;
        this._isModerator = false;
        

        // A unique id generated for each session.
        this._sessionId = null;

        // A mapping of event IDs to an array of callbacks.
        this._events = {};

        // A mapping of room IDs to a boolean indicating presence.
        this._rooms = {};

        // A mapping of operations to re-queue on disconnect.
        this._presenceBits = {};

        // Commonly-used Firebase references.
        this._userRef = null;
        this._messageRef = this._firebase.child('room-messages');
        this._roomRef = this._firebase.child('room-metadata');
        this._roomUsers = this._firebase.child('room-users');
        this._privateRoomRef = this._firebase.child('room-private-metadata');
        this._moderatorsRef = this._firebase.child('moderators');
        this._suspensionsRef = this._firebase.child('suspensions');
        this._usersOnlineRef = this._firebase.child('user-names-online');

        // Setup and establish default options.
        this._options = options || {};

        // The number of historical messages to load per room.
        this._options.numMaxMessages = this._options.numMaxMessages || 50;
    }

    // Run Firechat in *noConflict* mode, returning the `Firechat` variable to
    // its previous owner, and returning a reference to the Firechat object.
    Firechat.noConflict = function noConflict() {
        root.Firechat = previousFirechat;
        return Firechat;
    };

    // Export the Firechat object as a global.
    root.Firechat = Firechat;

}