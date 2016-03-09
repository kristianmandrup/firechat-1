// Firechat External Methods
// --------------
class FirechatApi {
    // Initialize the library and setup data listeners.
    setUser(userId, userName, callback) {
        var this = this;

        this._firebase.onAuth((authData) => {

            if (authData) {
                this._userId = userId.toString();
                root._userId = userId.toString();

                this._userName = userName.toString();
                this._userRef = this._firebase.child('users').child(this._userId);
                this._loadUserMetadata(() => {
                    root.setTimeout(() => {
                        callback(this._user);
                        this._setupDataEvents();
                    }, 0);
                });
                this._getMutedUsers(this._userId);
            } else {
                this.warn('Firechat requires an authenticated Firebase reference. Pass an authenticated reference before loading.');
            }

        });
    }


    setInvitedUser(userId) {
        this._firebase.child('users').child(userId).on('value', (data) => {
            var s = data.val();
            if (s === null) {
                this._firebase.child('users').update({
                    userId: {
                        'id': userId
                    }
                });
            }
        });
    }


    // Resumes the previous session by automatically entering rooms.
    resumeSession(chatroom) {
        this._userRef.child('rooms').once('value', (snapshot) => {
            var rooms = snapshot.val();
            for (var roomId in rooms) {
                if (rooms[roomId].type === 'private') {
                    this.enterRoom(rooms[roomId].id);
                }

            }
        }, /* onError */ function() {}, /* context */ this);
    }


    removeSessions(callback) {
        this._userRef.child('rooms').once('value', (snapshot) => {
            var rooms = snapshot.val();
            for (var roomId in rooms) {
                if (rooms[roomId].name === 'Private Chat') {
                    this.leaveRoom(rooms[roomId].id, false);
                }
            }
        }, /* onError */ function() {}, /* context */ this);

        callback();
    }


    // Callback registration. Supports each of the following events:
    on(eventType, cb) {
        this._addEventCallback(eventType, cb);
    }


    // Create and automatically enter a new chat room.
    createRoom(roomName, roomType, callback) {
        var newRoomRef = this._roomRef.push();
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
        newRoomRef.set(newRoom, (error) => {
            if (!error) {
                this.enterRoom(newRoomRef.key());
            }
            if (callback) {
                callback(newRoomRef.key());
            }
        });
    }

    // Enter a chat room.
    enterRoom(roomId) {
        this.getRoom(roomId, (room) => {
            var roomName = room.name;
            var type = room.type;

            if (!roomId || !roomName) return;

            // Skip if we're already in this room.
            if (this._rooms[roomId]) {
                return;
            }

            this._rooms[roomId] = true;

            if (this._user) {
                // Save entering this room to resume the session again later.
                this._userRef.child('rooms').child(roomId).set({
                    id: roomId,
                    name: roomName,
                    active: true,
                    type: type
                });


                // Set presence bit for the room and queue it for removal on disconnect.
                var presenceRef = this._firebase.child('room-users').child(roomId).child(this._userId).child(this._sessionId);
                this._queuePresenceOperation(presenceRef, {
                    id: this._userId,
                    name: this._userName
                }, null);
            }

            // Invoke our callbacks before we start listening for new messages.
            this._onEnterRoom({
                id: roomId,
                name: roomName
            });

            // Setup message listeners
            this._roomRef.child(roomId).once('value', (snapshot) => {
                this._messageRef.child(roomId).limitToLast(this._options.numMaxMessages).on('child_added', (snapshot) => {
                    this._onNewMessage(roomId, snapshot);
                }, /* onCancel */ function() {
                    // Turns out we don't have permission to access these messages.
                    this.leaveRoom(roomId, false);
                }, /* context */ this);

                this._messageRef.child(roomId).limitToLast(this._options.numMaxMessages).on('child_removed', (snapshot) => {
                    this._onRemoveMessage(roomId, snapshot);
                }, /* onCancel */ () => {}, /* context */ this);
            }, /* onFailure */ () => {}, this);
        });
    };

    // Leave a chat room.
    leaveRoom(roomId, closebutton) {
        var userRoomRef = this._firebase.child('room-users').child(roomId);

        // Remove listener for new messages to this room.
        this._messageRef.child(roomId).off();
        if (closebutton) {
            if (this._user) {
                var presenceRef = userRoomRef.child(this._userId).child(this._sessionId);
                // Remove presence bit for the room and cancel on-disconnect removal.
                this._removePresenceOperation(presenceRef.toString(), null);
                // Remove session bit for the room.
                this._userRef.child('rooms').child(roomId).remove();
            }


            this._firebase.child('room-users').child(roomId).on('value', function(data) {
                if (data.val()) {
                    console.log("Room still there");
                }
            });
        }

        delete this._rooms[roomId];

        // Invoke event callbacks for the room-exit event.
        this._onLeaveRoom(roomId);
    };

