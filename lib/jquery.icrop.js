/*!
 * Simple image cropper
 * http://github.com/kof/jquery-icrop
 *
 * Copyright 2012, Oleg Slobodskoi
 *
 * Dual licensed under the MIT (http://www.opensource.org/licenses/mit-license.php)
 * and GPL (http://www.opensource.org/licenses/gpl-license.php) licenses.
 *
 * Depends on:
 *  - jquery.js
 *  - jquery.ui.draggable.js
 *  - jquery.ui.slider.js
 */

(function($) {

$.fn.icrop = function(method, options) {
    var ret;

    if (typeof method !== 'string') {
        options = method;
        method = null;
    }

    this.each(function() {
        var inst = $.data(this, 'icrop');

        if (!inst) {
            inst = new $.Icrop(this, options);
            $.data(this, 'icrop', inst);
        }

        if (method) {
            ret = inst[method](options);
        }
    });

    return ret || this;
};

$.fn.icrop.options = {
    // image url
    url: null,
    // image selector/element/jq object, is used if no url defined
    image: 'img',
    // container size
    width: null,
    height: null,
    // image size
    size: {
        width: 'auto',
        height: 'auto'
    },
    zoomProp: 'width',
    // image position
    position: {top: 0, left: 0},
    // slider element selector/element/jq object
    slider: null,
    sliderOptions: {
        min: 1,
        max: 5,
        step: 0.1,
        change: $.noop,
        slide: $.noop
    },
    // draggable option
    draggable: {
        stop: $.noop
    },
    // minimal size of the image, which have to be always visible
    minVisibleSize: 20,
    // onchange callback, fired after d&d and zoom
    change: $.noop
};

var classNames = 'ui-icrop ui-widget ui-corner-all ui-state-default';

$.Icrop = function(elem, options) {
    var o;

    this.element = $(elem);
    this.elements = {};
    this.options = o = $.extend(true, {}, $.fn.icrop.options, options);

    this._setupElement()
        ._renderImage()
        ._setInitialImageSize()
        ._fixPos();

    if (o.slider) {
        this._applySlider();
    }

    if (o.draggable) {
        this._applyDraggables();
    }
};

$.Icrop.prototype.destroy = function() {
    var o = this.options,
        $img = this.elements.img;

    this.element
        .removeData('icrop')
        .removeClass(classNames)
        .attr('style', this._oElemStyle);

    if (o.slider) {
        $(o.slider).slider('destroy');
    }

    if (o.url) {
        $img.remove();
    } else {
        if (o.draggable) {
            $img.draggable('destroy');
        }

        $img.attr(this._oImgAttr);
    }

};

$.Icrop.prototype.option = function(name, value) {
    var o = this.options;

    // setter
    if (name && value) {
        o[name] = value;
    // getter for 1 prop
    } else if (name) {
        return o[name];
    // getter for all props
    } else {
        return o;
    }
};

$.Icrop.prototype._setupElement = function() {
    var o = this.options;

    if (!o.width) {
        o.width = this.element.width();
    }

    if (!o.height) {
        o.height = this.element.height();
    }

    if (!o.url) {
        o.url = this.element.data('url');
    }

    this._oElemStyle = this.element.attr('style') || '';
    this.element.css({
        width: o.width,
        height: o.height,
    }).addClass(classNames);

    return this;
};

$.Icrop.prototype._renderImage = function() {
    var o = this.options,
        $img;

    if (o.url) {
        this.elements.img = $('<img src="'+ o.url +'"/>')
            .appendTo(this.element);
    } else {
        $img = this.elements.img = this.element.find(o.image);
        this._oImgAttr = {
            style: $img.attr('style') || '',
            width: $img.attr('width'),
            height: $img.attr('height')
        };

        $img.removeAttr('width height');
    }

    return this;
};

$.Icrop.prototype._setInitialImageSize = function() {
    var o = this.options;

    // set default width/height to frame width/height
    if (o.size[o.zoomProp] === 'auto') {
        o.size[o.zoomProp] = o[o.zoomProp];
    }

    this.elements.img.css($.extend({}, o.size, o.position));

    return this;
};


$.Icrop.prototype._fixPos = function(set) {
    var o = this.options,
        pos = o.position,
        margin = o.minVisibleSize,
        changed = false;

    if (pos.top > o.height - margin) {
        changed = true;
        pos.top = o.height - margin;
    }

    if (pos.top < (o.size.height - margin) * -1) {
        changed = true;
        pos.top = (o.size.height - margin) * -1;
    }

    if (pos.left > o.width - margin) {
        changed = true;
        pos.left = o.width - margin;
    }

    if (pos.left < (o.size.width - margin) * -1) {
        changed = true;
        pos.left = (o.size.width - margin) * -1;
    }

    if (changed && set) {
        this.elements.img.css(pos);
    }

    return this;
};

$.Icrop.prototype._applyDraggables = function() {
    var self = this,
        o = this.options,
        stop = o.draggable.stop;

    o.draggable.stop = function(e, ui) {
        // call overwritten callback
        stop.apply(this, arguments),
        o.position = ui.position;
        self._fixPos(true);
        self._triggerChange();
    };

    this.elements.img.draggable(o.draggable);

    return this;
};

$.Icrop.prototype._applySlider = function() {
    var self = this,
        o = this.options,
        $img = this.elements.img,
        slide = o.sliderOptions.slide,
        change = o.sliderOptions.change;

    o.sliderOptions.slide = function(e, ui) {
        slide.apply(this, arguments);

        o.size[o.zoomProp] = Math.round(o[o.zoomProp] * ui.value);
        $img.css(o.zoomProp, o.size[o.zoomProp]);
    };

    o.sliderOptions.change = function() {
        change.apply(this, arguments);
        o.size.height = $img.height();
        self._fixPos(true);
        self._triggerChange();
    };

    $(o.slider).slider(o.sliderOptions);

    return this;
};

$.Icrop.prototype._triggerChange = function() {
    var o = this.options,
        data = $.extend({}, o.size, o.position);

    o.change.call(this.element, data);
    this.element.trigger('change', data);

    return this;
};

}(jQuery));