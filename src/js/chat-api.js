class ChatAPI {
    /**
     * Initialize an authenticated session with a user id and name.
     * This method assumes that the underlying Firebase reference has
     * already been authenticated.
     */
    setUser(userId, userName, chatroom) {
        // Initialize data events
        this._chat.setUser(userId, userName, (user) => {
            this._user = user;

            if (this._chat.userIsModerator()) {
                this.bindFor('superuserUIEvents';
            }

            this._chat.enterRoom(chatroom);
            this._chat.resumeSession();

        });
    }

    /**
     * Exposes internal chat bindings via this external interface.
     */
    on(eventType, cb) {
        this._chat.on(eventType, cb);
    }

    /**
     * Given a title and message content, show an alert prompt to the user.
     *
     * @param    {string}    title
     * @param    {string}    message
     */
    renderAlertPrompt(title, message) {
        $prompt = displayPrompt('alert', {
            message: message
        }));

        onClick('close')(() => {
            $prompt.remove();
        });
    }

    /**
     * Toggle input fields if we want limit / unlimit input fields.
     */
    toggleInputs(isEnabled) {
        find('firechat msg').each(() => {
            var $this = $(this);
            if (isEnabled) {
                clearTxt();
            } else {
                setTxt('You have exceeded the message limit, please wait before sending.');
            }
            inputMsg('disabled', !isEnabled);
        });
        find('firechat-input-name').set('disabled', !isEnabled);
    }
}



