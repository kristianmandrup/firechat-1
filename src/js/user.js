class UserUi {
    /**
     * Binds user search buttons, dropdowns, and input fields for searching all
     * active users currently in chat.
     */
    userSearch() {
        var self = this,
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
            },
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
            };

        $(document).delegate('[data-event="firechat-user-search"]', 'keyup', handleUserSearchSubmit);
        $(document).delegate('[data-event="firechat-user-search"]', 'click', handleUserSearchSubmit);

        // Upon click of the dropdown, autofocus the input field and trigger list population.
        $(document).delegate('[data-event="firechat-user-search-btn"]', 'click', function(event) {
            event.stopPropagation();
            var $input = $(this).next('div.firechat-dropdown-menu').find('input');
            $input.focus();
            $input.trigger(jQuery.Event('keyup'));
        });

        // Ensure that the dropdown stays open despite clicking on the input element.
        $(document).delegate('[data-event="firechat-user-search"]', 'click', function(event) {
            event.stopPropagation();
        });
    };

    /**
     * Binds user mute toggles and removes all messages for a given user upon mute.
     */
    userMuting() {
        var self = this;
        $(document).delegate('[data-event="firechat-user-mute-toggle"]', 'click', function(event) {
            var $this = $(this),
                userId = $this.closest('[data-user-id]').data('user-id'),
                userName = $this.closest('[data-user-name]').data('user-name'),
                isMuted = $this.hasClass('red'),
                template = FirechatDefaultTemplates["templates/prompt-user-mute.html"];

            event.preventDefault();

            // Require user confirmation for muting.
            if (!isMuted) {
                var $prompt = self.prompt('Mute User?', template({
                    userName: userName
                }));

                $prompt.find('a.close').first().click(function() {
                    $prompt.remove();
                    return false;
                });

                $prompt.find('[data-toggle=decline]').first().click(function() {
                    $prompt.remove();
                    return false;
                });

                $prompt.find('[data-toggle=accept]').first().click(function() {
                    self._chat.toggleUserMute(userId, userName);
                    $prompt.remove();
                    return false;
                });
            } else {
                self._chat.toggleUserMute(userId, userName);
            }
        });




        $(document).delegate('#mutedUsers', 'click', function(event) {
            template = FirechatDefaultTemplates["templates/muted-Users.html"];

            var list = window._mutedUsers;
            if (list === "") {
                list = "No muted users";
            }
            var $prompt = self.prompt('Muted Users', template({
                list: list
            }));
            $prompt.find('a.close').first().click(function() {
                $prompt.remove();
                return false;
            });

            $prompt.find('a.close').first().click(function() {
                $prompt.remove();
                return false;
            });
            $prompt.find('li').click(function() {

                var id = $(this).closest('[data-id]').data('id');
                self._chat.removeMutedUsers(id);
                $prompt.remove();
                return false;
            });



        });
    };
}
