class OG_DS_LOCAL extends OG_DS_MODULE {
	constructor() {
		super();
	}
	// native
	_readdir(path, callback) {
		let info = this.pathInfo(path)
		let result = Lockr.getAll(true).map((result) => {

		})

		callback(this._resolved(result));
	}
	_readFile(path, callback) {
		let result = Lockr.get(this.pathName(path));
		if (result) {
			callback(this._resolved(result));
		} else {
			callback(this._rejected(err));
		}
	}
	_writeFile(path, data, callback) {
		Lockr.set(this.pathName(path), data);
		callback(this._resolved());
	}
}
/*
function BROWSERFS() {
	this.pathToString = function (path) {
		return path.replace(/\//g, '__dir__').replace(/\./g, '__ext__');
	};

	this.set = function (path, data) {
		Lockr.set(this.pathToString(path), data);
	};

	this.get = function (path) {
		return Lockr.get(this.pathToString(path));
	};

	this.remove = function (path) {
		return Lockr.rm(this.pathToString(path));
	};

	this.write = function (path, data, callback) {
		this.set(path, data);
		callback({
			error: false,
		});
	};

	this.read = function (path, callback) {
		var data = this.get(path);
		if (typeof data == 'undefined') {
			callback({
				error: true,
			});
		} else {
			callback({
				error: false,
				data: data,
			});
		}
	};

	this.unlink = function (path, callback) {
		this.remove(path);
		callback({
			error: false,
		});
	};
}
*/
