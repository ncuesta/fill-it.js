/**
 * fill-it.js
 * https://github.com/ncuesta/fill-it.js
 *
 * Copyright (c) 2013 Jorge Condomi, Pablo Osso, Nahuel Cuesta Luengo
 * Licensed under the MIT license.
 *
 * https://github.com/ncuesta/fill-it.js/blob/master/LICENSE
 */

'use strict';

var fillIt = window.fillIt = (function(d) {
    return function(opts) {
        var container = d.createElement('div'),
            context = getOpt(opts, 'context', d),
            classes = 'fill-it-container full';

        if (context.className.indexOf(' filled ') !== -1) {
            // The context has already been filled
            return;
        }

        if (getOpt(opts, 'beverage', false)) {
            classes += ' ' + getOpt(opts, 'beverage');
        }

        // TODO: Fill this :)

        container.className = classes;
        container.innerHTML = 'beverage';
        context.appendChild(container);

        context.className += ' filled ';
    };

    function getOpt(opts, key, fallback) {
        return opts && opts[key] || fallback;
    }
}(document));

// jQuery plugin initialization (only if jQuery is present)
if (typeof jQuery !== 'undefined') {
    jQuery.fn.fillIt = function(opts) {
        return this.each(function() {
            var $this = $(this),
                ctx = document.querySelector($this.data('target')) || this,
                dataOpts = $this.data('options') || {};

            fillIt($.extend({}, opts, dataOpts, { context: ctx }));
        });
    };
}