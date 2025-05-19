(function () {
	var __ = function (og) {
		class OG_MEDIA_PROCESSOR {
			constructor() {
				this._canvas = null;
				this._size = 300;
			}
			ar_width(img) {
				var ratio = img.naturalWidth / img.naturalHeight;
				var width = this._size * ratio;

				return width;
			}
			ar_height(img) {
				var ratio = img.naturalHeight / img.naturalWidth;
				var height = this._size * ratio;

				return height;
			}
			getImageSize(img) {
				if (img.width > img.height) {
					return { width: this._size, height: this.ar_height(img) };
				} else {
					return { width: this.ar_width(img), height: this._size };
				}
			}
			/*
			 * Creates a new image object from the src
			 * Uses the deferred pattern
			 */
			createImage(src) {
				return new Promise((resolve) => {
					var img = new Image();

					img.onload = function () {
						resolve(img);
					};

					img.src = src;
				});
			}

			/*
			 * Create an Image, when loaded pass it on to the resizer
			 */
			resize(src, quality) {
				return this.createImage(src).then((result) => {
					return this._resize(result, quality);
				});
			}

			/*
			 * Draw the image object on a new canvas and half the size of the canvas
			 * until the darget size has been reached
			 * Afterwards put the base64 data into the target image
			 */
			_resize(image, quality) {
				if(image.width > image.height){
					this._size = Math.min(this._size, image.width);
				}
				else{
					this._size = Math.min(this._size, image.height);
				}

				var size = this.getImageSize(image);

				this._canvas = document.createElement('canvas');
				this._canvas.width = size.width;
				this._canvas.height = size.height;
				var ctx = this._canvas.getContext('2d');
				ctx.drawImage(image, 0, 0, this._canvas.width, this._canvas.height);
				return this._canvas.toDataURL('image/jpeg', quality || 1.0);
			}

			/*
			 * Draw initial canvas on new canvas and half it's size
			 *
			halfSize(i) {
				var canvas = document.createElement("canvas");
				canvas.width = i.width / 2;
				canvas.height = i.height / 2;
				var ctx = canvas.getContext("2d");
				ctx.drawImage(i, 0, 0, canvas.width, canvas.height);
				return canvas;
			};
			*/

			get size() {
				return this._size;
			}
			set size(size) {
				this._size = size;
			}
		}
		og.use(OG_MEDIA_PROCESSOR, { as: 'media_processor', singleton: false });
	};

	if (typeof module != 'undefined' && module.exports) {
		module.exports = function (og) {
			__(og);
			return {};
		};
	} else {
		__(og);
	}
})();
