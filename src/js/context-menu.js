class MessageContextMenu {
    constructor(ctx) {
        this.ctx = ctx;
        this._chat = ctx._chat;
    }

    show(event) {
        var message = byId('message-id'),
        var messageVars = this.parseMessage(event);

        // Clear existing menus.
        clearMessageContextMenus();

        // Highlight the relevant message.
        addMsg('highlighted');

        this._chat.getRoom(messageVars.roomId, (room) => {
            // Show the context menu.
        });
        this.configureEvents();
    }

    // event handlers for Context menu
    configureEvents() {
        // Handle dismissal of message context menus (any non-right-click click event).
        this.onClick('close-menu', (event) => {
            if (!event.button || event.button != 2) {
                clearMessageContextMenus();
            }
        });

        // Handle display of message context menus (via right-click on a message).
        this.onClick('firechat-message', showMessageContextMenu);

        // Handle click of the 'Warn User' contextmenu item.
        this.onClick('firechat-user-warn', (event) => {
            // TODO: remove duplication
            var messageVars = this.parseMessage(event);
            this._chat.warnUser(messageVars.userId);
        });

        // Handle click of the 'Suspend User (1 Hour)' contextmenu item.
        this.onClick('firechat-user-suspend-hour', (event) => {
            var messageVars = this.parseMessage(event);
            this._chat.suspendUser(messageVars.userId, /* 1 Hour = 3600s */ 60 * 60);
        });

        // Handle click of the 'Suspend User (1 Day)' contextmenu item.
        this.onClick('firechat-user-suspend-day', (event) => {
            var messageVars = this.parseMessage(event);
            this._chat.suspendUser(messageVars.userId, /* 1 Day = 86400s */ 24 * 60 * 60);
        });

        // Handle click of the 'Delete Message' contextmenu item.
        this.onClick('firechat-message-delete', (event) => {
            var messageVars = this.parseMessage(event);
            this._chat.deleteMessage(messageVars.roomId, messageVars.messageId);
        });
    }
}
