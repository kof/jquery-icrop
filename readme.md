## icrop - jquery plugin for very simple image cropping.

## API

jQuery like usabillity.

    $(selector).icrop(options);

    $(selector).icrop(method, value);

## Default options.

    {
        // image selector/element/jq object/url
        image: 'img',
        // will be calculated from geometry
        zoom: null,
        // cropping area calculated relatively to the original image
        geometry: null,
        // change callback
        change: $.noop,
        // create callback
        create: $.noop
    }

## Examples

### Initialize

    $('selector').icrop({
        image: 'http://farm4.static.flickr.com/3509/3912427039_a79b87119a.jpg'
    });

    $('selector').icrop({
        image: 'http://farm4.static.flickr.com/3509/3912427039_a79b87119a.jpg',
        geometry: {
            top: 40,
            left: 20,
            width: 200,
            height: 250
        }
    });

### Get an option

    $('selector').icrop('option', 'geometry');

### Events
    $('selector').on('change', function(e, geometry) {
        console.log(geometry);
    });

    $('selector').on('create', function(e, geometry) {
        console.log(geometry);
    });

### Destroy

    $('selector').icrop('destroy');

## License

Dual licensed under the MIT (http://www.opensource.org/licenses/mit-license.php)
and GPL (http://www.opensource.org/licenses/gpl-license.php) licenses.
