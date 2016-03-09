class UiUtils {
    /**
     * Given a selector for a list element, sort the items alphabetically.
     *
     * @param    {string}    selector
     */
    sortListLexicographically(selector) {
        listItems.sort(function(a, b) {
            var upA = toUpperCase(a);
            var upB = toUpperCase(b);
            return (upA < upB) ? -1 : (upA > upB) ? 1 : 0;
        }).appendTo(selector);
    };

    /**
     * Remove leading and trailing whitespace from a string and shrink it, with
     * added ellipsis, if it exceeds a specified length.
     *
     * @param    {string}    str
     * @param    {number}    length
     * @return   {string}
     */
    trimWithEllipsis(str, length) {
        str = str.replace(/^\s\s*/, '').replace(/\s\s*$/, '');
        return (length && str.length <= length) ? str : str.substring(0, length) + '...';
    };

    /**
     * Given a timestamp, format it in the form hh:mm am/pm. Defaults to now
     * if the timestamp is undefined.
     *
     * @param    {Number}    timestamp
     * @param    {string}    date
     */
    formatTime(timestamp) {
        var date = (timestamp) ? new Date(timestamp) : new Date(),
            hours = date.getHours() || 12,
            minutes = '' + date.getMinutes(),
            ampm = (date.getHours() >= 12) ? 'pm' : 'am';

        hours = (hours > 12) ? hours - 12 : hours;
        minutes = (minutes.length < 2) ? '0' + minutes : minutes;

        var dateAndTime = '' + hours + ':' + minutes + ampm;
        if (timestamp) {
            var monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            if ((date.getFullYear()) != (new Date().getFullYear()))
                return '' + monthNames[date.getMonth()] + ' ' + date.getDate() + ' ' + date.getFullYear() + ' at ' + dateAndTime;

            if ((date.getDate() != new Date().getDate()) || (date.getMonth() != new Date().getMonth()))
                return '' + monthNames[date.getMonth()] + ' ' + date.getDate() + ' at ' + dateAndTime;
        }

        return dateAndTime;
    };


    // see http://stackoverflow.com/questions/37684/how-to-replace-plain-urls-with-links
    linkify(str) {
        var self = this;
        return str
            .replace(self.urlPattern, '<a target="_blank" href="$&">$&</a>')
            .replace(self.pseudoUrlPattern, '$1<a target="_blank" href="http://$2">$2</a>');
    };
}
