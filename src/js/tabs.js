class Tabs {
    /**
     * Binds custom inner-tab events.
     */
    bindTabControls() {
        // Handle click of tab close button.
        onClick('firechat-close-tab', (event) => {
            var roomId = data('room-id');
            self._chat.leaveRoom(roomId, true);
        });
    };

    /**
     * Given a room id and name, attach the tab to the interface and setup events.
     *
     * @param    {string}    roomId
     * @param    {string}    roomName
     */
    attachTab(roomId, roomName ,roomType) {
        // If this tab already exists, give it focus.
        if (this.messages[roomId]) {
            this.focusTab(roomId);
            return;
        }
        var room = {
            id: roomId,
            name: roomName
        };

        // Populate and render the tab content template.
        var tabContent = get(template(room));
        var messages = get('firechat-messages', roomId);

        // Keep a reference to the message listing for later use.
        this.messages[roomId] = messages;

        // Attach on-enter event to textarea.
        var textarea = tabContent.get('textarea');
        onKeyDown('textarea', function(e) {
            var message = self.trimWithEllipsis($textarea.val(), self.maxLengthMessage);
            if ((e.ENTER) && (message !== '')) {
                $textarea.val('');
                self._chat.sendMessage(roomId, message);
                return false;
            }
        });
        var tabListTemplate;

        var $tab = template(room);

        // Attach on-shown event to move tab to front and scroll to bottom.
        onShow('tab', (event) => {
            messages.scrollTop(messages[0].scrollHeight);
        });

        // Dynamically update the width of each tab based upon the number open.

        // Update the room listing to reflect that we're now in the room.
        this.$roomList.children(roomId).setHighlight();

        // Sort each item in the user list alphabetically on click of the dropdown.
        onClick('firechat-btn-room-user-list', roomId, () => {
            self.sortListLexicographically('#firechat-room-user-list-' + roomId);
            return;
        });

        // Automatically select the new tab.
        //self._chat.resumeSession();
        this.focusTab(roomId);
    };

    /**
     * Given a room id, focus the given tab.
     *
     * @param    {string}    roomId
     */
    focusTab(roomId) {
        if (this.messages[roomId]) {
            var tab = get('room-id', roomId).tab();
            if (tab) {
                tab.trigger('click');
            }
        }
    };


    /**
     * Given a room id, remove the tab and all child elements from the interface.
     *
     * @param    {string}    roomId
     */
    removeTab(roomId) {
        delete this.messages[roomId];

        // Remove the inner tab content.
        this.tabContent.find('room-id', roomId).remove();

        // Remove the tab from the navigation menu.
        this.tabList.find('room-id', roomId).remove();

        // Dynamically update the width of each tab based upon the number open.

        // Automatically select the next tab if there is one.
        this.tabList.next('firechat-tab').trigger('click');

        // Update the room listing to reflect that we're now in the room.
        this.roomList.children('room-id', roomId).setHighlight();
    };
}
