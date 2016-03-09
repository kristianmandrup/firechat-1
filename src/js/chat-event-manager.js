class ChatEventManager {
    // set up proxies
    constructor (ctx) {
        this.ctx = ctx;
        this._user = ctx._user;
        this._chat = ctx._chat;
    }

    _onUpdateUser(user) {
        // Update our current user state and render latest user name.
        this._user = user;

        // Update our interface to reflect which users are muted or not.
        var mutedUsers = this._user.muted || {};
        getAll('firechat-user-mute-toggle').each((i, el) => {
            var userId = getData('user-id');
            toggle('muted', !!mutedUsers[userId]);
        });

        // Ensure that all messages from muted users are removed.
        for (var userId in mutedUsers) {
            find('message', userId).fadeOut();
        }
    },

    _onEnterRoom(room) {
        this._chat.getRoom(room.id, (room) => {
            this.attachTab(room.id, room.name, room.type);
        });
    },

    _onLeaveRoom(roomId) {
        this.removeTab(roomId);

        // Auto-enter rooms in the queue
        if ((this._roomQueue.length > 0)) {
            this._chat.enterRoom(this._roomQueue.shift(roomId));
        }
    },

    // Events related to chat invitations.
    _onChatInvite(invitation) {

        if (byId(invitation.id) === null) {
            var $prompt = displayPrompt('Invite', invitation);

            var element = byId("prompt-invi");
            element.set('id', invitation.id);

            // prompt event handlers!
            onClick('close', $prompt, () => {
                $prompt.remove();
                self._chat.declineInvite(invitation.id);
            });

            onClick('accept', () => {
                $prompt.remove();
                self._chat.acceptInvite(invitation.id);
            });

            onClick('decline', () => {
                $prompt.remove();
                self._chat.declineInvite(invitation.id);
            });
        }
    }

    _onChatInviteResponse(invitation) {
        if (!invitation.status) return;

        if (invitation.status && invitation.status === 'accepted') {
            $prompt = displayPrompt('Accepted', invitation);
            this._chat.getRoom(invitation.roomId, function(room) {
                self.attachTab(invitation.roomId, room.name);
            });
        } else {
            $prompt = displayPrompt('Declined', invitation);
        }

        onClick('close', $prompt, () => {
            $prompt.remove();
        });
    }

    // Events related to admin or moderator notifications.
    _onNotification(notification) {
        if (notification.notificationType === 'warning') {
            this.renderAlertPrompt('Warning', 'You are being warned for inappropriate messaging. Further violation may result in temporary or permanent ban of service.');
        } else if (notification.notificationType === 'suspension') {
            var suspendedUntil = notification.data.suspendedUntil,
                secondsLeft = Math.round((suspendedUntil - new Date().getTime()) / 1000),
                timeLeft = '';

            if (secondsLeft > 0) {
                if (secondsLeft > 2 * 3600) {
                    var hours = Math.floor(secondsLeft / 3600);
                    timeLeft = hours + ' hours, ';
                    secondsLeft -= 3600 * hours;
                }
                timeLeft += Math.floor(secondsLeft / 60) + ' minutes';
                this.renderAlertPrompt('Suspended', 'A moderator has suspended you for violating site rules. You cannot send messages for another ' + timeLeft + '.');
            }
        }
    }
}