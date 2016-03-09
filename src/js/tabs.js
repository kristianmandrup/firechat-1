class Tabs {
    /**
     * Binds custom inner-tab events.
     */
    bindTabControls() {
        // Handle click of tab close button.
        $(document).delegate('[data-event="firechat-close-tab"]', 'click', (event) => {
            var roomId = $(this).closest('[data-room-id]').data('room-id');
            self._chat.leaveRoom(roomId, true);
            return false;
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
        if (this.$messages[roomId]) {
            this.focusTab(roomId);
            return;
        }
        var room = {
            id: roomId,
            name: roomName
        };

        // Populate and render the tab content template.
        var tabContent = $(tabTemplate(room));
        var messages = get('firechat-messages', roomId);

        // Keep a reference to the message listing for later use.
        this.messages[roomId] = messages;

        // Attach on-enter event to textarea.
        var textarea = tabContent.find('textarea').first();
        onKeyDown('textarea', function(e) {
            var message = self.trimWithEllipsis($textarea.val(), self.maxLengthMessage);
            if ((e.which === 13) && (message !== '')) {
                $textarea.val('');
                self._chat.sendMessage(roomId, message);
                return false;
            }
        });
        var tabListTemplate;

        // Populate and render the tab menu template.
        if(roomType != "public") {
         tabListTemplate = FirechatDefaultTemplates["templates/tab-menu-item.html"];
        }
        else {
             tabListTemplate = FirechatDefaultTemplates["templates/public-tab-menu.html"];
        }

        var $tab = $(tabListTemplate(room));

        // Attach on-shown event to move tab to front and scroll to bottom.
        onShow('tab', (event) => {
            messages.scrollTop(messages[0].scrollHeight);
        });

        // Dynamically update the width of each tab based upon the number open.
        var tabs = this.tabList.children('li');
        var tabWidth = Math.floor($('#firechat-tab-list').width() / tabs.length);
        this.$tabList.children('li').css('width', tabWidth);

        // Update the room listing to reflect that we're now in the room.
        this.$roomList.children('[data-room-id=' + roomId + ']').children('a').addClass('highlight');

        // Sort each item in the user list alphabetically on click of the dropdown.
        $('#firechat-btn-room-user-list-' + roomId).bind('click', function() {
            self.sortListLexicographically('#firechat-room-user-list-' + roomId);
            return false;
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
        if (this.$messages[roomId]) {
            var $tabLink = this.$tabList.find('[data-room-id=' + roomId + ']').find('a');
            if ($tabLink.length) {
                $tabLink.first().trigger('click');
            }
        }
    };


    /**
     * Given a room id, remove the tab and all child elements from the interface.
     *
     * @param    {string}    roomId
     */
    removeTab(roomId) {
        delete this.$messages[roomId];

        // Remove the inner tab content.
        this.$tabContent.find('[data-room-id=' + roomId + ']').remove();

        // Remove the tab from the navigation menu.
        this.$tabList.find('[data-room-id=' + roomId + ']').remove();

        // Dynamically update the width of each tab based upon the number open.
        var tabs = this.$tabList.children('li');
        var tabWidth = Math.floor($('#firechat-tab-list').width() / tabs.length);
        this.$tabList.children('li').css('width', tabWidth);

        // Automatically select the next tab if there is one.
        this.$tabList.find('[data-toggle="firechat-tab"]').first().trigger('click');

        // Update the room listing to reflect that we're now in the room.
        this.$roomList.children('[data-room-id=' + roomId + ']').children('a').removeClass('highlight');
    };
}
