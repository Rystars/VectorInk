(function () {
	var _host_url = 'https://cool-lion-of-judah-72412788.codeanyapp.com'
	var _purge_records = false
	class JSQL_FS{
		mkdir(dir, fn) {
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

		copy(from, to, fn) {
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

		read(f, fn) {
            return new Promise((resolve, reject) => {
                var fs = require('fs');
                var fileName = f;
                fs.readFile(fileName, 'utf8', function(err, data) {
                    if(err){
                        reject(err)
                    }
                    else{
                        resolve(data)
                    }
                });
			});
		}

		readImage(f, fn) {
			var fs = require('fs');
			var fileName = f;
			fs.readFile(fileName, function(err, data) {
				fn({
					data: data,
					error: false
				});
			});
		}

		rename(oldPath, newPath, fn) {
			return new Promise((resolve, reject) => {
				var fs = require('fs');
				fs.rename(oldPath, newPath, function(err) {
					if (err) {
						reject()
					} else {
						resolve()
					}
				});
			});
		}

		write(f, x, fn) {
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
		}

		writeImage(f, x, fn) {
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
		}

		readdir(dir, fn) {
			return new Promise((resolve, reject) => {
				var fs = require('fs');
				fs.readdir(dir, function(err, files) {
					if (err) {
						reject()
					} else {
						resolve(files)
					}
				});
			})
		}

		unlink(path, fn) {
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
		}
	}
	class JSQL_UTIL {
		constructor() {
			this.listeners = {}
            this.fs = new JSQL_FS()
		}
		fetch(u, q) {
			return new Promise((resolve, reject) => {
				var url = new URL(u)
				if (q && typeof q == 'object') {
					Object.keys(q).forEach(key => url.searchParams.append(key, q[key]))
				}
				fetch(url, {
					mode: 'cors'
				}).then((response) => {
					if (!response.ok) {
						console.error('HTTP Error', response.statusText)
						reject()
					}
					response.json().then((data) => {
						resolve(data)
					})
				}).catch((error) => {
					console.error('CAUGHT HTTP Error', error);
					reject(error)
				});
			})
		}
		post(u, q) {
			return new Promise((resolve, reject) => {
				var url = new URL(u)
				fetch(url, {
					mode: 'cors',
					method: 'POST',
					headers: {
					  'Accept': 'application/json',
					  'Content-Type': 'application/json'
					},
					body: JSON.stringify(q),
				}).then((response) => {
					if (!response.ok) {
						console.error('HTTP Error', response.statusText)
						reject()
					}
					response.json().then((data) => {
						resolve(data)
					})
				}).catch((error) => {
					console.error('CAUGHT HTTP Error', error);
					reject(error)
				});
			})
		}

		each(arr, cb) {
			return new Promise((resolve) => {
				if (!(arr instanceof Array)) {
					var list = [];
					for (var n in arr) {
						list.push(arr[n]);
					}
					arr = list;
					list = null;
				}
				var i = 0;
				var ld = function () {
					if (arr[i] == null) {
						resolve()
					} else {
						cb(arr[i], () => {
							i++
							ld();
						}, i);
					}
				}
				ld();
			})
		}

		on(action, listener) {
			if (!this.listeners.hasOwnProperty(action)) {
				this.listeners[action] = []
			}
			this.listeners[action].push(listener)
		}

		emit(action, props) {
			if (!this.listeners.hasOwnProperty(action)) {
				return
			}
			this.listeners[action].forEach((listener) => {
				listener(props)
			})
		}
		uniqueId(k){
			k = k || '';
			return k + Math.random().toString(36).substr(2, 9) + '-' + ((new Date()).getTime());
		}
	}
	class JSQL_MODEL{
		constructor(Model, table, jsql){
			this._props = {
				Model: Model,
				table: table,
				jsql: jsql || null,
				primaryKey: jsql.getPrimaryKey(table),
				single: false,
				data: {},
				records: []
			}
		}
        isBuffer(data){
            return data != null && typeof data == 'object' && data.hasOwnProperty('type') && data.hasOwnProperty('data') && data.type == 'Buffer'
        }
		applyData(){
			for(var n in this._props.data){
                if(this.isBuffer(this._props.data[n])){
                    this._props.data[n] = String.fromCharCode.apply(null, new Uint16Array(this._props.data[n].data))
                }
				this[n] = this._props.data[n]
			}
		}
		releaseData(){
			for(var n in this._props.data){
				this._props.data[n] = this[n]
			}
		}
		load(query){
			this.get(query).then((data) => {
				if(data.length == 1){
					this._props.single = true
					this._props.data = data[0]
					this.applyData()
				}
				else{
					this._props.single = false
					this._props.records = data
				}
			})
		}
		get(query){
			return new Promise((resolve, reject) => {
				if(this.isServer){
                    var props = {}
                    if(query.select && query.select instanceof Array && query.select.length){
                        props.attributes = query.select
                    }
                    if(query.where){
                        props.where = query.where
                    }
                    if(query.limit){
                        props.limit = query.limit
                    }
                    if(query.offset){
                        props.offset = query.offset
                    }
					this._props.Model.findAll(props).then((data) => {
						//resolve(this._getDataValues(data))
						resolve(data)
					})
				}
				else{
					this._props.jsql.get(this._props.table, query).then((data) => {
						resolve(this._getDataValues(data))
					})
				}
			})
		}
		put(query){
			return new Promise((resolve, reject) => {
				if(this.isServer){
					query.where = query.where || {}
					if(Object.keys(query.where).length == 0){
						if(query.body.hasOwnProperty(this._props.primaryKey)){
							query.where = {}
							query.where[this._props.primaryKey] = query.body[this._props.primaryKey]
						}
					}
					this._props.Model.update(query.body, {
						where: query.where
					}).then(() => {
						resolve({success: 1})
					})
				}
				else{
					if(this._props.single){
						if(Object.values(this._props.data).length == 0){
							resolve(this._props.data)
						}
						else{
							this.releaseData()
                            if(!this._props.data.id){
                                reject('the id on this model is not set. select id when fetching this model')
                            }
							this._props.jsql.put(this._props.table, this._props.data, {id: this._props.data.id}).then((data) => {
								resolve(data)
							})
						}
					}
				}
			})
		}
		create(query){
			return new Promise((resolve, reject) => {
				if(this.isServer){
					this._props.Model.create(query.body).then((model) => {
						resolve(model.get({plain: true}))
					})
				}
				else{
					if(this._props.single){
						if(Object.values(this._props.data).length == 0){
							resolve(this._props.data)
						}
						else{
							this.releaseData()
							this._props.jsql.add(this._props.table, this._props.data).then((data) => {
								resolve(data)
							})
						}
					}
				}
			})
		}
		delete(query){
			return new Promise((resolve, reject) => {
				if(this.isServer){
					this._props.Model.destroy(query.where).then((model) => {
						resolve({success: 1})
					})
				}
				else{
					if(this._props.single){
						if(Object.values(this._props.data).length == 0){
							resolve(this._props.data)
						}
						else{
							this._props.jsql.delete(this._props.table, {where: {id: this._props.data.id}}).then((data) => {
								resolve(data)
							})
						}
					}
				}
			})
		}
		_getDataValues(queryResponse){
			var response = []
			if (queryResponse) {
				queryResponse.forEach((record) => {
					response.push(record.dataValues)
				})
			}
			return response
		}
		get isServer(){
			return this._props.jsql != null && this._props.jsql.state.server
		}
		get isClient(){
			if(this._props.jsql != null){
				return this._props.jsql.state.client
			}
			return true
		}
		get data(){
			return this._props.data
		}
		set data(data){
			this._props.data = data
            this._props.single = true
			this.applyData()
		}
	}
	class JSQL_CLI {
		constructor() {
			this.util = new JSQL_UTIL()
			this.host = _host_url
			this.url = {
				test: '/jsql_test',
				query: '/jsql_query',
				put: '/jsql_put',
				add: '/jsql_create',
				delete: '/jsql_delete',
				config: '/jsql_config',
			}
		}
		parseQuery(request){
			var query = request.query
			var result = {}
			result.table = query.table
			result.query = JSON.parse(query.query)
			return result
		}
		parseBody(request){
			var result = request.body
			if(typeof request.body == 'string'){
				result = JSON.parse(request.body)
			}
			if(result.query && typeof result.query == 'string'){
				result.query = JSON.parse(result.query)
			}
			return result
		}
		get(url, props){
			return new Promise((resolve, reject) => {
				this.util.fetch(this.host + url, props).then((response) => {
					resolve(response)
				})
			})
		}
		post(url, props){
			return new Promise((resolve, reject) => {
				this.util.post(this.host + url, props).then((response) => {
					resolve(response)
				})
			})
		}
		query(table, props){
			return new Promise((resolve, reject) => {
				//var select = props.select || []
				//var where = props.where || {}
				var req = {
					table: table,
					query: JSON.stringify(props)
				}
				this.util.fetch(this.host + this.url.query, req).then((response) => {
					resolve(response)
				})
			})
		}
		put(table, body, where){
			return new Promise((resolve, reject) => {
				var req = {
					table: table,
					query: JSON.stringify({body: body, where: where})
				}
				this.util.post(this.host + this.url.put, req).then((response) => {
					resolve(response)
				})
			})
		}
		add(table, body){
			return new Promise((resolve, reject) => {
				var req = {
					table: table,
					query: JSON.stringify({body: body})
				}
				this.util.post(this.host + this.url.add, req).then((response) => {
					resolve(response)
				})
			})
		}
		delete(table, where){
			return new Promise((resolve, reject) => {
				var req = {
					table: table,
					query: JSON.stringify({where: where})
				}
				this.util.post(this.host + this.url.delete, req).then((response) => {
					resolve(response)
				})
			})
		}
	}
	class JSQL {
		constructor() {
			this.util = new JSQL_UTIL()
			this.cli = new JSQL_CLI()
			this.Sequelize = null
			this.db = null
			this.purge = _purge_records
			this.models = {}
			this.definitions = {}
			this.state = {
				connected: false,
				server: false,
				client: true,
			}
            this._config = null
		}
		test(str){
			return new Promise((resolve, reject) => {
				this.cli.get(this.cli.url.test, {str: str}).then((response) => {
					console.log(response)
					resolve(response)
				})
			})
		}
		get(table, props){
			return new Promise((resolve, reject) => {
				this.cli.query(table, props).then((response) => {
					var records = []
					response.forEach((record) => {
						var Model = new JSQL_MODEL(this.models[table], table, this)
						Model.data = record
						records.push(Model)
					})
					console.log(records)
					resolve(records)
				})
			})
		}
		put(table, body, where){
			return new Promise((resolve, reject) => {
				this.cli.put(table, body, where).then((response) => {
					console.log(response)
					resolve(response)
				})
			})
		}
		add(table, body){
			return new Promise((resolve, reject) => {
				this.cli.add(table, body).then((response) => {
					console.log(response)
					resolve(response)
				})
			})
		}
        delete(table, where){
			return new Promise((resolve, reject) => {
				this.cli.delete(table, where).then((response) => {
					console.log(response)
					resolve(response)
				})
			})
        }
		/******************************/
		//SERVER METHODS
		_listen(app) {
			app.get(this.cli.url.test, (req, res) => {
				this.__test(req.query).then((response) => {
					res.status(200).json(response)
				}).catch((error) => {
					console.error(error)
					res.writeHead(404)
				})
			})
			app.get(this.cli.url.config, (req, res) => {
				res.status(200).json(this._config)
			})
			app.get(this.cli.url.query, (req, res) => {
				this.__query(this.cli.parseQuery(req)).then((response) => {
					res.status(200).json(response)
				}).catch((error) => {
					console.error(error)
					res.writeHead(404)
				})
			})
			app.post(this.cli.url.put, (req, res) => {
				this.__put(this.cli.parseBody(req)).then((response) => {
					res.status(200).json(response)
				}).catch((error) => {
					console.error(error)
					res.writeHead(404)
				})
			});
			app.post(this.cli.url.add, (req, res) => {
				this.__add(this.cli.parseBody(req)).then((response) => {
					res.status(200).json(response)
				}).catch((error) => {
					console.error(error)
					res.writeHead(404)
				})
			});
			app.post(this.cli.url.delete, (req, res) => {
				this.__delete(this.cli.parseBody(req)).then((response) => {
					res.status(200).json(response)
				}).catch((error) => {
					console.error(error)
					res.writeHead(404)
				})
			});
		}
        _configure(){
            return new Promise((resolve, reject) => {
                this.util.fs.read('jsql/config.json').then((data) => {
                    this._config = JSON.parse(data)
                    this.define(this._config.tables).then(() => {
                        resolve()
                    })
                })
            })
        }
		__test(req){
			return new Promise((resolve, reject) => {
				var code = req.str
				var result = []
				code.split(';')
				this.util.each(code, (str, next) => {
					if(str.indexOf('@') != -1){
						var props = str.split(' ')
						var model = props[0]
						var func = props[1]
						var args = props[2].split(',')
						var params = {}
						for(var n in args){
							var kv = args[n].split(':')
							params[kv[0]] = kv[1]

						}
						this.table[model][func](params).then((response) => {
							result.push({model: model, method: func, response: response})
							next()
						})
					}
				}).then(() => {
					resolve(result)
				})
			})
		}
		__query(req) {
			return new Promise((resolve, reject) => {
				if (!this.state.connected) {
					reject('JSQL NOT CONNECTED')
					return
				}

				var table = req.table

				if (!this.has(table)) {
					reject('JSQL TABLE ' + table + ' DOES NOT EXIST')
					return
				}

				var Model = new JSQL_MODEL(this.models[table], table, this)
				Model.get(req.query).then((data) => {
					resolve(data)
				})
			})
		}
		__put(req){
			this._log(req)
			return new Promise((resolve, reject) => {
				if (!this.state.connected) {
					reject('JSQL NOT CONNECTED')
					return
				}

				var table = req.table

				if (!this.has(table)) {
					reject('JSQL TABLE ' + table + ' DOES NOT EXIST')
					return
				}

				var Model = new JSQL_MODEL(this.models[table], table, this)
				Model.put(req.query).then((response) => {
					resolve(response)
				})
			})
		}
		__add(req){
			this._log(req)
			return new Promise((resolve, reject) => {
				if (!this.state.connected) {
					reject('JSQL NOT CONNECTED')
					return
				}

				var table = req.table

				if (!this.has(table)) {
					reject('JSQL TABLE ' + table + ' DOES NOT EXIST')
					return
				}

				var Model = new JSQL_MODEL(this.models[table], table, this)
				Model.create(req.query).then((response) => {
					resolve(response)
				})
			})
		}
		__delete(req){
			this._log(req)
			return new Promise((resolve, reject) => {
				if (!this.state.connected) {
					reject('JSQL NOT CONNECTED')
					return
				}

				var table = req.table

				if (!this.has(table)) {
					reject('JSQL TABLE ' + table + ' DOES NOT EXIST')
					return
				}

				var Model = new JSQL_MODEL(this.models[table], table, this)
				Model.delete(req.query).then((response) => {
					resolve(response)
				})
			})
		}
		/******************************
		create
			jsql.create({
				name: 'users',
				fields: {
					first_name: {
						type: 'STRING',
						field: 'first_name'
					}
				}
			})
		*/
		connect(app, database, user, password) {
			this.Sequelize = require('sequelize')
            this._objects = {
                user: require('../jsql/modules/user')
            }
			this.db = new this.Sequelize(database, user, password, {
				host: 'localhost',
				dialect: 'mysql',
				pool: {
					max: 5,
					min: 0,
					idle: 10000
				},
			})
			this.state.connected = true
			this.state.server = true
			this.state.client = false
			this._log('--connected--')
			this._listen(app)
            return this._configure()
		}
        query(qs, props, type){
            type = type || 'SELECT'
            return this.db.query(qs, { replacements: props, type: this.db.QueryTypes[type] })
        }
        getConfig(){
            return this._config
        }
        getDefinitions(){
            return this._config.tables
        }
        getPrimaryKey(tableName){
            for(var index in this._config.tables){
                if(this._config.tables[index].name == tableName){
                    for(var field in this._config.tables[index].fields){
                        if(this._config.tables[index].fields[field].hasOwnProperty('primaryKey') && this._config.tables[index].fields[field].primaryKey){
                            return {name: field, config: this._config.tables[index].fields[field]}
                        }
                    }
                }
            }
            return null
        }
		onDefinitionsLoaded() {
			this._log('--DefinitionsLoaded--')
			this.emit('load')
		}
		define(definitions) {
			return new Promise((resolve, reject) => {
				for(var n in definitions){
					this.create(definitions[n])
				}
				for(n in definitions){
					this.relate(definitions[n])
				}
				this.util.each(this.models, (table, next) => {
					table.sync({
						force: this.purge
					}).then(() => {
						next()
					})
				}).then(() => {
					this.onDefinitionsLoaded()
					resolve()
				})
			})
		}
		create(props) {
			for (var n in props.fields) {
				props.fields[n].type = this.Sequelize[props.fields[n].type.toUpperCase()]
				props.fields[n].allowNull = true
			}
			var options = {
                createdAt: 'created_at',
                updatedAt: 'updated_at',
				underscored: true,
				freezeTableName: true // Model tableName will be the same as the model name
			}
			if(props.indexes){
				options.indexes = props.indexes
			}
			var table = this.db.define(props.name, props.fields, options, props.config || null);

			this.models[props.name] = table
		}
		relate(props){
			var table = this.models[props.name]
			if(props.hasOwnProperty('belongsToMany')){
				if(typeof props.belongsToMany == 'object' && !(props.belongsToMany instanceof Array)){
					props.belongsToMany = [props.belongsToMany]
				}

				props.belongsToMany.forEach((assoc) => {
					table.belongsToMany(this.models[assoc.table], assoc.props)
				})
			}
			if(props.hasOwnProperty('hasMany')){
				if(typeof props.hasMany == 'object' && !(props.hasMany instanceof Array)){
					props.hasMany = [props.hasMany]
				}

				props.hasMany.forEach((assoc) => {
					table.hasMany(this.models[assoc.table], assoc.props)
				})
			}
		}
		has(tablename) {
			return this.models.hasOwnProperty(tablename)
		}
		on(action, listener) {
			this.util.on(action, listener)
		}
		emit(action, props) {
			this.util.emit(action, props)
		}
		_log() {
			if(this.state.server){
				console.log('--jsql--server--')
			}
			else{
				console.log('--jsql--client--')
			}
			console.log.apply(null, arguments)
		}
		get table(){
			return this.models
		}
	}

	if (typeof module != 'undefined' && module.exports) {
		module.exports = new JSQL()
	} else {
		window.JSQL_CLI = JSQL_CLI
		window.jsql = JSQL
	}
})()