(function(){
	var __ = (function(og){
		/*===================================================================================
		=	ATTRIBUTE CLASSES																=
		====================================================================================*/
		class OGQL_ATTRIBUTES{
			constructor(attributes){
				this._attributes = attributes
				this.alias = null
			}
			join(list){
				if(this.alias){
					return this.alias + '.' + list.join(', ' + this.alias + '.')
				}
				else{
					return list.join(', ')
				}
			}

			get attributes(){
				return this._attributes
			}
			get format(){
				return this.join(this._attributes)
			}
		}
		class OGQL_REPLACEMENT_SETS extends OGQL_ATTRIBUTES{
			constructor(attributes){
				super(attributes)
			}
			get format(){
				var result = []
				this.attributes.forEach((attr) => {
					result.push(attr + ' = :' + attr)
				})
				return result.join(', ')
			}
		}
		class OGQL_REPLACEMENTS extends OGQL_ATTRIBUTES{
			constructor(attributes){
				super(attributes)
				this.valueSets = 1
				this._sets = new OGQL_REPLACEMENT_SETS(attributes)
			}
			get sets(){
				return this._sets
			}
			get formattedValues(){
				return og.u.duplicate('(\'' + og.u.substitute(this.attributes, '?').join('\', \'') + '\')', this.valueSets)
			}
			get format(){
				return 'VALUES ' + this.formattedValues
			}
		}
		class OGQL_VALUES extends OGQL_ATTRIBUTES{
			constructor(attributes){
				super(attributes)
				this._replacements = new OGQL_REPLACEMENTS(attributes)
			}
			get replacements(){
				return this._replacements
			}
			get format(){
				return '(' + this.attributes.join(', ') + ')'
			}
		}
		class OGQL_QUERY{
			constructor(query){
				this._query = query
			}
			/**
			 * 	example *
				this.query([
					'SELECT', 	this.attr.default, this.category.default,
					'FROM', 	this.table,
					'LEFT JOIN',this.category, 'ON', this.category.user_id, '=', this.primary
					'WHERE', 	[this.primary, '=', columns.user_id], 'AND(', [this.category.type, '=', 'private'], 'OR', [this.category.type, '=', 'global'], ')'
				], {
					alias: [
						[this.table, 'u']
						[this.category, 'c']
					]
				}).rows()
				* possible conditions
				* [this.primary, '=', columns.user_id]
				* [this.primary, 'NI(', columns.user_id, ')']
				* [this.primary, 'IN(', columns.user_id, ')']
				* [this.primary, '!=', columns.user_id]
				*/
				run(){
					var result = []
					var replacements = []
					var replaceWith = '?'
					this._query.forEach((parts) => {
						var part = null
						if(parts instanceof Array){
							let col = 	this._parse(parts[0])
							let op 	= 	this._parse(parts[1])
							let val = 	this._parse(parts[2])
							let cls = 	this._parse(parts[3], op)
							part = [col, op, replaceWith, cls]
							part = part.filter(part => part != null).join(' ')
							replacements.push(val)
						}
						else{
							part =	this._parse(parts)
						}
						result.push(part)
					})
					return {
						query: result.join(' '),
						replacements: replacements,
					}
				}
				_parse(part, op){
					if(op){
						//op = 'IN('
						//'part = ')'
						if(part && part.indexOf(')') == 0 && op.indexOf('(') == op.length - 1){
							return part
						}
						else{
							return null
						}
					}
					else{
						if(part instanceof OGQL_ATTRIBUTES){
							part = part.format
						}
						else if(part instanceof Array){
							part = part.join(', ')
						}
						return part
					}
				}
		}
		/*===================================================================================
		=	MODULE CLASSES																	=
		====================================================================================*/
		class SERVER_STORAGE extends og.module{
			constructor(server, db, table){
				super()
				this._server = server
				this._db = db
				this._table = table
				this._alias = null
				this._attributes = {}
				this._values = {}
				this._select = {}
				this._routes = {}
				this._keys = {
					primary: null,
				}
				this._relations = []
				this._replacements = {
					values: null,//new OGQL_REPLACEMENTS()
				}
			}
			attributes(name, attributes){
				this._attributes[name] = new OGQL_ATTRIBUTES(attributes)
				this._values[name] = new OGQL_VALUES(attributes)
			}
			references(relations){}
			relations(relations){}
			replace(attributes, columns, values){
				var attr = attributes.attributes
				var result = values
				attr.forEach((name) => {
					if(og.u.has(columns, name)){
						if(og.u.is(values, 'array')){
							result.push(columns[name])
						}
						else{
							result[name] = columns[name]
						}
					}
					else{
						var field = this._db.getField(this._table, name)
						if(og.u.is(values, 'array')){
							result.push(og.u.cast('', field.type))
						}
						else{
							result[name] = og.u.cast('', field.type)
						}
					}
				})
				return result
			}
			get(route, req){
				return og.http.get(og.url(this._routes[route].path), req)
			}
			post(route, body){
				return og.http.post(og.url(this._routes[route].path), body)
			}
			_key(type, column){
				this._keys[type] = column
			}
			_get(path, method, options){
				if(og.env.server){
					options = og.u.defaults(options, {
						auth: false
					})

					this._server.get('/' + path, (result, req, res, data) => {
						return new Promise((resolve, reject) => {
							console.log('--GET: ', this.table, method.name, '--')
							if(options.auth){
								if(data && data.user && data.user.user_id){
									method.call(this, {resolve: resolve, reject: reject}, result, data.user, req, res)
								}
								else{
									console.error('MUST BE LOGGED IN. CANNOT ACCESS THIS ENDPOINT', path, data)
								}
							}
							else{
								method.call(this, {resolve: resolve, reject: reject}, result, req, res, data)
							}
						})
					})
				}
				else{
					this._routes[path] = {
						path: path,
						method: method,
						options: options
					}
				}
			}
			_post(path, method, options){
				if(og.env.server){
					options = og.u.defaults(options, {
						auth: false
					})
					this._server.post('/' + path, (result, req, res, data) => {
						return new Promise((resolve, reject) => {
							console.log('--POST: ', this.table, method.name, '--')
							if(options.auth){
								if(data && data.user && data.user.user_id){
									method.call(this, {resolve: resolve, reject: reject}, result, data.user, req, res)
								}
								else{
									console.error('MUST BE LOGGED IN. CANNOT ACCESS THIS ENDPOINT', path, data)
								}
							}
							else{
								method.call(this, {resolve: resolve, reject: reject}, result, req, res, data)
							}
						})
					})
				}
				else{
					this._routes[path] = {
						path: path,
						method: method,
						options: options
					}
				}
			}
			check(columns, props){
				return new Promise((resolve) => {
					this._read(columns, props).then((result) => {
						resolve(result != null)
					})
				})
			}
			_read(columns, props){
				return new Promise((resolve) => {
					props = og.u.defaults(props, {
						where: this._where(columns),
						replace: this._primaryKeyReplacement(columns),
						single: true,
					})
					var replacements = props.replace
					var where = props.where
					this.query([
						'SELECT', 	this.select.default,
						'FROM',		this.table,
						'WHERE',	where
					])
					.run({type:'SELECT', replacements: replacements})
					.then((response) => {
						if(props.single){
							resolve(this._first(response))
						}
						else{
							resolve(response)
						}
					})
				})
			}
			_create(columns, props){
                return new Promise((resolve) => {
					props = og.u.defaults(props, {
						generateId: true,
					})

					if(props.generateId){
						columns[this.primaryKey] = og.u.uniqueId()
					}

                    this.query([
                        'INSERT', 'INTO', this.table, 'SET',
                        this.values.create.replacements.sets
                    ])
                    .replace(columns)
                    .then(() => {
                        resolve(columns)
                    })
                })
			}
			_update(columns){
                return new Promise((resolve) => {
					this.query([
						'UPDATE', 	this.table,
						'SET',		this.values.update.replacements.sets,
						'WHERE', 	this._keys.primary + ' = :' + this._keys.primary
					])
					.replace(columns)
					.then((response) => {
						resolve({})
					})
                })
			}
			_delete(columns){
                return new Promise((resolve) => {
					this.query([
						'DELETE',
						'FROM',		this.table,
						'WHERE',	this._where(columns)
					])
					.replace(columns)
					.then((response) => {
						resolve({})
					})
                })
			}
			_where(columns){
				for(var n in this._keys){
					if(og.u.has(columns, this._keys[n]) && og.u.isset(columns[this._keys[n]]) && og.u.string(columns[this._keys[n]]).length){
						return [this._keys[n], '=', columns[this._keys[n]]]
					}
				}
				return []
			}
			_primaryKeyReplacement(columns){
				for(var n in this._keys){
					if(og.u.has(columns, this._keys[n]) && og.u.isset(columns[this._keys[n]]) && og.u.string(columns[this._keys[n]]).length){
						return [columns[this._keys[n]]]
					}
				}
				return []
			}
			_first(response){
				if(response instanceof Array){
					if(response.length > 0){
						return response[0]
					}
					else{
						return null
					}
				}
				return null
			}
			query(query){
				var ogql_query = new OGQL_QUERY(query)
				return {
					run: (props) => {
						return new Promise((resolve, reject) => {
							props = og.u.defaults(props, {
								type: 'SELECT',
								replacements: null,
								log: false
							})
							var result = ogql_query.run()
							/*********/
							if(props.log){
								og.log('--OG QUERY--')
								og.log(result.query)
								og.log('--OG REPLACE--')
								og.log(result.replacements)
								og.log('-----QUERY PROPS-------')
								og.log(props)
							}
							/*********/
							props.replacements = props.replacements || result.replacements
							this._db.query(result.query, props || {}).then((result) => {
								resolve(result)
							})
						})
					},
					replace: (columns) => {
						return new Promise((resolve, reject) => {
							var result = ogql_query.run()
							var props = {}
							props.type = query[0]
							props.replacements = null
							switch(props.type){
								case 'SELECT':
									props.replacements = this.replace(this.select.default, columns, [])
									break
								case 'INSERT':
									props.replacements = this.replace(this.values.create, columns, {})
									break
								case 'UPDATE':
									props.replacements = this.replace(this.values.update, columns, {})
									break
								case 'DELETE':
									props.replacements = this.replace(this.values.delete, columns, [])
									break
								default:
									og.error('INVALID QUERY', query)
									resolve(null)
									return
							}

							//og.log(result.query)
							//og.log(props)

							this._db.query(result.query, props).then((result) => {
								resolve(result)
							})
						})
					},
				}
			}
			get primaryKey(){
				if(this._alias){
					return this._alias + '.' + this._keys.primary
				}
				else{
					return this._keys.primary
				}
			}
			get table(){
				if(this._alias){
					return this._table + ' ' + this._alias
				}
				else{
					return this._table
				}
			}
			get select(){
				return this._attributes
			}
			get values(){
				return this._values
			}
			get routes(){
				return this._routes
			}
			set alias(v){
				this._alias = v
				for(var n in this._attributes){
					this._attributes[n].alias = this._alias
				}
			}
		}
		og.use(SERVER_STORAGE, {as: 'storage', singleton: false})
	})
	if(typeof module != 'undefined' && module.exports){module.exports = function(og){__(og);return {}}} else{__(og)}
})()