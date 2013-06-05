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
        var container = d.createElement('span'),
            context = getOpt(opts, 'context', d);

        container.className = 'fill-it-container';
        context.appendChild(container);

        // TODO: Fill this :)
    };

    function getOpt(opts, key, fallback) {
        return opts && opts[key] || fallback;
    }
}(document));

// jQuery plugin initialization (only if jQuery is present)
if (typeof jQuery !== 'undefined') {
    jQuery.fn.fillIt = function(opts) {
        return this.each(function() {
            var ctx = document.querySelector($(this).data('target')) || this;

            fillIt($.extend({}, opts, { context: ctx }));
        });
    };
}