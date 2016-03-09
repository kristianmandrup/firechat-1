// Firechat External Methods
// --------------
class FirechatApi {
    // Initialize the library and setup data listeners.
    setUser(userId, userName, callback) {
        var self = this;

        self._firebase.onAuth(function(authData) {

            if (authData) {
                self._userId = userId.toString();
                root._userId = userId.toString();

                self._userName = userName.toString();
                self._userRef = self._firebase.child('users').child(self._userId);
                self._loadUserMetadata(function() {
                    root.setTimeout(function() {
                        callback(self._user);
                        self._setupDataEvents();
                    }, 0);
                });
                self._getMutedUsers(self._userId);
            } else {
                self.warn('Firechat requires an authenticated Firebase reference. Pass an authenticated reference before loading.');
            }

        });
    };


    setInvitedUser = function(userId) {
        this._firebase.child('users').child(userId).on('value', function(data) {

            var s = data.val();
            if (s === null) {
                this._firebase.child('users').update({
                    userId: {
                        "id": userId
                    }
                });
            }


        });
    };


    // Resumes the previous session by automatically entering rooms.
    Firechat.prototype.resumeSession = function(chatroom) {
        

        this._userRef.child('rooms').once('value', function(snapshot) {
            var rooms = snapshot.val();
            for (var roomId in rooms) {
                if (rooms[roomId].type === 'private') {
                    this.enterRoom(rooms[roomId].id);
                }

            }
            
        }, /* onError */ function() {}, /* context */ this);
    };


    Firechat.prototype.removeSessions = function(callback) {
        this._userRef.child('rooms').once('value', function(snapshot) {
            var rooms = snapshot.val();
            for (var roomId in rooms) {
                if (rooms[roomId].name === 'Private Chat') {
                    this.leaveRoom(rooms[roomId].id, false);
                }
            }
        }, /* onError */ function() {}, /* context */ this);

        callback();
    };


    // Callback registration. Supports each of the following events:
    Firechat.prototype.on = function(eventType, cb) {
        this._addEventCallback(eventType, cb);
    };


    // Create and automatically enter a new chat room.
    Firechat.prototype.createRoom = function(roomName, roomType, callback) {
        var self = this,
            newRoomRef = this._roomRef.push();
        var newRoom = {
            id: newRoomRef.key(),
            name: roomName,
            type: roomType || 'public',
            createdByUserId: this._userId,
            createdAt: Firebase.ServerValue.TIMESTAMP
        };
        if (roomType === 'private') {
            newRoom.authorizedUsers = {};
            newRoom.authorizedUsers[this._userId] = true;
        }
        newRoomRef.set(newRoom, function(error) {
            if (!error) {
                self.enterRoom(newRoomRef.key());
            }
            if (callback) {
                callback(newRoomRef.key());
            }
        });
    };


    // Enter a chat room.
    Firechat.prototype.enterRoom = function(roomId) {
        var self = this;
        self.getRoom(roomId, function(room) {
            var roomName = room.name;
            var type = room.type;

            if (!roomId || !roomName) return;

            // Skip if we're already in this room.
            if (self._rooms[roomId]) {
                return;
            }

            self._rooms[roomId] = true;

            if (self._user) {
                // Save entering this room to resume the session again later.
                self._userRef.child('rooms').child(roomId).set({
                    id: roomId,
                    name: roomName,
                    active: true,
                    type: type
                });


                // Set presence bit for the room and queue it for removal on disconnect.
                var presenceRef = self._firebase.child('room-users').child(roomId).child(self._userId).child(self._sessionId);
                self._queuePresenceOperation(presenceRef, {
                    id: self._userId,
                    name: self._userName
                }, null);
            }

            // Invoke our callbacks before we start listening for new messages.
            self._onEnterRoom({
                id: roomId,
                name: roomName
            });

            // Setup message listeners
            self._roomRef.child(roomId).once('value', function(snapshot) {
                self._messageRef.child(roomId).limitToLast(self._options.numMaxMessages).on('child_added', function(snapshot) {
                    self._onNewMessage(roomId, snapshot);
                }, /* onCancel */ function() {
                    // Turns out we don't have permission to access these messages.
                    self.leaveRoom(roomId, false);
                }, /* context */ self);

                self._messageRef.child(roomId).limitToLast(self._options.numMaxMessages).on('child_removed', function(snapshot) {
                    self._onRemoveMessage(roomId, snapshot);
                }, /* onCancel */ function() {}, /* context */ self);
            }, /* onFailure */ function() {}, self);
        });
        
    };

