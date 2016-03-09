class UserUi {
    /**
     * Binds user search buttons, dropdowns, and input fields for searching all
     * active users currently in chat.
     */
    userSearch() {
        handleUserSearchSubmit = function(event) {
            var $this = $(this),
                targetId = $this.data('target'),
                controlsId = $this.data('controls'),
                templateId = $this.data('template'),
                prefix = $this.val() || $this.data('prefix') || '',
                startAt = $this.data('startAt') || null,
                endAt = $this.data('endAt') || null;

            event.preventDefault();

            userSearch(targetId, templateId, controlsId, prefix, startAt, endAt);
        }

        userSearch = function(targetId, templateId, controlsId, prefix, startAt, endAt) {
            var $target = $('#' + targetId),
                $controls = $('#' + controlsId),
                template = FirechatDefaultTemplates[templateId];

            // Query results, filtered by prefix, using the defined startAt and endAt markets.
            self._chat.getUsersByPrefix(prefix, startAt, endAt, self.maxUserSearchResults, function(users) {
                var numResults = 0,
                    $prevBtn, $nextBtn, username, firstResult, lastResult;

                $target.empty();

                for (username in users) {
                    var user = users[username];

                    // Disable buttons for <me>.
                    user.disableActions = (!self._user || user.id === self._user.id);

                    numResults += 1;

                    $target.append(template(user));

                    // If we've hit our result limit, the additional value signifies we should paginate.
                    if (numResults === 1) {
                        firstResult = user.name.toLowerCase();
                    } else if (numResults >= self.maxUserSearchResults) {
                        lastResult = user.name.toLowerCase();
                        break;
                    }
                }

                if ($controls) {
                    $prevBtn = $controls.find('[data-toggle="firechat-pagination-prev"]');
                    $nextBtn = $controls.find('[data-toggle="firechat-pagination-next"]');

                    // Sort out configuration for the 'next' button
                    if (lastResult) {
                        $nextBtn
                            .data('event', 'firechat-user-search')
                            .data('startAt', lastResult)
                            .data('prefix', prefix)
                            .removeClass('disabled').removeAttr('disabled');
                    } else {
                        $nextBtn
                            .data('event', null)
                            .data('startAt', null)
                            .data('prefix', null)
                            .addClass('disabled').attr('disabled', 'disabled');
                    }
                }
            });
        });

        onKeyup('firechat-user-search', handleUserSearchSubmit);
        onClick('firechat-user-search', handleUserSearchSubmit);

        // Upon click of the dropdown, autofocus the input field
        // and trigger list population.
        onClick('firechat-user-search-btn', (event) => {
            next('firechat-dropdown-menu input');
        });

        // Ensure that the dropdown stays open despite clicking on the input element.
        onClick('firechat-user-search', (event) => {
            event.stopPropagation();
        });
    };

    /**
     * Binds user mute toggles and removes all messages for a given user upon mute.
     */
    userMuting() {
        onClick('firechat-user-mute-toggle', (event) => {
            var userId = data('user-id'),
                userName = data('user-name'),
                isMuted = this.is('muted');

            // Require user confirmation for muting.
            if (!isMuted) {
                var $prompt = this.prompt('Mute User?', {
                    userName: userName
                }));

                onClose($prompt, () => {
                    $prompt.remove();
                });

                onClick('decline', () => {
                    $prompt.remove();
                });

                onClick('accept', () => {
                    self._chat.toggleUserMute(userId, userName);
                    $prompt.remove();
                });
            } else {
                this._chat.toggleUserMute(userId, userName);
            }
        });

        onClick('mutedUsers', (event) => {
            var list = get('mutedUsers');
            if (list === "") {
                list = "No muted users";
            }
            var $prompt = this.prompt('Muted Users', {
                list: list
            });

            onClose($prompt, () => {
                $prompt.remove();
            });

            onClick('item', $prompt, () => {
                var id = data('id');
                this._chat.removeMutedUsers(id);
                $prompt.remove();
            });
        });
    }

    /**
     * Binds a custom context menu to messages for superusers to warn or ban
     * users for violating terms of service.
     */
    superuserUIEvents() {
        parseMessageVars = function(event) {
            return {
                messageId: data('message-id'),
                userId: data('user-id'),
                roomId: data('room-id')
            };
        },
        clearMessageContextMenus = function() {
            // Remove any context menus currently showing.
            forAll('firechat-contextmenu').each((menu) => {
                menu.remove();
            });

            // Remove any messages currently highlighted.
            forAll('.message.highlighted').each((msg) => {
                msg.unHighlight();
            });
        },
    }
}
