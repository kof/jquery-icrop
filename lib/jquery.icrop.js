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

var classNames = 'ui-icrop ui-widget ui-corner-all ui-state-default',
    // borrowed by jquery
    rurl = /^([\w\+\.\-]+:)(?:\/\/([^\/?#:]*)(?::(\d+))?)?/,
    $doc = $(document);

function Icrop(elem, options) {
    this.element = $(elem);
    this.elements = {};
    this.options = $.extend({}, Icrop.options, options);
}

// export constructor
$.Icrop = Icrop;

// export options
Icrop.options = {
    // image selector/element/jq object/url
    image: 'img',
    // image width
    width: null,
    // image height
    height: null,
    // image position
    left: 0,
    top: 0,
    zoom: 1,
    // oncrop callback
    crop: $.noop,
    // create callback
    create: $.noop
};

Icrop.version = '0.0.1';

Icrop.prototype.init = function() {
    var self = this,
        o = this.options;

    this.element
        .addClass(classNames)
        .on('create.icrop', o.create)
        .on('crop.icrop', o.crop);

    this._elementWidth = this.element.width();
    this._elementHeight = this.element.height();
    this._render(function() {

        // calc zoom using width if zoom is not set
        if (o.zoom <= 1 && o.width) {
            o.zoom = o.width / self._elementWidth;
        }

        if (o.width) {
            o.height = o.width * self._ratio;
        }

        self._zoom(o.zoom, false)
            ._draggable()
            ._trigger('create');
    });

    return this;
};

Icrop.prototype.destroy = function() {
    this.element
        .off('.icrop')
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

        // use a setter fn if implemented
        if (name == 'zoom') {
            this._zoom(value, true);
            this._trigger('crop');
        } else {
            o[name] = value;
        }

        return this;
    }

    // getter
    if (name) {
        return o[name];
    }
};

Icrop.prototype._render = function(callback) {
    var self = this,
        o = this.options,
        img = new Image();

    img.onload = function() {
        if (self.elements.originImg) {
            self.elements.originImg.hide();
        }

        // calculate the ratio before removing width and hight attr
        self._ratio = img.width / img.height;

        self.elements.img = $(img)
            // IE has a default height, so changing width only later
            // will result in stretched image
            .removeAttr('width height')
            .appendTo(self.element);

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

Icrop.prototype._move = function(left, top, force) {
    var o = this.options;

    if (top > 0) {
        top = force ? 0 : o.top;
    } else if (top != 0 && o.height + top < this._elementHeight) {
        top = force ? -(o.height - this._elementHeight) : o.top;
    }

    if (left > 0) {
        left = force ? 0 : o.left;
    } else if (left != 0 && o.width + left < this._elementWidth) {
        left = force ? -(o.width - this._elementWidth) : o.left;
    }

    o.left = Math.round(left);
    o.top = Math.round(top);

    this.elements.img.css({
        left: o.left,
        top: o.top
    });

    return this;
};

Icrop.prototype._zoom = function(zoom, force) {
    var o = this.options,
        width, height,
        left, top;

    zoom = zoom > 1 ? zoom : 1;
    width = this._elementWidth * zoom;
    height = width / this._ratio;

    if (force) {
        if (zoom == 1) {
            left = 0;
            top = 0;
        } else if (zoom > o.zoom) {
            left = o.left - (width - o.width) / 2;
            top = o.top - (height - o.height) / 2;
        } else {
            left = o.left + (o.width - width) / 2;
            top = o.top + (o.height - height) / 2;
        }
    } else {
        left = o.left;
        top = o.top;
    }

    o.width = Math.round(width);
    o.height = Math.round(height);
    o.zoom = zoom;

    this.elements.img.css('width', o.width);
    this._move(left, top, force);

    return this;
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
            self._move(left, top);

            if (left == o.left || top == o.top) {
                changed = true;
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
    var o = this.options;

    this.element.trigger(type, {
        left: o.left,
        top: o.top,
        width: o.width,
        height: o.height
    });

    return this;
};

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

    return ret == null ? this : ret;
};

}(jQuery));
