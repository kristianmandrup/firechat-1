class Message {
    _onNewMessage(roomId, message) {
        var userId = message.userId;
        if (!this._user || !this._user.muted || !this._user.muted[userId]) {
            this.showMessage(roomId, message);
        }
    }

    _onRemoveMessage(roomId, messageId) {
        this.removeMessage(roomId, messageId);
    }

    /**
     * Render a new message in the specified chat room.
     *
     * @param    {string}    roomId
     * @param    {string}    message
     */
    showMessage(roomId, rawMessage) {
        // Setup defaults
        var message = {
            id: rawMessage.id,
            localtime: self.formatTime(rawMessage.timestamp),
            message: rawMessage.message || '',
            userId: rawMessage.userId,
            name: rawMessage.name,
            type: rawMessage.type || 'default',
            isSelfMessage: (self._user && rawMessage.userId == self._user.id),
            disableActions: (!self._user || rawMessage.userId == self._user.id)
        };

        // While other data is escaped in the Underscore.js templates, escape and
        // process the message content here to add additional functionality (add links).
        // Also trim the message length to some client-defined maximum.
        var messageConstructed = '';
        message.message = _.map(message.message.split(' '), function(token) {
            if (self.urlPattern.test(token) || self.pseudoUrlPattern.test(token)) {
                return self.linkify(encodeURI(token));
            } else {
                return _.escape(token);
            }
        }).join(' ');
        message.message = self.trimWithEllipsis(message.message, self.maxLengthMessage);

        // Populate and render the message template.
        var messages = self.messages[roomId];
        if (messages) {
            messages.append(message);
            if (scrollToBottom) {
                messages.scrollTop(messages[0].scrollHeight);
            }
        }
    }

    /**
     * Remove a message by id.
     *
     * @param    {string}    roomId
     * @param    {string}    messageId
     */
    removeMessage(roomId, messageId) {
        remove('message', messageId);
    }
}
