/*
var category = req.body.category;
var logo = req.body.projectdata;
var id = req.body.id;
var filename = .filename;

var ds = new DataSource();
ds.set('request', req.body);
ds.model('resource', {key:'category', index: 'name', sortBy: '', struct: {":key": [{category: "category", name: "filename", imagesrc: "filename::'.png'", datasrc: "filename::'.json'", id: '?', sequence: ":sequence"}]}});
ds.writeJSON(__appdir + '/datasource/templates/data/' + ds.get('request', 'filename) + '.json', ds.get('request', 'projectdata'), () => {
  ds.readJSON(__appdir + '/datasource/templates/resource.json', (res) => {
      ds.set('resource', res);
      ds.update('resource', ds.get('request'), {});
  })
})
*/

(function() {
    var _debug = true;
    var $util = new DataSourceUtility();
    var $pm = new ProcessManager();
    var _constants = {};
    var eventEmitter = new EventEmitter();
    function DataSource() {
        var collections = {};
        var models = {};
        var baseDir = '';
		this.util = new DataSourceUtility()
        this.debug = function() {
            _debug = true;
        }
        
        this.connect = function(app, server){
            var multer = require('multer');
            var storage = multer.diskStorage({
                destination: function(req, file, cb) {
                    cb(null, './');
                },
                filename: function(req, file, cb) {
                    cb(null, req.body.filename);
                }
            });
            var upload = multer({
                storage: storage
            });

            app.post('/dsWrite', server.jsonEncode(), (req, res) => {
                this.writeJSON(req.body.path, req.body.data, () => {
                    res.status(200).json({});
                });
            });

            app.post('/dsWriteImage', upload.single('image'), (req, res) => {
                if(_debug){
                    console.log('datasource write image', req.body.path);
                }

                res.status(200).json({});
             });

            app.post('/dsUnlink', server.jsonEncode(), (req, res) => {
                if(!req.body){
                    res.status(200).json({});
                    return;
                }
                this.unlink(req.body.path, () => {
                    res.status(200).json({});
                });
            });

            app.get('/dsReadDir', (req, res) => {
                if(_debug){
                    console.log('datasource read dir', req.query.path);
                }

                this.readDir(req.query.path, function(resource){
                    res.status(200).json(resource);
                });
            });

            app.get('/dsRead', (req, res) => {
                this.readJSON(req.query.path, function(resource){
                    res.status(200).json(resource);
                });
            });

            app.get('/dsReadImage', (req, res) => {
                if(_debug){
                    console.log('datasource read image', req.query.path);
                }

                this.readImage(req.query.path, function(resource){
                    var base64 = ''
                    if(typeof resource.data == 'undefined'){
                        base64 = ''
                    }
                    else{
                        base64 = Buffer.from(resource.data).toString('base64');
                    }
                    res.status(200).json(base64);
                });
            });

        }

        this.dataTable = function(name, options){
            return new DataTable(name, options);
        }
        this.emitter = function(){
            return $util.emitter();
        }
        this.on = function(action, listener){
            return eventEmitter.on(action, listener);
        }
        this.$var = function(name, value) {
            if (typeof value == 'undefined') {
                if(!_constants.hasOwnProperty(name)){
                    throw 'undefined datasource constant ' + name;
                    return null;
                }
                return _constants[name];
            } else {
                //DataSource[name] = value;
                _constants[name] = value;
                return _constants[name];
            }
        }
        this.$ = function(name, value){
            return this.$var(name, value);
        }
        this.processor = function(v) {
            if (v) {
                return $pm.processes(v);
            } else {
                return $pm;
            }
        }
        this.deleteCollection = function(n) {
            if (collections.hasOwnProperty[n]) {
                delete collections[n];
            }
        }
        this.deleteModel = function(n) {
            if (models.hasOwnProperty(n)) {
                delete models[n];
            }
        }
        this.unset = function(name) {
            if(!name){
                var Collection = getCollection(name);
                Collection.unset();
                this.deleteCollection(name);
            }
            else{
                for(var n in models){
                    models[n].unset();
                }
                for(var n in collections){
                    collections[n].unset();
                }
                collections = null;
                models = null;
            }
        }
        this.set = function(name, prop, value) {
            var Collection = getCollection(name);
            Collection.set(prop, value);
        }
        this.get = function(name, prop) {
            var Collection = getCollection(name);
            return Collection.get(prop);
        }
        this.each = function(name) {
            var Collection = getCollection(name);
            return new DataSourceCollectionUtility(this, Collection);
        }
        this.every = function(name) {
            var Collection = getCollection(name);
            return new DataSourceCollectionUtility(this, Collection, {
                httpIterationMethod: 'every'
            });
        }
        this.update = function(name, data) {
            var Collection = getCollection(name);
            var Model = getModel(name);
            return Collection.update(data, Model);
        }
        this.push = function(name, data) {
            var Collection = getCollection(name);
            return Collection.push(data);
        }
        this.delete = function(name, where) {
            var Collection = getCollection(name);
            return Collection.delete(where);
        }
        this.http = function(props, callback) {
            var collectionName = '';
            if (props.hasOwnProperty('$set')) {
                collectionName = props.$set;
                delete props.$set;
            }
            $util.http(props, (response) => {
                if (collectionName.length) {
                    this.set(collectionName, response);
                }
                if (props.success) {
                    props.success(response);
                }
                eventEmitter.emit('http_complete', response, props);
            });
        }
        this.httpImage = function(props) {
            $util.httpImage(props, (response) => {
                if (props.success) {
                    props.success(response);
                }
            });
        }
        this.model = function(name, data) {
            var Model = getModel(name);
            if (data) {
                Model.set(data);
                return Model;
            } else {
                return Model;
            }
        }
        this.write = function(path, data, callback) {
            (new FS(baseDir)).write(path, data, callback);
        }
        this.writeImage = function(path, data, callback) {
            (new FS(baseDir)).writeImage(path, data, callback);
        }
        this.writeJSON = function(path, data, callback) {
            if (typeof data == 'object') {
                data = JSON.stringify(data);
            }
            (new FS(baseDir)).write(path, data, callback);
        }
        this.read = function(path, callback) {
            (new FS(baseDir)).read(path, callback);
        }
        this.readDir = function(path, callback) {
            (new FS(baseDir)).readDir(path, callback);
        }
        this.readImage = function(path, callback) {
            (new FS(baseDir)).readImage(path, callback);
        }
        this.readJSON = function(path, callback) {
            this.read(path, (res) => {
                if(res.error){
                    callback(res);
                }
                else{
                    let result = res.data;
                    if (typeof res.data == 'string') {
                        try{
                            result = JSON.parse(res.data);
                        }
                        catch(err){
                            result = res.data
                        }
                    }
                    callback(result);
                }
            })
        }
        this.unlink = function(path, callback) {
            (new FS(baseDir)).unlink(path, callback);
		}

		this.init = function(app, bypass){
			var n = '35452#@G#GWBh545ub';
			var v = 'GQ#$G89fhq*&G8fNR&Rwev@f#7g4';
			var cookieParser = require('cookie-parser');
			var multer = require('multer');

			app.use(cookieParser());
			app.use(bodyParser.json({limit: '100mb'}));
			app.use(bodyParser.urlencoded({limit: '1000mb', extended: true}));

			var storage = multer.diskStorage({
				destination: function(req, file, cb) {
					cb(null, __dirname + '/');
				},
				filename: function(req, file, cb) {
					cb(null, req.body.filename);
				}
			});
			var upload = multer({
				storage: storage
			});

			app.post('/dsWrite', (req, res) => {
				this.writeJSON(req.body.path, req.body.data, () => {
					res.status(200).json({});
				});
			});

			app.post('/dsWriteImage', upload.single('image'), (req, res) => {
				res.status(200).json({});
			 });

			app.post('/dsUnlink', (req, res) => {
				this.unlink(req.body.path, () => {
					res.status(200).json({});
				});
			});

			app.get('/dsReadDir', (req, res) => {
				this.readDir(req.query.path, function(resource){
					res.status(200).json(resource);
				});
			});

			app.get('/dsRead', (req, res) => {
				this.readJSON(req.query.path, function(resource){
					res.status(200).json(resource);
				});
			});

			app.get('/dsReadImage', (req, res) => {
				this.readImage(req.query.path, function(resource){
					if(typeof resource.data == 'undefined'){
						var base64 = ''
					}
					else{
						var base64 = Buffer.from(resource.data).toString('base64');
					}
					res.status(200).json(base64);
				});
			});

			app.use(function(req, res, next){
				if(bypass || (req.cookies[n] != null && req.cookies[n] == v)){
					res.cookie(n, v);
					next();
				}
				else{
					res.writeHead(404);
					return res.end();
				}
			})
		}


        function getCollection(name) {
            if(collections == null){
                console.log('an unset datasource collection has been re-instaniated', name);
                collections = {};
            }
            if (!collections.hasOwnProperty(name)) {
                collections[name] = new DataSourceCollection();
            }
            return collections[name];
        }

        function getModel(name) {
            if(models == null){
                console.log('an unset datasource model has been re-instaniated', name);
                models = {};
            }
            if (!models.hasOwnProperty(name)) {
                models[name] = new DataSourceModel();
            }
            return models[name];
        }
    }

    function DataSourceCollectionUtility(DataSource, Collection, options) {
        options = $util.extend({
            httpIterationMethod: 'each'
        }, options);
        this.sync = function(callback, complete) {
            $util.sync().each(Collection.get(), (item, next, index) => {
                callback(item, next, index);
            }, complete);
        }
        this.every = function(callback, complete) {
            $util.sync().every(Collection.get(), (item, next, index) => {
                callback(item, next, index);
            }, complete);
        }

        this.do = function(callback) {
            var list = Collection.get();
            if (Collection.isArray()) {
                for (var i = 0; i < list.length; i++) {
                    callback(list[i], i);
                }
            } else {
                for (var n in list) {
                    callback(list[n], n);
                }
            }
        }

        this.http = function(props) {
            return new Promise((resolve, reject) => {
                var req = props;
                if (typeof props == 'object') {
                    req = function(item) {
                        return props;
                    }
                }
                $util.sync()[options.httpIterationMethod](Collection.get(), (item, next) => {
                    var props = req(item);
                    var collectionName = '';
                    if (props.hasOwnProperty('$set')) {
                        collectionName = props.$set;
                        delete props.$set;
                    }

                    $util.http(props, (response) => {
                        if (collectionName.length) {
                            DataSource.set(collectionName, response);
                        }
                        if (props.success) {
                            if (props.success(response, next) === false) {
                                return;
                            }
                        }
                        next();
                    });
                }, () => {
                    resolve();
                });
            });
        }
    }

    function DataSourceCollection() {
        var _ARRAY = 'array';
        var _OBJECT = 'object';
        var data = null;
        var datatype = '';

        this.isArray = function() {
            return datatype == _ARRAY;
        }

        this.isObject = function() {
            return datatype == _OBJECT;
        }

        this.push = function(x) {
            if (this.isArray()) {
                data.push(x);
            }
        }

        this.set = function(x, y) {
            if (data == null) {
                if (typeof x == 'string') {
                    throw "trying to set a string value to an null dataset";
                    return;
                }

                if (x instanceof Array) {
                    datatype = _ARRAY;
                } else {
                    datatype = _OBJECT;
                }
                data = x;
            } else {
                if (typeof x == 'string' && typeof y != undefined) {
                    data[x] = y;
                } else {
                    data = x;
                }
            }
        }

        this.assign = function(prop, value) {
            prop = prop.split('.');
            var ref = data;
            if (prop.length == 1) {
                data[prop[0]] = value;
            } else {
                for (var n = 0; n < prop.length; n++) {
                    ref = ref[prop[n]];
                    if (n + 1 == prop.length - 1) {
                        ref[prop[prop.length - 1]] = value;
                        break;
                    }
                }
            }
        }

        this.get = function(prop) {
            if (!prop) {
                return data;
            } else {
                return data[prop];
            }
        }

        this.unset = function() {
            data = null;
        }
        this.delete = function(where) {
            var key = Object.keys(where)[0];
            var replace = this.isArray() ? [] : {};
            for (var n in data) {
                if (data[n][key] != where[key]) {
                    replace[n] = data[n];
                }
            }
            data = replace;
        }

        this.update = function(item, Model) {
            var model = Model.get();
            var struct = Model.getStruct();
            var mergeindex = null;
            var key = null;
            var index = null;
            var dataset = {};
            for (var n in item) {
                if (struct.hasOwnProperty(n)) {
                    dataset[n] = item[n];
                }
            }

            for (var x in struct) {
                if (struct[x] == ':.png') {
                    dataset[x] = dataset[x] + '.png';
                } else if (struct[x] == ':.json') {
                    dataset[x] = dataset[x] + '.json';
                } else if (struct[x] == ':sequence') {
                    dataset[x] = 0;
                } else {
                    if (struct[x].length) {
                        dataset[x] = dataset[struct[x]];
                    }
                }
            }

            //ds.model('resource', {key:'category', index: 'name', struct: {"key": [{category: "category", name: "filename", imagesrc: "filename::'.png'", datasrc: "filename::'.json'", id: '?', sequence: ":sequence"}]}});
            // struct: {key: [{prop: '?', index: '?', prop: '?'...}]}
            // or struct: {key: [index {prop: '?', prop: '?', prop: '?'...}]} if index is int @todo
            if (model.hasOwnProperty('key') && model.hasOwnProperty('id')) {
                key = dataset[model.key];
                index = dataset[model.id];
                var match = false;
                if (!data.hasOwnProperty(key)) {
                    data[key] = [];
                }

                for (var n in data[key]) {
                    if (data[key][n][model.id] == index) {
                        mergeindex = n;
                        break;
                    }
                }

                if (mergeindex == null) {
                    data[key].push(dataset);
                    mergeindex = data[key].length - 1
                } else {
                    data[key][mergeindex] = this.merge(data[key][mergeindex], dataset);
                }
                if (model.hasOwnProperty('sortBy')) {
                    data[key] = this.sortBy(model.sortBy, model.id, dataset, data[key]);
                }
            }
            // struct: [{prop: '?', index: '?', prop: '?'...}]
            else if (model.hasOwnProperty('id')) {
                index = dataset[model.id];

                for (var n in data) {
                    if (data[n][model.id] == index) {
                        mergeindex = n
                        break;
                    }
                }

                if (mergeindex == null) {
                    data.push(dataset);
                    mergeindex = data.length - 1;
                } else {
                    data[mergeindex] = this.merge(data[mergeindex], dataset);
                }
                if (model.hasOwnProperty('sortBy')) {
                    data = this.sortBy(model.sortBy, model.id, dataset, data);
                }
            }
            else{
                data = this.merge(data, dataset);
            }
        }

        this.merge = function(o1, o2) {
            for (var n in o1) {
                if (o2.hasOwnProperty(n)) {
                    o1[n] = o2[n];
                }
            }
            return o1;
        }

        //{key: 'id', value: 3, sort: 'sequence'}
        this.sortBy = function(sort, id, dataset, data) {
            var counter = 0;
            var n;

            for (n in data) {
                if (data[n][id] == dataset[id]) {
                    data[n][sort] = counter;
                    counter++;
                }
            }

            data = $util.sort(data, 'sequence');

            for (n in data) {
                if (data[n][id] == dataset[id]) {
                    continue;
                }
                data[n][sort] = counter;
                counter++;
            }
            return data;
        }
    }

    function DataSourceModel() {
        var _ARRAY = 'array';
        var _OBJECT = 'object';
        var model = null;
        var datatype = '';

        this.isArray = function() {
            return datatype == _ARRAY;
        }

        this.isObject = function() {
            return datatype == _OBJECT;
        }

        this.unset = function() {
            model = null;
        }

        this.set = function(x) {
            if (x.struct instanceof Array) {
                datatype = _ARRAY;
            } else {
                datatype = _OBJECT;
            }
            model = x;
        }
        this.getStruct = function() {
            if (this.isObject()) {
                return model.struct.key[0];
            } else {
                return model.struct[0];
            }
        }
        this.get = function() {
            return model;
        }
    }

    function FS(baseDir) {
        this.write = function(path, data, callback) {
            $pm.request(path, (resolve) => {
                _fs().write(baseDir + path, data, (res) => {
                    resolve();
                    callback(res);
                });
            });
        }
        this.read = function(path, callback) {
            $pm.request(path, (resolve) => {
                _fs().read(baseDir + path, (res) => {
                    resolve();
                    callback(res);
                });
            });
        }
        this.readDir = function(path, callback) {
            $pm.request(path, (resolve) => {
                _fs().readDir(baseDir + path, (res) => {
                    resolve();
                    callback(res);
                });
            });
        }
        this.writeImage = function(path, data, callback) {
            $pm.request(path, (resolve) => {
                _fs().writeImage(baseDir + path, data, (res) => {
                    resolve();
                    callback(res);
                });
            });
        }
        this.readImage = function(path, callback) {
            $pm.request(path, (resolve) => {
                _fs().readImage(baseDir + path, (res) => {
                    resolve();
                    callback(res);
                });
            });
        }
        this.unlink = function(path, callback) {
            _fs().unlink(baseDir + path, (res) => {
                callback(res);
            });
        }

        function _fs() {
            if (env().nodejs) {
                return new NJSFS();
            }
            else if (env().browser) {
                return new BROWSERFS();
            }
            else if (env().web) {
                return new HTTPFS();
            }
            else {
                return new MOBILEFS();
            }
        }
    }

    function NJSFS() {
        this.mkdir = function(dir, fn) {
            var fs = require('fs');
            fs.mkdir(dir, {
                recursive: true
            }, (err) => {
                if (err) fn({
                    error: true
                });
                else fn({
                    error: false
                });
            });
        }

        this.copy = function(from, to, fn) {
            var fs = require('fs');
            fs.copyFile(from, to, (err) => {
                if (err) fn({
                    error: true
                });
                else fn({
                    error: false
                });
            });
        }

        this.read = function(f, fn) {
            var fs = require('fs');
            var fileName = f;
            fs.readFile(fileName, 'utf8', function(err, data) {
                if(err){
                    console.log(err);
                    fn({
                        error: true,
                        detail: err
                    });
                }
                else{
                    fn({
                        data: data,
                        error: false
                    });
                }
            });
        };

        this.readImage = function(f, fn) {
            var fs = require('fs');
            var fileName = f;
            fs.readFile(fileName, function(err, data) {
                fn({
                    data: data,
                    error: false
                });
            });
        };

        this.rename = function(oldPath, newPath, fn) {
            var fs = require('fs');
            fs.rename(oldPath, newPath, function(err) {
                if (err) {
                    fn({
                        error: true
                    });
                } else {
                    fn({
                        error: false
                    });
                }
            });
        };

        this.write = function(f, x, fn) {
            var fs = require('fs');
            var fileName = f;
            var data = x;
            fs.writeFile(fileName, data, function(err) {
                if (err) {
                    fn({
                        error: true
                    });
                } else {
                    fn({
                        error: false
                    });
                }
            });
        };

        this.writeImage = function(f, x, fn) {
            var fs = require('fs');
            var fileName = f;
            var data = x;
            fs.writeFile(fileName, data, function(err) {
                if (err) {
                    fn({
                        error: true
                    });
                } else {
                    fn({
                        error: false
                    });
                }
            });
        };

        this.readdir = function(dir, fn) {
            var fs = require('fs');
            fs.readdir(dir, function(err, files) {
                if (err) {
                    fn({
                        error: true
                    });
                } else {
                    fn({
                        error: false,
                        data: files
                    });
                }
            });
        };

        this.unlink = function(path, fn) {
            var fs = require('fs');
            fs.unlink(path, function(err) {
                if (err) {
                    fn({
                        error: true
                    });
                } else {
                    fn({
                        error: false
                    });
                }
            });
        };
    }

    function MOBILEFS() {
        this.write = function(path, data, callback) {
            var fs = new FileStorage();
            fs.write(path, data).then(function() {
                    callback({
                        error: false
                    });
                }).catch(function() {
                    callback({
                        error: true
                    });
                });
        }

        this.read = function(path, callback) {
            var fs = new FileStorage();
            fs.read(path)
                .then(function(data) {
                    callback({
                        data: data,
                        error: false
                    });
                })
                .catch(function() {
                    callback({
                        error: true
                    });
                });
        }

        this.readDir = function(path, callback) {
            var fs = new FileStorage();
            fs.list(path).then(function(data) {
                    callback({
                        data: data,
                        error: false
                    });
                }).catch(function() {
                    callback({
                        error: true
                    });
                });
        }

        this.writeImage = function(name, image, callback) {
            var fs = new FileStorage();
            fs.write(name, image).then(function() {
                callback({
                    error: false
                });
            }).catch(function() {
                callback({
                    error: true
                });
            });
        }

        this.readImage = function(name, callback) {
            var fs = new FileStorage();
            fs.readAsDataURL(name).then(function(base64) {
                callback({
                    data: base64,
                    error: false
                });
            }).catch(function() {
                callback({
                    error: true
                });
            });
        }

        this.unlink = function(src, callback) {
            var fs = new FileStorage();
            fs.removeFile(src).then(function() {
                callback({
                    error: false
                });
            }).catch(function() {
                callback({
                    error: true
                });
            });
        }
    }

    function BROWSERFS() {
		this.pathToString = function(path){
			return path.replace(/\//g, '__dir__').replace(/\./g, '__ext__')
		}

		this.set = function(path, data){
			Lockr.set(this.pathToString(path), data);
		}

		this.get = function(path){
			return Lockr.get(this.pathToString(path));
		}

		this.remove = function(path){
			return Lockr.rm(this.pathToString(path));
		}

        this.write = function(path, data, callback) {
			this.set(path, data);
			callback({
				error: false
			})
        }

        this.read = function(path, callback) {
			var data = this.get(path)
			if(typeof data == 'undefined'){
				callback({
					error: true,
				});
			}
			else{
				callback({
					error: false,
					data: data
				});
			}
		}

        this.unlink = function(path, callback) {
			this.remove(path)
			callback({
				error: false,
			});
        }
    }

    function HTTPFS() {
        this.write = function(path, data, callback) {
            $util.http({
                url: '/dsWrite',
                method: 'post',
                data: {path: path, data: data}
            }, () => {
                callback({
                    error: false
                });
            });
        }

        this.read = function(path, callback) {
            $util.http({
                url: '/dsRead',
                method: 'get',
                data: {path: path}
            }, (response) => {
                if(response.error){
                    callback({
                        error: true,
                    });
                }
                else{
                    callback({
                        error: false,
                        data: response
                    });
                }
            });
        }

        this.readDir = function(path, callback) {
            $util.http({
                url: '/dsReadDir',
                method: 'get',
                data: {path: path}
            }, (response) => {
                if(response.error){
                    callback({
                        error: true,
                    });
                }
                else{
                    callback({
                        error: false,
                        data: response
                    });
                }
            });
        }

        this.writeImage = function(name, image, callback) {
            $util.httpImage({
                url: '/dsWriteImage',
                method: 'post',
                blob: image,
                filename: name,
                data: {source: 'projects'}
            }, () => {
                callback({
                    error: false
                });
            });
        }

        this.readImage = function(path, callback) {
            $util.http({
                url: '/dsReadImage',
                method: 'get',
                data: {path: path}
            }, (base64) => {
                callback({
                    data: 'data:image/png;base64,' + base64,
                    error: false
                });
            });
        }

        this.unlink = function(path, callback) {
            $util.http({
                url: '/dsUnlink',
                method: 'post',
                data: {path: path}
            }, () => {
                callback({
                    error: false
                });
            });
        }
    }
    function DataSourceUtility() {
        this.resizeImage = function(base64, width, height, callback){
            const img = new Image();
            img.src = base64;
            img.onload = () => {
                const elem = document.createElement('canvas');
                elem.width = width;
                elem.height = height;
                const ctx = elem.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                callback(ctx.canvas.toDataURL())

            }
        }
        this.id = function(key){
            key = key || '-k';
            return Math.random().toString(36).substr(2, 9) + '-' + ((new Date()).getTime()) + '-' + key;
        }
        this.extend = function(d, s) {
            if (!s) {
                return d;
            }
            for (var n in s) {
                d[n] = s[n];
            }
            return d;
        }
        this.extendOwn = function(d, s) {
            if (!s) {
                return d;
            }
            for (var n in s) {
                if (d.hasOwnProperty(n)) {
                    d[n] = s[n];
                }
            }
            return d;
        }
		this.copy =  function(to, from){
			for(var n in from){
				if(typeof from[n] == 'object'){
					if(to[n] == null){
						if(from[n] instanceof Array){
							to[n] = [];
						}
						else{
							to[n] = {};
						}
					}
					to[n] = this.copy(to[n], from[n]);
				}
				else{
					to[n] = from[n];
				}
			}
			return to;
		}
        this.sort = function(arr, prop, reverse){
            if(reverse) arr.sort(function(a,b) {return (a[prop] > b[prop]) ? -1 : ((b[prop] > a[prop]) ? 1 : 0);} );
            else arr.sort(function(a,b) {return (a[prop] > b[prop]) ? 1 : ((b[prop] > a[prop]) ? -1 : 0);} );
            return arr;
        }
        this.http = function(props, callback) {
            props.method = props.method || 'get';
            props.dataType = props.dataType || 'json';
            props.contentType = props.contentType || 'application/json';
            props.data = props.data || {};
            if (props.method == 'post') {
                props.data = JSON.stringify(props.data);
            }
            $.ajax(props.url, {
                type: props.method,
                data: props.data,
                dataType: props.dataType,
                contentType: props.contentType,
            }).done(function(response) {
                if (callback) {
                    callback(response);
                }
            });
        }

        this.httpImage = function(props, callback) {
            var blob;
            if (props.blob) {
                blob = props.blob;
            } else {
                blob = this.base642ab(props.dataUrl);
            }
            var data = new FormData();
            data.append('filename', props.filename);
            if (props.data) {
                for (var n in props.data) {
                    data.append(n, props.data[n]);
                }
            }
            data.append('image', blob);

            $.ajax(props.url, {
                type: 'POST',
                data: data,
                processData: false,
                contentType: false,
            }).done(function(response) {
                if (callback) {
                    callback(response);
                }
            });
        }

        this.blobToBase64 = function(blob, callback){
            var reader = new FileReader();
            reader.readAsDataURL(blob);
            reader.onloadend = function() {
                callback(reader.result);
            }
        }

        this.base642ab = function(dataUrl) {
            var b64Data = dataUrl.split(',')[1];
            var contentType = 'image/png';
            var sliceSize = 512;

            var byteCharacters = atob(b64Data);
            var byteArrays = [];

            for (var offset = 0; offset < byteCharacters.length; offset += sliceSize) {
                var slice = byteCharacters.slice(offset, offset + sliceSize);

                var byteNumbers = new Array(slice.length);
                for (var i = 0; i < slice.length; i++) {
                    byteNumbers[i] = slice.charCodeAt(i);
                }

                var byteArray = new Uint8Array(byteNumbers);

                byteArrays.push(byteArray);
            }

            var blob = new Blob(byteArrays, {
                type: contentType
            });
            return blob;
        }

        this.getImage = function(url, callback) {
            //var url = 'datasource/' + source + '/images/' + filename;
            var image = new Image();

            image.onload = function () {
                var canvas = document.createElement('canvas');
                canvas.width = this.naturalWidth; // or 'width' if you want a special/scaled size
                canvas.height = this.naturalHeight; // or 'height' if you want a special/scaled size

                canvas.getContext('2d').drawImage(this, 0, 0);

                // Get raw image data
                //callback(canvas.toDataURL('image/png').replace(/^data:image\/(png|jpg);base64,/, ''));

                // ... or get as Data URI
                callback(canvas.toDataURL('image/png'));
            };

            image.src = url;
        }

		this.each = function(arr, cb, fn){
			var sync = new SyncronusLoop()
			sync.each(arr, cb, fn)
		}

		this.every = function(arr, cb, fn){
			var sync = new SyncronusLoop()
			sync.every(arr, cb, fn)
		}

        this.sync = function() {
            return new SyncronusLoop();
        }

        this.emitter = function(){
            return new EventEmitter();
        }
    }

    function SyncronusLoop() {
        this.every = function(arr, callback, done) {
            var _finished = 0;
            for (var i = 0; i < arr.length; i++) {
                callback(arr[i], () => {
                    _finished++;
                    if (_finished == arr.length) {
                        setTimeout(() => {
                            done();
                        }, 1);
                    }
                }, i);
            }
        }

        this.each = function(arr, cb, fn) {
            if(!(arr instanceof Array)){
                var list = [];
                for(var n in arr){
                    list.push(arr[n]);
                }
                arr = list;
                list = null;
            }
            var i = 0;
            var ld = function() {
                if (arr[i] == null) {
                    fn();
                } else {
                    cb(arr[i], () => {
                        i++
                        ld();
                    }, i);
                }
            }
            ld();
        }
    }

    function ProcessManager() {
        var _requests = {};

        this.request = function(filename, callback, props) {
            this.addQueue(filename, callback, props);
            this.checkRequests(filename);
        }

        this.addQueue = function(filename, callback, props) {
            if (!_requests.hasOwnProperty(filename)) {
                _requests[filename] = {
                    inprog: false,
                    callbacks: []
                };
            }
            var props = props || {};
            _requests[filename].callbacks.push({
                callback: callback,
                props: props
            });
        }

        this.lineEmpty = function() {
            for (let n in _requests) {
                if (!_requests[n].resolved) {
                    return false;
                }
            }
            return true;
        }

        this.resolve = function(filename) {
            _requests[filename].inprog = false;
            _requests[filename].callbacks.shift();
            this.checkRequests(filename);
        }

        this.processes = function(filename) {
            if(!_requests.hasOwnProperty(filename) || _requests[filename] == null || _requests[filename].callbacks == null){
                return 0;
            }
            return _requests[filename].callbacks.length
        }

        this.checkRequests = function(filename) {
            if (_requests[filename].inprog) {
                return false;
            }

            if (_requests[filename].callbacks.length) {
                _requests[filename].inprog = true;
                this.callRequest(filename, _requests[filename].callbacks[0]);
            }
        }

        this.callRequest = function(filename, callback) {
            var props = callback.props || {};
            var resvoled = false;

            var timeout = setTimeout(() => {
                if(!resvoled){
                    this.resolve(filename);
                }
            }, 60000);

            callback.callback(() => {
                resvoled = true;
                clearTimeout(timeout);
                this.resolve(filename);
            }, props);
        }
    }

    function EventEmitter(){
        var _events = {};

        this.on = function(action, listener){
            if(!_events.hasOwnProperty(action)){
                _events[action] = [];
            }

            //var listener = this.listener(action);
            _events[action].push(listener);
            return listener;
        }
        this.emit = function(action, props){
            if(!_events.hasOwnProperty(action)){
                return;
            }

            for(var i = 0; i < _events[action].length; i++){
                //_events[i].callback(props || {});
                if(typeof _events[action][i] == 'function'){
                    _events[action][i](typeof props == 'undefined' ? null : props);
                }
                else{
                    console.log('FAILED to fire event on non-function', action, i, _events[action][i])
                }
            }
        }

        this.listener = function(action){
            return {
                id: $util.id(action),
                action: action,
                callback: function(){},
                do: (listener) => {
                    this.callback = listener;
                }
            }
        }
	}

    function VectorFont(){
        var ds = new DataSource()
        var cache = {}
        var fontDir = ds.$var('font_dir')
        //[{filename: "Abibas.ttf", name: "Abibas", class: "font-abibas", sequence: 1, vectorFont: true}]
        //fontname = class
        this.getFontPath = function(fontname, text, size){
            return new Promise((resolve, reject) => {
                this.getVectorFont(fontname, text, size).then((font) => {
                    var result = font.getPath(text, 0, 0, size);
                    resolve(result)
                })
            })
        }

        this.getFontPaths = function(fontname, text, size){
            return new Promise((resolve, reject) => {
                this.getVectorFont(fontname, text, size).then((font) => {
                    var result = font.getPaths(text, 0, 0, size);
                    resolve(result)
                })
            })
        }

        this.getVectorFont = function(fontname, text, size){
            return new Promise((resolve, reject) => {
                this.loadFonts().then((response) => {
                    var filename = response[fontname].filename;
                    if(false && cache.hasOwnProperty(filename)){
                        var paths = cache[filename].getPaths(text, 0, 0, size);
                        resolve(paths);
                    }
                    else{
                        this.loadFont(filename).then((font) => {
                            resolve(font)
                        })
                    }
                });
            })
        }


        this.loadFont = function(filename){
            return new Promise((resolve, reject) => {
                opentype.load(fontDir + '/' + filename, function(err, font) {
                    if (err) {
                        resolve(null)
                    } else {
                        cache[filename] = font;
                        resolve(font)
                    }
                })
            })
        }

        this.loadFonts = function(){
            return new Promise((resolve, reject) => {
                ds.http({
                    url: ds.$var('font_resource_url'),
                    success: (response) => {
                        var result = {}
                        for(var n in response){
                            result[response[n].class] = response[n]
                        }
                        resolve(result)
                    }
                });
            })
        }
    }

    var _log_key = '##log##log##log';
    function log(key) {
        if (!_debug) {
            return;
        }
        var s = [];
        for (var n in arguments) {
            if(key && typeof key == 'string' && key === _log_key){
                if(n == 0 || n == 1) continue;
            }
            if (typeof arguments[n] == 'object') s.push(JSON.stringify(arguments[n]));
            else s.push(arguments[n]);
        }
        var value = s.join(', ');
        var wrap = '';
        for(var i = 0; i < value.length; i++) wrap+= '-';
        // console.log(wrap);
        // console.log.apply(null, arguments);
    }
    log.logs = {};
    log.toggle = function(name, visible){
        if(typeof visible == undefined){
            log.logs[name].visible = !log.logs[name].visible;
        }
        else{
            log.logs[name].visible = visible;
        }
    }
    log.set = function(name){
        if(log.logs.hasOwnProperty(name)){
            if(log.logs[name].visible){
                log.apply(null, arguments);
            }
            else{
                return;
            }
        }
        else{
            log.logs[name] = {name: name, visible: false};
        }
    }

    function env() {
        if(typeof window != 'undefined' && window.cordova != null){
            return {
                nodejs: false,
                web: false,
                browser: false,
                modile: true
            };
        }
        else if (typeof module !== 'undefined' && module.exports) {
            return {
                nodejs: true,
                web: false,
                browser: false,
                modile: false
            };
        }
        else if(window.cordova == null){
            return {
                nodejs: false,
                web: true,
                browser: false,
                modile: false,
            };
        }
    }

	/**************************************/
	class _Delay{
		constructor(){
			this.ms = {
				sm: 1,
				md: 10,
				lg: 100,
				xl: 500,
			}

            this.timers = {}
            this.waiters = {}
        }

        wait(listener){
            var id = listener.toString()
            if(!this.waiters.hasOwnProperty(id)){
                this.waiters[id] = {listener: listener, timer: null}
            }

            if(this.waiters[id].timer != null){
                clearTimeout(this.waiters[id].timer)
            }
            this.waiters[id].timer = setTimeout(() => {
                this.waiters[id].listener()
                this.waiters[id].timer = null
                delete this.waiters[id]
            }, this.ms.xl)
        }

		sm(listener){
			this.timeout(listener, this.ms.sm)
		}

		md(listener){
			this.timeout(listener, this.ms.md)
		}

		lg(listener){
			this.timeout(listener, this.ms.lg)
		}

		timeout(listener, ms){
			var id = $du.id()
			this.timers[id] = setTimeout(() => {
				clearTimeout(this.timers[id])
				delete this.timers[id]
				listener()
			}, ms)
		}
	}
	class JSQL{
		constructor(name){
			this._name = name
			this._singleton = false
			this._data = {}
			this._ds = new DataSource()
		}

		singleton(v){
			this._singleton = v
		}

		sort(arr, prop, reverse){
			if(reverse) arr.sort(function(a,b) {return (a[prop] > b[prop]) ? -1 : ((b[prop] > a[prop]) ? 1 : 0);} );
			else arr.sort(function(a,b) {return (a[prop] > b[prop]) ? 1 : ((b[prop] > a[prop]) ? -1 : 0);} );
			return arr;
		}

		read(req){
			return new Promise((resolve) => {
				if(req instanceof Array){
					var records = []
					this._ds.util.each(req, (resource, next) => {
						this._ds.read(resource.id, (response) => {
							records.push(response.data)
							next()
						})
					}, () => {
						resolve(records)
					})
				}
				else if(typeof req != 'object'){
					this._ds.read(req, (response) => {
						resolve([response.data])
					})
				}
			})
		}

		write(name, data){
			return new Promise((resolve) => {
				this._ds.write(name, data, (response) => {
					resolve(response)
				})
			})
		}

		readResource(){
			return new Promise((resolve) => {
				this._ds.read(this._name, (response) => {
					resolve(response)
				})
			})
		}

		writeResource(){
			return new Promise((resolve) => {
				this._ds.write(this._name, this._data, (response) => {
					resolve(response)
				})
			})
		}

		refresh(updatedRecord){
			return new Promise((resolve) => {
				var hasRecord = false
				this.readResource().then((response) => {
					this._data = response.data
					this._data.records.forEach((record) => {
						if(updatedRecord){
							if(record.id == updatedRecord._id){
								hasRecord = true
							}
						}
					})

					if(updatedRecord){
						this._data.records = this.sort(this._data.records, 'seq')
						var resource = {
							id: updatedRecord._id,
							seq: 0
						}
						for(var n in updatedRecord){
							if(n != '_id' && this._data.indexes.hasOwnProperty(n)){
								resource[n] = updatedRecord[n]
							}
						}
						this._data.records.push(resource)

						var seq = 1
						this._data.records.forEach((record) => {
							if(record.id != updatedRecord._id){
								record.seq = seq
								seq++
							}
						})

						this.writeResource().then((response) => {
							resolve()
						})
					}
					else{
						resolve()
					}
				})
			})
		}

		create(model){
			return new Promise((resolve) => {
				var indexes = {}
				model.indexes = model.indexes || []
				model.indexes.forEach((name) => {
					if(model.table.hasOwnProperty(name)){
						indexes[name] = name
					}
					else{
						console.error('failed to create index ', name)
					}
				})
				this._data = {
					struct: model.table,
					indexes: indexes,
					records: []
				}

				this.readResource().then((response) => {
					if(response.error){
						this.writeResource().then((response) => {
							resolve()
						})
					}
					else{
						var addedColumn = false
						var addedIndex = false
						for(var n in this._data.struct){
							if(!response.data.struct.hasOwnProperty(n)){
								addedColumn = true
								response.data.struct[n] = this._data.struct[n]
							}
						}
						for(var n in this._data.indexes){
							if(!response.data.indexes.hasOwnProperty(n)){
								addedIndex = true
								response.data.indexes[n] = this._data.indexes[n]
							}
						}
						this._data = response.data

						if(addedColumn || addedIndex){
							this.writeResource().then((response) => {
								resolve()
							})
						}
						else{
							this._data = response.data
							resolve()
						}
					}
				})
			})
		}

		put(r){
			var record = {}
			for(var n in r){
				if(n == '_id' || this._data.struct.hasOwnProperty(n)){
					record[n] = r[n]
				}
			}

			return new Promise((resolve) => {
				var newRecord = record.hasOwnProperty('_id') ? false : true

				if(newRecord){
					record._id = this.createId()
				}

				this.write(record._id, record).then((response) => {
					this.refresh(record).then(() => {
						resolve(response)
					})
				})
			})
		}

		get(where){
			var records = this.filter(where)
			return new Promise((resolve) => {
				this.read(records).then((response) => {
					resolve(response)
				})
			})
		}

		remove(where){

		}

		filter(where){
			if(typeof where == 'undefined'){
				where = []
			}
			else if(!(where instanceof Array) && typeof where == 'object'){
				where = [where]
			}

			var all = where.length == 0
			var records = []
			this._data.records.forEach((record) => {
				if(all){
					records.push(record)
				}
				else{
					where.forEach((and) => {
						var columns = Object.keys(and)
						var passed = true

						for(var n in and){
							if(record.hasOwnProperty(n)){
								if(and[n] != record[n]){
									passed = false
								}
							}
							else{
								passed = false
							}
						}
						if(passed){
							records.push(record)
						}
					})
				}
			})

			return records
		}

		createId(){
			return this._name + '_' + Math.random().toString(36).substr(2, 9)
		}
	}

	class StorageTable{
		constructor(name){
			this._name = name
			this._data = []
			this._db = null
		}
		/**
			this.create({
				table: {
					version: '',
				},
				indexes: ['name']
			})
		*/
		create(config){
			this._db = new JSQL(this._name)
			return this._db.create(config)
		}

		put(data){
			return this._db.put(data)
		}

		get(where){
			return this._db.get(where)
		}

		initialize(){}
	}
    /**************************************/
    function DataState(){
        _max_length = 20;
        this.position = 0;
        this.state = [];
        this.clear = function(){
            this.state = [];
            this.position = 0;
        }
        this.set = function(data){
            if(!this.stateExists(data)){
                var slot = this.state.length == 0 ? 0 : this.position + 1;
                this.state[slot] = data;
                //slot = 3,len = 10, len - (slot + 1) = 6
                //[1,2,3,A,5,6,7]
                this.state.splice(slot + 1, (this.state.length - (slot + 1)));
                if(this.state.length > _max_length){
                    this.state.shift();
                }
                this.position = this.state.length - 1;
            }
        }
        this.stateExists = function(data){
            if(this.state[this.state.length - 1] == data){
                return true;
            }
            else{
                return false;
            }
            /*
            for(var n in this.state){
                if(this.state[n] == data){
                    return true;
                }
            }
            return false;
            */
        }
        this.canUndo = function(){
            return this.position  > 0;
        }
        this.canRedo = function(){
            return this.position < this.state.length - 1;
        }
        this.undo = function(){
            if(this.state[this.position - 1] != null){
                this.position -= 1;
                return this.state[this.position];
            }
            return null;
        }
        this.redo = function(){
            if(this.state[this.position + 1] != null){
                this.position += 1;
                return this.state[this.position];
            }
            return null;
        }
    }
	/**************************************/

    if (env().nodejs) {
        module.exports = new DataSource();
    } else {
        window.DataSource = DataSource;
        window.$data = new DataSource();
        Vue.prototype.$datasource = window.$data;
        // //window.DataTable = DataTable;
        // window.ProcessManager = ProcessManager;
        // window.EventEmitter = EventEmitter;
		// window.$em = new EventEmitter();
        // window.$du = $util;
        // window.$log = log;
		//window.$dsvar = window.$$v = _constants;
        // window.VectorFont = VectorFont
        // window.DataState = DataState
        // window.Delay = _Delay
    }
})();