    sendMessage(roomId, messageContent, messageType, cb) {
        var message = {
            userId: this._userId,
            name: this._userName,
            timestamp: Firebase.ServerValue.TIMESTAMP,
            message: messageContent,
            type: messageType || 'default'
        },
        newMessageRef;

        if (!this._user) {
            this._onAuthRequired();
            if (cb) {
                cb(new Error('Not authenticated or user not set!'));
            }
            return;
        }

        newMessageRef = this._messageRef.child(roomId).push();
        newMessageRef.setWithPriority(message, Firebase.ServerValue.TIMESTAMP, cb);
    };

    deleteMessage(roomId, messageId, cb) {
        this._messageRef.child(roomId).child(messageId).remove(cb);
    };

    // Mute or unmute a given user by id. This list will be stored internally and
    // all messages from the muted clients will be filtered client-side after
    // receipt of each new message.
    toggleUserMute(userId, name, cb) {
        if (!this._user) {
            this._onAuthRequired();
            if (cb) {
                cb(new Error('Not authenticated or user not set!'));
            }
            return;
        }


        this._userRef.child('muted').child(userId).child(userId).transaction(function(isMuted) {
            return (isMuted) ? null : true;
        }, cb);
        this._userRef.child('muted').child(userId).update({
            username: name
        });
    };

    removeMutedUsers(id) {
        this._userRef.child('muted').child(id).remove();
    };


    // Send a moderator notification to a specific user.
    sendSuperuserNotification(userId, notificationType, data, cb) {
        var userNotificationsRef = this._firebase.child('users').child(userId).child('notifications');

        userNotificationsRef.push({
            fromUserId: this._userId,
            timestamp: Firebase.ServerValue.TIMESTAMP,
            notificationType: notificationType,
            data: data || {}
        }, cb);
    };

    // Warn a user for violating the terms of service or being abusive.
    warnUser(userId) {
        this.sendSuperuserNotification(userId, 'warning');
    };

    // Suspend a user by putting the user into read-only mode for a period.
    suspendUser(userId, timeLengthSeconds, cb) {
        var suspendedUntil = new Date().getTime() + 1000 * timeLengthSeconds;

        this._suspensionsRef.child(userId).set(suspendedUntil, (error) => {
            if (error && cb) {
                return cb(error);
            } else {
                this.sendSuperuserNotification(userId, 'suspension', {
                    suspendedUntil: suspendedUntil
                });
                return cb(null);
            }
        });
    };



    // Invite a user to a specific chat room.
    inviteUser(userId, roomId, username, location, tHandle, atk, ats, message) {
        var present = false;

        var sendInvite = () => {
            this._firebase.child('users').child(userId).update({
                "id": userId,
                "name": username
            });
            var inviteRef = this._firebase.child('users').child(userId).child('invites').push();
            inviteRef.set({
                id: inviteRef.key(),
                fromUserId: this._userId,
                fromUserName: this._userName,
                roomId: roomId
            });
            // Handle listen unauth / failure in case we're kicked.
            inviteRef.on('value', this._onFirechatInviteResponse, () => {}, this);
        }

        if (!this._user) {
            this._onAuthRequired();
            return;
        }

        this._firebase.child('users').child(userId).child('invites').on("value", (val) => {
            var obj = val.val();
            for (var v in obj) {
                if (obj[v].fromUserId === this._userId) {
                    console.log(true);
                    present = true;
                    break;
                }
            }

            if (present !== true) {
                present = false;
                if (Session.get("tweet") === "true") {
                    makeCall('invitationForTweet', location, tHandle, atk, ats, message, (err, response) => {
                        console.log('invitationForTweet');
                        //console.log(response);
                    });
                }

                this.getRoom(roomId, (room) => {
                    if (room.type === 'private') {
                        var authorizedUserRef = this._roomRef.child(roomId).child('authorizedUsers');
                        authorizedUserRef.child(userId).set(true, (error) => {
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
        this._userRef.child('invites').child(inviteId).once('value', (snapshot) => {
            var invite = snapshot.val();
            if (invite === null && cb) {
                return cb(new Error('acceptInvite(' + inviteId + '): invalid invite id'));
            } else {
                this.enterRoom(invite.roomId);
                this._userRef.child('invites').child(inviteId).update({
                    'status': 'accepted',
                    'toUserName': this._userName
                }, cb);
            }
        });
    };

    declineInvite(inviteId, cb) {
        updates = {
            'status': 'declined',
            'toUserName': this._userName
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
            query = this._firebase.child('room-users').child(roomId),
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