# LazyPres

You can find this project deployed [here.](https://zemiret.github.io/lazypres/)

## What and why?

LazyPres(entation) is for people that would like to share their (travel)
photos in a more entartaining way but are too lazy to create a presentation for it
(it is time consuming, alright?).

So you just upload your photos and if they have a geolocation tags on them,
they will be plotted on a map and their location will be indicated.
Rock solid, crude and brutal styling (close to none).
Cool and simple, huh?

## Drawback!
This does not handle EXIF orientation correctly on jpegs.
So if your jpg is rotated with EXIF tag, it will be displayed rotated.
Dealing with EXIF rotation is a mess in css/js, so I decided not to deal with it.
If you want to use this with rotated images, and have them not rotated,
you can use script `exiforientfix.sh` from my repo `/utils` first in a directory
with pictures.