    // Leave a chat room.
    Firechat.prototype.leaveRoom = function(roomId, closebutton) {
        var self = this,
            userRoomRef = self._firebase.child('room-users').child(roomId);

        // Remove listener for new messages to this room.
        self._messageRef.child(roomId).off();
        if (closebutton) {

            if (self._user) {
                var presenceRef = userRoomRef.child(self._userId).child(self._sessionId);
                // Remove presence bit for the room and cancel on-disconnect removal.
                self._removePresenceOperation(presenceRef.toString(), null);
                // Remove session bit for the room.
                self._userRef.child('rooms').child(roomId).remove();
            }


            self._firebase.child('room-users').child(roomId).on('value', function(data) {
                if (data.val()) {
                    console.log("Room still there");
                }
                // else
                // {  
                //    self._firebase.child('room-messages').child(roomId).remove();
                //    console.log("Room not there");
                // }

            });



        }

        delete self._rooms[roomId];

        // Invoke event callbacks for the room-exit event.
        self._onLeaveRoom(roomId);
    };

    Firechat.prototype.sendMessage = function(roomId, messageContent, messageType, cb) {
        var self = this,
            message = {
                userId: self._userId,
                name: self._userName,
                timestamp: Firebase.ServerValue.TIMESTAMP,
                message: messageContent,
                type: messageType || 'default'
            },
            newMessageRef;

        if (!self._user) {
            self._onAuthRequired();
            if (cb) {
                cb(new Error('Not authenticated or user not set!'));
            }
            return;
        }

        newMessageRef = self._messageRef.child(roomId).push();
        newMessageRef.setWithPriority(message, Firebase.ServerValue.TIMESTAMP, cb);
    };

    Firechat.prototype.deleteMessage = function(roomId, messageId, cb) {
        var self = this;

        self._messageRef.child(roomId).child(messageId).remove(cb);
    };

    // Mute or unmute a given user by id. This list will be stored internally and
    // all messages from the muted clients will be filtered client-side after
    // receipt of each new message.
    Firechat.prototype.toggleUserMute = function(userId, name, cb) {
        var self = this;

        if (!self._user) {
            self._onAuthRequired();
            if (cb) {
                cb(new Error('Not authenticated or user not set!'));
            }
            return;
        }


        self._userRef.child('muted').child(userId).child(userId).transaction(function(isMuted) {
            return (isMuted) ? null : true;
        }, cb);
        self._userRef.child('muted').child(userId).update({
            username: name
        });
    };

    Firechat.prototype.removeMutedUsers = function(id)
    {
        var self = this;
        self._userRef.child('muted').child(id).remove();
    };


    // Send a moderator notification to a specific user.
    Firechat.prototype.sendSuperuserNotification = function(userId, notificationType, data, cb) {
        var self = this,
            userNotificationsRef = self._firebase.child('users').child(userId).child('notifications');

        userNotificationsRef.push({
            fromUserId: self._userId,
            timestamp: Firebase.ServerValue.TIMESTAMP,
            notificationType: notificationType,
            data: data || {}
        }, cb);
    };

    // Warn a user for violating the terms of service or being abusive.
    Firechat.prototype.warnUser = function(userId) {
        var self = this;
        self.sendSuperuserNotification(userId, 'warning');
    };

    // Suspend a user by putting the user into read-only mode for a period.
    Firechat.prototype.suspendUser = function(userId, timeLengthSeconds, cb) {
        var self = this,
            suspendedUntil = new Date().getTime() + 1000 * timeLengthSeconds;

        self._suspensionsRef.child(userId).set(suspendedUntil, function(error) {
            if (error && cb) {
                return cb(error);
            } else {
                self.sendSuperuserNotification(userId, 'suspension', {
                    suspendedUntil: suspendedUntil
                });
                return cb(null);
            }
        });
    };



