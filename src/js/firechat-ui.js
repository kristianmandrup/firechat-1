// Main chat UI manager
class FirechatUI {
    constructor(firebaseRef, options) {
        if (!firebaseRef) {
            throw new Error('FirechatUI: Missing required argument `firebaseRef`');
        }

        options = options || {};
        this._options = options;

        this._user = null;
        this._chat = new Firechat(firebaseRef, options);


        // A list of rooms to enter once we've made room for them (once we've hit the max room limit).
        this._roomQueue = [];

        // Define some constants regarding maximum lengths, client-enforced.
        this.maxLengthUsername = 15;
        this.maxLengthUsernameDisplay = 15;
        this.maxLengthRoomName = 24;
        this.maxLengthMessage = 120;
        this.maxUserSearchResults = 100;

        // Define some useful regexes.
        this.urlPattern = /\b(?:https?|ftp):\/\/[a-z0-9-+&@#\/%?=~_|!:,.;]*[a-z0-9-+&@#\/%=~_|]/gim;
        this.pseudoUrlPattern = /(^|[^\/])(www\.[\S]+(\b|$))/gim;

        // RENDER THE CHAT!!!
        this._renderLayout();

        // Shortcuts to commonly used elements.
        this.wrapper = ui('firechat');
        this.roomList = ui('firechat-room-list');
        this.tabList = ui('firechat-tab-list');
        this.tabContent = ui('firechat-tab-content');
        this.messages = {};

        // Rate limit messages from a given user with some defaults.
        this.$rateLimit = {
            limitCount: 10, // max number of events
            limitInterval: 10000, // max interval for above count in milliseconds
            limitWaitTime: 30000, // wait time if a user hits the wait limit
            history: {}
        };

        // Setup UI bindings for chat controls.
        this._bindUIEvents();

        // Setup bindings to internal methods
        this._bindDataEvents();

    }

    // Run FirechatUI in *noConflict* mode, returning the `FirechatUI` variable to
    // its previous owner, and returning a reference to the FirechatUI object.
    static noConflict = function noConflict() {
        root.FirechatUI = previousFirechatUI;
        return FirechatUI;
    };

    _bindUIEvents() {
        // Chat-specific custom interactions and functionality.
        this._bindForHeightChange();
        this._bindForTabControls();
        this._bindForRoomList();
        this._bindForUserRoomList();
        this._bindForUserSearch();
        this._bindForUserMuting();
        this._bindForChatInvites();
        this._bindForRoomListing();

        // Generic, non-chat-specific interactive elements.
        this._setupTabs();
        this._setupDropdowns();
        this._bindTextInputFieldLimits();
    }

    _bindDataEvents () {
        this._chat.on('user-update', this._onUpdateUser);

        // Bind events for new messages, enter / leaving rooms, and user metadata.
        this._chat.on('room-enter', this._onEnterRoom);
        this._chat.on('room-exit', this._onLeaveRoom);
        this._chat.on('message-add', this._onNewMessage);
        this._chat.on('message-remove', this._onRemoveMessage);

        // Bind events related to chat invitations.
        this._chat.on('room-invite', this._onChatInvite);
        this._chat.on('room-invite-response', this._onChatInviteResponse);

        // Binds events related to admin or moderator notifications.
        this._chat.on('notification', this._onNotification);
    }

    _renderLayout() {
        chatElem.display({
            maxLengthUsername: this.maxLengthUsername
        });
    }
}
