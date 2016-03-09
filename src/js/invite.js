class Invite {
    /**
     * Binds to elements with the data-event='firechat-user-(private)-invite' and
     * handles invitations as well as room creation and entering.
     */
    chatInvites() {
        var renderInvitePrompt = (event) => {
            var userId = data('user-id'),
                roomId = data('room-id'),
                userName = data('user-name');

            this._chat.getRoom(roomId, (room) => {
                $prompt = this.prompt('Invite', {
                    userName: userName,
                    roomName: room.name
                });

                $prompt.onClick('close', () => {
                    $prompt.remove();
                });

                $prompt.onClick('decline', () => {
                    $prompt.remove();
                });

                $prompt.onClick('accept', () => {
                    $prompt.remove();
                    self._chat.inviteUser(userId, roomId, room.name);
                });
            });
        };

        var renderPrivateInvitePrompt = function(event) {
            if (tabList.length < 3) {
                    userId = data('user-id');
                    userName = data('user-name');

                if (userId && userName) {
                    $prompt = displayPrompt('Private Invite', {
                        userName: userName,
                        roomName: 'Private Chat'
                    }));

                    $prompt.onClick('close', () => {
                        $prompt.remove();
                    });

                    $prompt.onClick('decline', () => {
                        $prompt.remove();
                    });

                    $prompt.onClick('accept', () => {
                        $prompt.remove();
                        var roomName = 'Private Chat';
                        self._chat.createRoom(roomName, 'private', (roomId) => {
                            self._chat.inviteUser(userId, roomId, roomName);
                        });
                    });
                }
            } else {
                $stopPrompt = displayPrompt('Stop Invite', {});

                $stopPrompt.onClick('decline', () => {
                    $stopPrompt.remove();
                });
            }
        };

        function renderInviteUserPrompt() {
            roomId = getData('room-id');
            $prompt = displayPrompt('Add people to Group', {
                maxLengthRoomName: this.maxLengthRoomName
            });

            $prompt.onClick('close', () => {
                $prompt.remove();
                return false;
            });

            Session.set("tweet", "false");


            onClick('tweetPermission', $prompt, () => {
                if ($prompt.checked('#tweetPermission')) {
                    Session.set("tweet", "true");
                    $prompt.show('textarea');
                } else {
                    $prompt.hide('textarea');
                    Session.set("tweet", "false");
                }

            });


            onClick('accept', () => {
                $prompt.remove();

                var atk = Session.get("atk");
                var ats = Session.get("ats");
                var location = root.location.href;
                var tHandle = getValue('firechat-twitter-name');
                var message = getValue('msg textarea');

                makeCall('fireChat', tHandle, (err, response) => {
                    if (response) {
                        var userid = "twitter:".concat(response[0].id);
                        var name = response[0].name;
                        self._chat.setInvitedUser(userid);

                        self._chat.inviteUser(userid, roomId, name, location, tHandle, atk, ats, message);
                    } else {
                        console.log("twitter Handle not found");
                    }

                    console.log(response);
                });
                return false;
            });
        };

        onClick('firechat-user-chat', renderPrivateInvitePrompt);
        onClick('firechat-user-invite', renderInvitePrompt);
        onClick('firechat-invite-user', renderInviteUserPrompt);
    };
}