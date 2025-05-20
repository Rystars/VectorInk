(function(){
	class OG_DS_PATH_INFO {
		constructor(path) {
			let parts = path.split('/');
			let filepart = parts[1] || '';
			let fileparts = filepart.split('.');

			let dir = parts[0];
			let file = fileparts[0];
			let ext = fileparts[1] || 'text';

			this.dir = dir;
			this.name = file;
			this.filename = file + '.' + ext;
			this.ext = ext;
			this.path = path;
			this.src = dir + '/' + file;
			this.dirOnly = parts.length == 1

			this.json = false;
			this.image = false;
			this.svg = false;
			this.png = false;
			this.jpg = false;
			this.text = false;
			this.font = false;
			this._setType()
		}
		_setType(){
			switch (this.ext.toLowerCase()) {
				case 'json':
					this.json = true;
					break;
				case 'png':
					this.png = true;
					this.image = true;
					break;
				case 'jpg':
				case 'jpeg':
					this.jpg = true;
					this.image = true;
					break;
				case 'otf':
				case 'ttf':
					this.font = true;
					break;
				case 'svg':
					this.svg = true;
					break;
				default:
					this.text = true;
					break;
			}
		}
	}
	class OG_DS_RESULT extends og.module {
		constructor(response) {
			super()
			this._error = null;
			this._result = null;
		}
		parse() {
			if (this._result) {
				this._result = og.u.json(this._result);
			}
		}
		get error() {
			return this._error;
		}
		get result() {
			return this._result;
		}
		set error(error) {
			this._error = error;
		}
		set result(result) {
			this._result = result;
		}
	}
	class OG_DS_LOADER extends og.module {
		constructor() {
			super()
			this._active = false;
			this._id = og.u.uniqueId();
			this.parseJSON = true;
		}
		activate() {
			this._active = true;
		}
		deactivate() {
			this._active = false;
		}
		read(path) {
			return new Promise((resolve, reject) => {
				this._read(path, { resolve: resolve, reject: reject });
			});
		}
		readdir(path) {
			return new Promise((resolve, reject) => {
				this._readdir(path, { resolve: resolve, reject: reject });
			});
		}
		write(path, data) {
			return new Promise((resolve, reject) => {
				this._write(path, data, { resolve: resolve, reject: reject });
			});
		}
		pathInfo(path) {
			return new OG_DS_PATH_INFO(path);
		}
		pathName(path){
			let info = this.pathInfo(path)
			return info.dir + '__' + info.name
		}
		// generic
		_dir(path, promise) {
			this._readdir(path, (result) => {
				promise.resolve(result);
			});
		}
		_read(path, promise) {
			this._readFile(path, (result) => {
				promise.resolve(result);
			});
		}
		_write(path, data, promise) {
			this._writeFile(path, data, (result) => {
				promise.resolve(result);
			});
		}
		// blob data
		_upload(path, data, promise) {
			this._write(path, data, promise);
		}
		_download(path, promise) {
			this._read(path, promise);
		}
		// json storage
		_get(path, promise) {
			this._readFile(path, (result) => {
				promise.resolve(result);
			});
		}
		_put(path, data, promise) {
			this._writeFile(path, data, () => {
				promise.resolve()
			});
		}
		// native
		_readdir(path, callback) {
			var fs = require('fs');
			fs.readdir(path, function (err, result) {
				if (err) {
					callback(this._rejected(err));
				} else {
					callback(this._resolved(result));
				}
			});
		}
		_readFile(path, callback) {
			var fs = require('fs');
			fs.readFile(path, 'utf8', function (err, result) {
				if (err) {
					callback(this._rejected(err));
				} else {
					callback(this._resolved(result));
				}
			});
		}
		_writeFile(path, data, callback) {
			var fs = require('fs');
			fs.writeFile(path, data, function (err) {
				if (err) {
					callback(this._rejected(err));
				} else {
					callback(this._resolved());
				}
			});
		}
		// util
		_rejected(message) {
			let result = new OG_DS_RESULT();
			result.error = message || 'Error processing data';
			return result;
		}
		_resolved(data) {
			let result = new OG_DS_RESULT();
			result.result = data || { success: true };
			return result;
		}
		get active() {
			return this._active;
		}
		get id() {
			return this._id;
		}
	}
	og.use(OG_DS_LOADER, 	{as: 'ds_loader', singleton: false})
	og.use(OG_DS_RESULT, 	{as: 'ds_result', singleton: false})
	og.use(OG_DS_PATH_INFO, {as: 'ds_path',   singleton: false})
})()