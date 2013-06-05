$(document.body).on('click.fill-it', '.fi-btn', function() {
    var $this = $(this),
        $target = $($this.data('target')) || $this;

    $target.fillIt();

    return false;
});
