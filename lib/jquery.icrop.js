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
 */

(function($) {

$.fn.icrop = function(method, options, data) {
    var ret;

    if (typeof method != 'string') {
        options = method;
        method = 'init';
    }

    this.each(function() {
        var inst = $.data(this, 'icrop'),
            _ret;

        if (!inst) {
            inst = new Icrop(this, options);
            $.data(this, 'icrop', inst);
        }

        if (method) {
            _ret = inst[method](options, data);
        }

        // if something was returned - it is a getter,
        // otherwise - support jquery like chaining
        if (_ret != inst) {
            ret = _ret;
            return false;
        }
    });

    return ret || this;
};

// export options
$.fn.icrop.options = {
    // image selector/element/jq object/url
    image: 'img',
    // container width
    width: null,
    // container height
    height: null,
    left: 0,
    top: 0,
    // in percents 0-100
    zoom: 0,
    // oncrop callback
    crop: $.noop
};

var classNames = 'ui-icrop ui-widget ui-corner-all ui-state-default',
    // borrowed by jquery
    rurl = /^([\w\+\.\-]+:)(?:\/\/([^\/?#:]*)(?::(\d+))?)?/,
    $doc = $(document);

function Icrop(elem, options) {
    this.element = $(elem);
    this.elements = {};
    this.options = $.extend({}, $.fn.icrop.options, options);
    this._image = {
        size: {},
        ratio: 1
    };
}

// export constructor
$.fn.icrop.Icrop = Icrop;

Icrop.prototype.init = function() {
    var self = this,
        o = this.options;

    if (o.width) {
        this.element.css('width', o.width);
    } else {
        o.width = this.element.width();
    }

    if (o.height) {
        this.element.css('height', o.height);
    } else {
        o.height = this.element.height();
    }

    this.element.addClass(classNames);

    this._renderImage(function() {
        self._setZoom()
            ._draggable()
            ._setImagePosition(o.left, o.top);
    });

    return this;
};

Icrop.prototype.destroy = function() {
    this.element
        .removeData('icrop')
        .removeClass(classNames);

    this.elements.img.remove();

    // restore original image
    if (this.elements.originImg) {
        this.elements.originImg.show();
    }

    $doc.off('.icrop');

    return this;
};

Icrop.prototype.option = function(name, value) {
    var o = this.options;

    // setter
    if (name && value) {
        o[name] = value;

        if (name == 'zoom') {
            this._setZoom()
                ._debouncedTrigger('crop');
        }

        return this;
    }

    // getter
    if (name) {
        return o[name];
    }
};

Icrop.prototype.getImageSize = function() {
    return $.extend({}, this._image.size);
};

Icrop.prototype._setImageSize = function(width) {
    this._image.size.width = width;
    this._image.size.height = width / this._image.ratio;
    this.elements.img.css(this._image.size);
    this._fixPosition();
    return this;
};

Icrop.prototype._setImagePosition = function(left, top) {
    var o = this.options;
    left != null && (o.left = left);
    top != null && (o.top = top);
    this.elements.img.css({
        left: left,
        top: top
    });
    this._fixPosition();
    return this;
};

Icrop.prototype._setZoom = function()   {
    var o = this.options;
    this._setImageSize(o.width * (o.zoom ? o.zoom : 1));
    return this;
};

Icrop.prototype._renderImage = function(callback) {
    var self = this,
        o = this.options,
        img = new Image();

    img.onload = function() {
        if (self.elements.originImg) {
            self.elements.originImg.hide();
        }
        self.elements.img = $(img).appendTo(self.element);
        self._image.originSize = {
            width: img.width,
            height: img.height
        };
        self._image.ratio = img.width / img.height;
        callback();
    };

    if (rurl.test(o.image)) {
        img.src = o.image;
    } else {
        this.elements.originImg = this.element.find(o.image);
        img.src = this.elements.originImg.attr('src');
    }

    return this;
};

Icrop.prototype._fixPosition = function() {
    var o = this.options,
        size = this._image.size,
        left = o.left,
        top = o.top,
        changed = false;

    if (top > 0) {
        changed = true;
        top = 0;
    } else if (top != 0 && size.height + top < o.height) {
        changed = true;
        top = size.height - o.height;
    }

    if (left > 0) {
        changed = true;
        left = 0;
    } else if (left != 0 && size.width + left < o.width) {
        changed = true;
        left = size.width - o.width;
    }

    if (changed) {
        this._setImagePosition(left, top);
    }

    return this;
};


Icrop.prototype._isInside = function(left, top) {
    var o = this.options;

    if (left != null && (left > 0 || left + this._image.size.width < o.width)) {
        return false;
    }

    if (top != null && (top > 0 || top + this._image.size.height < o.height)) {
        return false;
    }

    return true;
};

Icrop.prototype._draggable = function() {
    var self = this,
        o = this.options,
        $img = this.elements.img,
        changed = false;

    $img.on('mousedown.icrop', function(e) {
        var x, y;

        e.preventDefault();

        $doc.on('mousemove.icrop', function(e) {
            var xdiff = x ? e.clientX - x : 0,
                ydiff = y ? e.clientY - y : 0,
                left = o.left + xdiff,
                top = o.top + ydiff;

            x = e.clientX;
            y = e.clientY;

            // at least one coord should be changed
            if (left != o.left && self._isInside(left)) {
                changed = true;
                self._setImagePosition(left);
            }

            if (top != o.top && self._isInside(null, top)) {
                changed = true;
                self._setImagePosition(null, top);
            }
        });
    });

    $doc.on('mouseup.icrop', function(e) {
        $doc.off('mousemove.icrop');
        if (changed) {
            self._trigger('crop');
        }
        changed = false;
    });

    return this;
};

Icrop.prototype._trigger = function(type) {
    var o = this.options,
        data;

    data = {
        zoom: o.zoom,
        left: o.left,
        top: o.top,
        width: this._image.size.width,
        height: this._image.size.height,
        ratio: this._image.ratio
    };

    this.options[type].call(this.element, $.Event(type), data);
    this.element.trigger(type, data);

    return this;
};

Icrop.prototype._debouncedTrigger = debounce(Icrop.prototype._trigger, 300);

// borrowed by underscore
function debounce(func, wait) {
    var timeout;
    return function() {
        var context = this, args = arguments;
        function later() {
            timeout = null;
            func.apply(context, args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}
}(jQuery));
