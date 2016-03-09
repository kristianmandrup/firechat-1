class Prompt {
    /**
     * Launch a prompt to allow the user to create a new room.
     */
    promptCreateRoom() {
        var $prompt = displayPrompt('Create Group', {
            maxLengthRoomName: this.maxLengthRoomName,
            isModerator: self._chat.userIsModerator()
        }));

        onClick('close', () => {
            $prompt.remove();
            return false;
        });


        onClick('submit', () => {
            var name = $prompt.find('[data-input=firechat-room-name]').first().val();
            if (name !== '') {
                self._chat.createRoom(name, 'public');
                $prompt.remove();
            }
            return false;
        });

        focus('firechat-room-name]');
        onKeydown('firechat-room-name', (e) => {
            if (e.which === 13) {
                var name = $prompt.find('[data-input=firechat-room-name]').first().val();
                if (name !== '') {
                    self._chat.createRoom(name, 'private');
                    $prompt.remove();
                    return false;
                }
            }
        });
    };

    /**
     * Launch a prompt to tell the user to login
     */

    promptLoginRequired() {
        var $prompt = displayPrompt('Please Login');
        onClick('close', () => {
            $prompt.remove();
        });
    };


    /**
      * Launch a prompt to allow the user to Add user handle.

      */
    promptInvite() {
        var $prompt = this.prompt('Invite User', template({
            maxLengthRoomName: this.maxLengthRoomName,
            isModerator: self._chat.userIsModerator()
        }));

        onClick('close', () => {
            $prompt.remove();
        });
    };


    /**
     * Inner method to launch a prompt given a specific title and HTML content.
     * @param    {string}    title
     * @param    {string}    content
     */
    prompt(title, content) {
        displayPrompt({
            title: title,
            content: content
        });
    };
}
