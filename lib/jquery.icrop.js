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
    // will be calculated from geometry
    zoom: null,
    // frame width
    width: null,
    // frame height
    height: null,
    // cropping area calculated relatively to the original image
    geometry: null,
    // change callback
    change: $.noop,
    // create callback
    create: $.noop
};

Icrop.version = '0.1.2';

Icrop.prototype.init = function() {
    var self = this,
        o = this.options;

    this.element
        .addClass(classNames)
        .on('create.icrop', o.create)
        .on('change.icrop', o.change);

    if (!o.width) {
        o.width = this.element.width();
    }

    if (!o.height) {
        o.height = this.element.height();
    }

    this._frame = {
        width: o.width,
        height: o.height
    };

    this._create(function() {
        if (o.geometry && o.geometry.left && o.geometry.top && o.geometry.width) {
            self._current = self._fromCropGeometry(o.geometry);
        } else {
            self._current = self._defaultGeometry();
        }

        if (o.zoom) {
            self._zoom(o.zoom, true);
        } else {
            self._zoom(self._current.width / self._frame.width, false);
        }

        self._apply()
        self._draggable();
        self.element.trigger('create');
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

// get and set an option
Icrop.prototype.option = function(name, value) {
    var o = this.options;

    // setter
    if (name && value) {

        // use a setter fn if implemented
        if (name == 'zoom') {
            this._zoom(value, true)._apply();
            this.element.trigger('change', o.geometry);
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

Icrop.prototype._create = function(callback) {
    var self = this,
        o = this.options,
        img = new Image();

    img.onload = function() {
        if (self.elements.originImg) {
            self.elements.originImg.hide();
        }

        // do this before removing width and hight attributes
        self._original = {
            width: img.width,
            height: img.height,
            ratio: img.width / img.height
        };

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

// Move the image. Make moving image outside of the frame impossible.
// - `left` left position
// - `top` top position
// - `force` if false - just apply the current position
Icrop.prototype._move = function(left, top, force) {
    var o = this.options;

    if (top > 0) {
        top = force ? 0 : this._current.top;
    } else if (top != 0 && this._current.height + top < this._frame.height) {
        top = force ? -(this._current.height - this._frame.height) : this._current.top;
    }

    if (left > 0) {
        left = force ? 0 : this._current.left;
    } else if (left != 0 && this._current.width + left < this._frame.width) {
        left = force ? -(this._current.width - this._frame.width) : this._current.left;
    }

    this._current.left = Math.round(left);
    this._current.top = Math.round(top);

    o.geometry = this._toCropGeometry();

    return this;
};

Icrop.prototype._apply = function() {
    this.elements.img.css({
        left: this._current.left,
        top: this._current.top,
        width: this._current.width
    });

    return this;
};

// zoom the image
// - `zoom` >= 1
// - `force` if false - current geometry will be applied
Icrop.prototype._zoom = function(zoom, force) {
    var o = this.options,
        width, height,
        left, top;

    zoom = zoom > 1 ? zoom : 1;
    width = this._frame.width * zoom;
    height = width / this._original.ratio;

    if (force) {
        if (zoom == 1) {
            left = 0;
            top = 0;
        } else if (zoom > o.zoom) {
            left = this._current.left - (width - this._current.width) / 2;
            top = this._current.top - (height - this._current.height) / 2;
        } else {
            left = this._current.left + (this._current.width - width) / 2;
            top = this._current.top + (this._current.height - height) / 2;
        }
    } else {
        left = this._current.left;
        top = this._current.top;
    }

    o.zoom = zoom;
    this._current.width = Math.round(width);
    this._current.height = Math.round(height);
    this._move(left, top, force);
    this._fix();

    return this;
};

// make the image draggable
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
                left = self._current.left + xdiff,
                top = self._current.top + ydiff;

            x = e.clientX;
            y = e.clientY;

            self._move(left, top)._apply();

            if (left == self._current.left || top == self._current.top) {
                changed = true;
            }
        });
    });

    $doc.on('mouseup.icrop', function(e) {
        $doc.off('mousemove.icrop');
        if (changed) {
            self.element.trigger('change', o.geometry);
        }
        changed = false;
    });

    return this;
};

// For the case either geometry nor zoom is given.
Icrop.prototype._defaultGeometry = function() {
    return {
        width: this._frame.width,
        height: Math.round(this._frame.width / this._original.ratio),
        top: 0,
        left: 0
    };
};

// Fix current geometry - image should always fill the frame.
Icrop.prototype._fix = function() {
    var cur = this._current;

    if (!this._fills()) {
        cur.width = this._frame.width;
        cur.height = cur.width / this._original.ratio;
    }

    if (!this._fills()) {
        cur.height = this._frame.height;
        cur.width = cur.height * this._original.ratio;
    }

    if (cur.left > 0) {
        cur.left = Math.round((this._frame.width - cur.width) / 2);
    }

    if (cur.top > 0) {
        cur.top = Math.round((this._frame.height - cur.height) / 2);
    }

    if (cur.left > 0) {
        cur.left *= -1;
    }

    if (cur.top > 0) {
        cur.top *= -1;
    }

    return this;
};

Icrop.prototype._fills = function() {
    return this._current.height >= this._frame.height &&
        this._current.width >= this._frame.width;
};

// Convert icrop specific geometry data to ImageMagick like.
Icrop.prototype._toCropGeometry = function() {
    var factor = this._original.width / this._current.width;

    return {
        left: Math.round(Math.abs(this._current.left) * factor),
        top: Math.round(Math.abs(this._current.top) * factor),
        width: Math.round(this._frame.width * factor),
        height: Math.round(this._frame.height * factor)
    };
};

// Convert cropping ImageMagick like geometry data to icrop specific.
Icrop.prototype._fromCropGeometry = function(geometry) {
    var factor = this._frame.width / geometry.width;

    return {
        left: -Math.round(geometry.left * factor),
        top: -Math.round(geometry.top * factor),
        width: Math.round(this._original.width * factor),
        height: Math.round(this._original.height * factor)
    };
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
