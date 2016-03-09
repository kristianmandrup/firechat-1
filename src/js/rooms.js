class Rooms {
    /**
     * Binds user list dropdown per room to populate user list on-demand.
     */
    userRoomList() {
        // Upon click of the dropdown, autofocus the input field and trigger list population.
        onClick('firechat-user-room-list-btn', (event) => {
            roomId = getData('room-id'),
            targetId = $this.data('target'),
            target = $('#' + targetId);

            $target.empty();
            this._chat.getUsersByRoom(roomId, (users) => {
                for (var username in users) {
                    user = users[username];
                    user.disableActions = (!this._user || user.id === this._user.id);
                    user.nameTrimmed = this.trimWithEllipsis(user.name, this.maxLengthUsernameDisplay);
                    user.isMuted = (this._user && this._user.muted && this._user.muted[user.id]);
                    target.append(item(user)));
                }
                utils.sortListLexicographically(targetId);
            });
        });
    }

    /**
     * Binds room list dropdown to populate room list on-demand.
     */
    roomList() {
        onClick('firechat-btn-rooms'), (room) => {
            if (room.isOpen)
                return;

            selectRoomListItem = () => {
                var parent = parent(),
                    roomId = parent.data('room-id'),
                    roomName = parent.data('room-name');

                if (this.messages[roomId]) {
                    this.focusTab(roomId);
                } else {
                    this._chat.enterRoom(roomId, roomName);
                }
                return false;
            };

            this._chat.getRoomList((rooms) => {
                this.roomList.empty();
                for (var roomId in rooms) {
                    var room = rooms[roomId];
                    if (room.type != 'public') continue;
                    room.isRoomOpen = !!this.messages[room.id];
                    var roomItem = getItem(room);
                    roomItem.children('a').bind('click', selectRoomListItem);
                    this.roomList.append(roomItem.toggle(true));
                }
            });
        });
    }
}
