class Binder {
    constructor() {
    }

    /**
     * Binds to height changes in the surrounding div.
     */
    heightChange() {
        var self = this,
            $el = $(this._el),
            lastHeight = null;

        setInterval(function() {
            var height = $el.height();
            if (height != lastHeight) {
                lastHeight = height;
                $('.chat').each(function(i, el) {

                });
            }
        }, 500);
    }

    /**
     * Binds user list dropdown per room to populate user list on-demand.
     */
    userRoomList() {
        // Upon click of the dropdown, autofocus the input field and trigger list population.
        $(document).delegate('[data-event="firechat-user-room-list-btn"]', 'click', (event) => {
            event.stopPropagation();

            var $this = $(this),
                roomId = $this.closest('[data-room-id]').data('room-id'),
                template = FirechatDefaultTemplates["templates/room-user-list-item.html"],
                targetId = $this.data('target'),
                $target = $('#' + targetId);

            $target.empty();
            self._chat.getUsersByRoom(roomId, function(users) {
                for (var username in users) {
                    user = users[username];
                    user.disableActions = (!self._user || user.id === self._user.id);
                    user.nameTrimmed = self.trimWithEllipsis(user.name, self.maxLengthUsernameDisplay);
                    user.isMuted = (self._user && self._user.muted && self._user.muted[user.id]);
                    $target.append($(template(user)));
                }
                self.sortListLexicographically('#' + targetId);
            });
        });
    }

    /**
     * Binds room list dropdown to populate room list on-demand.
     */
    roomList() {
        $('#firechat-btn-rooms').bind('click', () => {
            if ($(this).parent().hasClass('open')) {
                return;
            }

            var $this = $(this),
                template = FirechatDefaultTemplates["templates/room-list-item.html"],
                selectRoomListItem = function() {
                    var parent = $(this).parent(),
                        roomId = parent.data('room-id'),
                        roomName = parent.data('room-name');

                    if (self.$messages[roomId]) {
                        self.focusTab(roomId);
                    } else {
                        self._chat.enterRoom(roomId, roomName);
                    }
                    return false;
                };

            self._chat.getRoomList(function(rooms) {
                self.$roomList.empty();
                for (var roomId in rooms) {
                    var room = rooms[roomId];
                    if (room.type != "public") continue;
                    room.isRoomOpen = !!self.$messages[room.id];
                    var $roomItem = $(template(room));
                    $roomItem.children('a').bind('click', selectRoomListItem);
                    self.$roomList.append($roomItem.toggle(true));
                }
            });
        });
    };

    /**
     * Binds to any text input fields with data-provide='limit' and
     * data-counter='<selector>', and upon value change updates the selector
     * content to reflect the number of characters remaining, as the 'maxlength'
     * attribute less the current value length.
     */
    textInputFieldLimits() {
        onKeyUp('limit', (event) => {
            var $this = $(this),
                $target = $($this.data('counter')),
                limit = $this.attr('maxlength'),
                count = $this.val().length;

            $target.html(Math.max(0, limit - count));
        });
    };


    /**
     * Binds to room dropdown button, menu items, and create room button.
     */
    roomListing() {
        renderRoomList = function(event) {
            var type = get('room-type');
            self.sortListLexicographically('firechat-room-list', type);
        };

        // Handle click of the create new room prompt-button.
        onClick('createRoomPromptButton', (event) => {
            var login = Session.get('Firechat-Login');
            self.promptCreateRoom(login);
        });

        // Handle click of the create new room button.
        onClick('createRoomButton', (event) => {
            var roomName = valueOf('firechat-input-room-name');
            remove('firechat-prompt-create-room');
            this._chat.createRoom(roomName, 'private');
        });
    };

    /**
     * Binds a custom context menu to messages for superusers to warn or ban
     * users for violating terms of service.
     */
    superuserUIEvents() {
        parseMessageVars = function(event) {
            var $this = $(this),
                messageId = $this.closest('[data-message-id]').data('message-id'),
                userId = $('[data-message-id="' + messageId + '"]').closest('[data-user-id]').data('user-id'),
                roomId = $('[data-message-id="' + messageId + '"]').closest('[data-room-id]').data('room-id');

            return {
                messageId: messageId,
                userId: userId,
                roomId: roomId
            };
        },
        clearMessageContextMenus = function() {
            // Remove any context menus currently showing.
            $('[data-toggle="firechat-contextmenu"]').each(function() {
                $(this).remove();
            });

            // Remove any messages currently highlighted.
            $('#firechat .message.highlighted').each(function() {
                $(this).removeClass('highlighted');
            });
        },
    }
}
