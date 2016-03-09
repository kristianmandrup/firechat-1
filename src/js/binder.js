class Binder {
    constructor() {
    }

    /**
     * Binds to height changes in the surrounding div.
     */
    heightChange() {
        var self = this,
            $el = $(this._el),
            lastHeight = null;

        setInterval(function() {
            var height = $el.height();
            if (height != lastHeight) {
                lastHeight = height;
                $('.chat').each(function(i, el) {

                });
            }
        }, 500);
    }



    /**
     * Binds to any text input fields with data-provide='limit' and
     * data-counter='<selector>', and upon value change updates the selector
     * content to reflect the number of characters remaining, as the 'maxlength'
     * attribute less the current value length.
     */
    textInputFieldLimits() {
        onKeyUp('limit', (event) => {
            var $this = $(this),
                $target = $($this.data('counter')),
                limit = $this.attr('maxlength'),
                count = $this.val().length;

            $target.html(Math.max(0, limit - count));
        });
    };

}
