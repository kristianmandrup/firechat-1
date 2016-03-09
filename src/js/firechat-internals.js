// Firechat Internal Methods
class Firechat {
    // Load the initial metadata for the user's account and set initial state.
    _loadUserMetadata(onComplete) {
        // Update the user record with a default name on user's first visit.
        this._userRef.transaction((current) => {
            if (!current || !current.id || !current.name) {
                return {
                    id: self._userId,
                    name: self._userName
                };
            }
        }, (error, committed, snapshot) => {
            self._user = snapshot.val();
            self._moderatorsRef.child(self._userId).once('value', (snapshot) => {
                self._isModerator = !!snapshot.val();
                root.setTimeout(onComplete, 0);
            });
        });
    }

    // Initialize Firebase listeners and callbacks for the supported bindings.
    _setupDataEvents() {
        // Monitor connection state so we can requeue disconnect operations if need be.
        this._firebase.root().child('.info/connected').on('value', (snapshot) => {
            if (snapshot.val() === true) {
                // We're connected (or reconnected)! Set up our presence state.
                for (var i = 0; i < this._presenceBits; i++) {
                    var op = this._presenceBits[i],
                        ref = this._firebase.root().child(op.ref);

                    ref.onDisconnect().set(op.offlineValue);
                    ref.set(op.onlineValue);
                }
            }
        }, this);

        // Generate a unique session id for the visit.
        var sessionRef = this._userRef.child('sessions').push();
        this._sessionId = sessionRef.key();
        this._queuePresenceOperation(sessionRef, true, null);

        // Register our username in the public user listing.
        var usernameRef = this._usersOnlineRef.child(this._userName.toLowerCase());
        var usernameSessionRef = usernameRef.child(this._sessionId);
        this._queuePresenceOperation(usernameSessionRef, {
            id: this._userId,
            name: this._userName
        }, null);

        // Listen for state changes for the given user.
        this._userRef.on('value', this._onUpdateUser, this);

        // Listen for chat invitations from other users.
        this._userRef.child('invites').on('child_added', this._onFirechatInvite, this);

        // Listen for messages from moderators and adminstrators.
        this._userRef.child('notifications').on('child_added', this._onNotification, this);
    }

    // Append the new callback to our list of event handlers.
    _addEventCallback(eventId, callback) {
        this._events[eventId] = this._events[eventId] || [];
        this._events[eventId].push(callback);
    }

    // Retrieve the list of event handlers for a given event id.
    _getEventCallbacks(eventId) {
        if (this._events.hasOwnProperty(eventId)) {
            return this._events[eventId];
        }
        return [];
    }

    // Invoke each of the event handlers for a given event id with specified data.
    _invokeEventCallbacks(eventId) {
        var args = [],
            callbacks = this._getEventCallbacks(eventId);

        Array.prototype.push.apply(args, arguments);
        args = args.slice(1);

        for (var i = 0; i < callbacks.length; i += 1) {
            callbacks[i].apply(null, args);
        }
    }

    // Keep track of on-disconnect events so they can be requeued if we disconnect the reconnect.
    _queuePresenceOperation(ref, onlineValue, offlineValue) {
        ref.onDisconnect().set(offlineValue);
        ref.set(onlineValue);
        this._presenceBits[ref.toString()] = {
            ref: ref,
            onlineValue: onlineValue,
            offlineValue: offlineValue
        };
    }

    // Remove an on-disconnect event from firing upon future disconnect and reconnect.
    _removePresenceOperation(path, value) {
        var ref = new Firebase(path);
        ref.onDisconnect().cancel();
        ref.set(value);
        delete this._presenceBits[path];
    }

    // Event to monitor current user state.
    _onUpdateUser(snapshot) {
        this._user = snapshot.val();
        this._invokeEventCallbacks('user-update', this._user);
    }

    // Event to monitor current auth + user state.
    _onAuthRequired() {
        this._invokeEventCallbacks('auth-required');
    }

    // Events to monitor room entry / exit and messages additional / removal.
    _onEnterRoom(room) {
        this._invokeEventCallbacks('room-enter', room);
    }

    _onNewMessage(roomId, snapshot) {
        var message = snapshot.val();
        message.id = snapshot.key();
        this._invokeEventCallbacks('message-add', roomId, message);
    }

    _onRemoveMessage(roomId, snapshot) {
        var messageId = snapshot.key();
        this._invokeEventCallbacks('message-remove', roomId, messageId);
    }

    _onLeaveRoom(roomId) {
        this._invokeEventCallbacks('room-exit', roomId);
    }

    // Event to listen for notifications from administrators and moderators.
    _onNotification(snapshot) {
        var notification = snapshot.val();
        if (!notification.read) {
            if (notification.notificationType !== 'suspension' || notification.data.suspendedUntil < new Date().getTime()) {
                snapshot.ref().child('read').set(true);
            }
            this._invokeEventCallbacks('notification', notification);
        }
    }

    // Events to monitor chat invitations and invitation replies.
    _onFirechatInvite(snapshot) {
        var invite = snapshot.val();

        // Skip invites we've already responded to.
        if (invite.status) {
            return;
        }

        invite.id = invite.id || snapshot.key();
        self.getRoom(invite.roomId, function(room) {
            invite.toRoomName = room.name;
            self._invokeEventCallbacks('room-invite', invite);
        });
    }

    _onFirechatInviteResponse(snapshot) {
        var invite = snapshot.val();

        invite.id = invite.id || snapshot.key();
        this._invokeEventCallbacks('room-invite-response', invite);
    }

    _getMutedUsers(id) {
      var self = this;
      self._firebase.child('users').child(id).child('muted').on("value", (val) => {
        var obj = val.val();
        var list = [];

        for (var v in obj) {
            var item = listItem(v, obj[v].username, 'Unmute');

            list.push(item);
        }
        root._mutedUsers = list;
    }
}