    // Invite a user to a specific chat room.
    Firechat.prototype.inviteUser = function(userId, roomId, username, location, tHandle, atk, ats, message) {
        var present = false;

        function sendInvite() {
            self._firebase.child('users').child(userId).update({
                "id": userId,
                "name": username
            });
            var inviteRef = self._firebase.child('users').child(userId).child('invites').push();
            inviteRef.set({
                id: inviteRef.key(),
                fromUserId: self._userId,
                fromUserName: self._userName,
                roomId: roomId
            });
            // Handle listen unauth / failure in case we're kicked.
            inviteRef.on('value', self._onFirechatInviteResponse, function() {}, self);
        };

        if (!self._user) {
            self._onAuthRequired();
            return;
        }

        self._firebase.child('users').child(userId).child('invites').on("value", function(val) {
            var obj = val.val();
            for (var v in obj) {
                if (obj[v].fromUserId === self._userId) {
                    console.log(true);
                    present = true;
                    break;
                }
            }

            if (present !== true) {
                present = false;
                if (Session.get("tweet") === "true") {
                    Meteor.call('invitationForTweet', location, tHandle, atk, ats, message, function(err, response) {
                        console.log('invitationForTweet');
                        //console.log(response);
                    });
                }

                self.getRoom(roomId, function(room) {
                    if (room.type === 'private') {
                        var authorizedUserRef = self._roomRef.child(roomId).child('authorizedUsers');
                        authorizedUserRef.child(userId).set(true, function(error) {
                            if (!error) {
                                sendInvite();
                            }
                        });
                    } else {
                        sendInvite();
                    }
                });
            } else {
                console.log("Invitation already sent");
            }

        });




    };

    acceptInvite(inviteId, cb) {
        self._userRef.child('invites').child(inviteId).once('value', (snapshot) => {
            var invite = snapshot.val();
            if (invite === null && cb) {
                return cb(new Error('acceptInvite(' + inviteId + '): invalid invite id'));
            } else {
                self.enterRoom(invite.roomId);
                self._userRef.child('invites').child(inviteId).update({
                    'status': 'accepted',
                    'toUserName': self._userName
                }, cb);
            }
        });
    };

    declineInvite(inviteId, cb) {
        updates = {
            'status': 'declined',
            'toUserName': self._userName
        };

        this._userRef.child('invites').child(inviteId).update(updates, cb);
    };

    getRoomList(cb) {
        this._roomRef.once('value', (snapshot) => {
            cb(snapshot.val());
        });
    };

    getUsersByRoom() {
        var roomId = arguments[0],
            query = self._firebase.child('room-users').child(roomId),
            cb = arguments[arguments.length - 1],
            limit = null;

        if (arguments.length > 2) {
            limit = arguments[1];
        }

        query = (limit) ? query.limitToLast(limit) : query;

        query.once('value', (snapshot) => {
            var usernames = snapshot.val() || {},
                usernamesUnique = {};

            for (var username in usernames) {
                for (var session in usernames[username]) {
                    // Skip all other sessions for this user as we only need one.
                    usernamesUnique[username] = usernames[username][session];
                    break;
                }
            }

            root.setTimeout(() => {
                cb(usernamesUnique);
            }, 0);
        });
    };

    getUsersByPrefix(prefix, startAt, endAt, limit, cb) {
        var query = this._usersOnlineRef,
            prefixLower = prefix.toLowerCase();

        if (startAt) {
            query = query.startAt(null, startAt);
        } else if (endAt) {
            query = query.endAt(null, endAt);
        } else {
            query = (prefixLower) ? query.startAt(null, prefixLower) : query.startAt();
        }

        query = (limit) ? query.limitToLast(limit) : query;

        query.once('value', (snapshot) => {
            var usernames = snapshot.val() || {},
                usernamesFiltered = {};

            for (var userNameKey in usernames) {
                var sessions = usernames[userNameKey],
                    userName, userId, usernameClean;

                // Grab the user data from the first registered active session.
                for (var sessionId in sessions) {
                    userName = sessions[sessionId].name;
                    userId = sessions[sessionId].id;

                    // Skip all other sessions for this user as we only need one.
                    break;
                }

                // Filter out any usernames that don't match our prefix and break.
                if ((prefix.length > 0) && (userName.toLowerCase().indexOf(prefixLower) !== 0))
                    continue;

                usernamesFiltered[userName] = {
                    name: userName,
                    id: userId
                };
            }

            root.setTimeout(function() {
                cb(usernamesFiltered);
            }, 0);
        });
    };

    // Miscellaneous helper methods.
    getRoom(roomId, callback) {
        this._roomRef.child(roomId).once('value', (snapshot) => {
            callback(snapshot.val());
        });
    }

    userIsModerator() {
        return this._isModerator;
    };

    warn(msg) {
        if (console) {
            msg = 'Firechat Warning: ' + msg;
            if (typeof console.warn === 'function') {
                console.warn(msg);
            } else if (typeof console.log === 'function') {
                console.log(msg);
            }
        }
    };
}