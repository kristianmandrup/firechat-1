class Invite {
    /**
     * Binds to elements with the data-event='firechat-user-(private)-invite' and
     * handles invitations as well as room creation and entering.
     */
    chatInvites() {
        var self = this;

        var renderInvitePrompt = function(event) {
            var $this = $(this),
                userId = $this.closest('[data-user-id]').data('user-id'),
                roomId = $this.closest('[data-room-id]').data('room-id'),
                userName = $this.closest('[data-user-name]').data('user-name'),
                template = FirechatDefaultTemplates["templates/prompt-invite-private.html"],
                $prompt;

            self._chat.getRoom(roomId, function(room) {
                $prompt = self.prompt('Invite', template({
                    userName: userName,
                    roomName: room.name
                }));

                $prompt.find('a.close').click(function() {
                    $prompt.remove();
                    return false;
                });

                $prompt.find('[data-toggle=decline]').click(function() {
                    $prompt.remove();
                    return false;
                });

                $prompt.find('[data-toggle=accept]').first().click(function() {
                    $prompt.remove();
                    self._chat.inviteUser(userId, roomId, room.name);
                    return false;
                });
                return false;
            });
            return false;
        };

        var renderPrivateInvitePrompt = function(event) {
            if (tabList.length < 3) {
                    userId = getData('user-id');
                    userName = getData('user-name');

                if (userId && userName) {
                    $prompt = displayPrompt('Private Invite', {
                        userName: userName,
                        roomName: 'Private Chat'
                    }));

                    onClick('close', $prompt, () => {
                        $prompt.remove();
                    });

                    onClick('decline', () => {
                        $prompt.remove();
                    });

                    onClick('accept', () => {
                        $prompt.remove();
                        var roomName = 'Private Chat';
                        self._chat.createRoom(roomName, 'private', (roomId) => {
                            self._chat.inviteUser(userId, roomId, roomName);
                        });
                    });
                }
            } else {
                var template2 = FirechatDefaultTemplates["templates/stop-invite.html"],
                    $prompt2 = displayPrompt('Stop Invite', {});

                $prompt2.find('[data-toggle=decline]').click(function() {
                    $prompt2.remove();
                    return false;
                });
            }
        };

        function renderInviteUserPrompt() {
            roomId = getData('room-id');
            $prompt = displayPrompt('Add people to Group', {
                maxLengthRoomName: this.maxLengthRoomName
            });

            onClick('close', $prompt, () => {
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