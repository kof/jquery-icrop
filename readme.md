## icrop - jquery plugin for very simple image cropping.

## API

- init

    $('selector').icrop({
        // path to the image
        url: 'http://farm4.static.flickr.com/3509/3912427039_a79b87119a.jpg',
        // size of container
        width: 150,
        height: 200,
        // selector/element/jquery objekt of slider
        slider: 'slider-selector'
    });

- get option

    $('selector').icrop('option', 'size');
    $('selector').icrop('option', 'position');

- destroy

    $('selector').icrop('destroy');

## Dependencies

- jquery
- ui-draggable
- ui-slider

## License

Dual licensed under the MIT (http://www.opensource.org/licenses/mit-license.php)
and GPL (http://www.opensource.org/licenses/gpl-license.php) licenses.
