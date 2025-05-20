(function(){
	var __ = (function(og){
		class SESSION extends og.storage{
			constructor(server, db){
				super(server, db, 'session')

				this.attributes('default', 	['session_id', 'user_id', 'created_at', 'updated_at'])
				this.attributes('create', 	['session_id', 'user_id', 'created_at', 'updated_at'])
				this.attributes('update', 	['session_id', 'user_id', 'created_at', 'updated_at'])
                this.attributes('delete', 	['session_id'])

				this._key('primary', 		    'session_id')
				this._get('read_session', 	    this.__read)
				this._post('create_session',    this.__create)
				this._post('update_session', 	this.__update)
				this._post('delete_session', 	this.__delete)
			}
			__create(promise, columns){
                this._create(columns, {generateId: false}).then((result) => {
                    this.__read(promise, result)
                })

            }
			__read(promise, columns){
				this._read(columns).then((response) => {
					promise.resolve(response)
				})
			}
			__update(promise, columns){
				this._update(columns).then((response) => {
					promise.resolve(response)
				})
			}
			__delete(promise, columns){
				this._delete(columns).then((response) => {
					promise.resolve(response)
				})
            }
			read(where){
				return og.env.on({
					server: () => {
						return this._read(where)
					},
					client: () => {
						return this.get('read_session', where)
					},
				})
			}
			create(columns){
				return og.env.on({
					server: () => {
						return this._create(columns, {generateId: false}).then((result) => {
							return this._read(result)
						})
					},
					client: () => {
						return this.post('create_session', columns)
					},
				})
			}
			update(columns){
				return og.env.on({
					server: () => {
						return this._update(columns)
					},
					client: () => {
						return this.post('update_session', columns)
					},
				})
			}
			delete(columns){
				return og.env.on({
					server: () => {
						return this._delete(columns)
					},
					client: () => {
						return this.post('delete_session', columns)
					},
				})
			}
			read_user(session_id){
				return new Promise((resolve) => {
					this.alias = 's'

					var user = this._server.getModule('USER')
					user.alias = 'u'
					this.query([
						'SELECT',	's.session_id,', user.select.default,
						'FROM',		this.table,
						'JOIN', 	user.table, 'ON', user.primaryKey, ' = s.user_id',
						'WHERE',	['s.session_id', '=', session_id]
					])
					.run({type:'SELECT', replacements: [session_id]})
					.then((response) => {
						this.alias = null
						user.alias = null
						resolve(this._first(response))
					})
				})
			}

			_generateId(columns){
				return !og.u.has(columns, 'session_id') || columns.session_id.toString().length == 0
			}
		}
		og.server.include(SESSION, og.server.types.DM)
		og.use(SESSION, {as: 'dm_session', singleton: false})
    })
	if(typeof module != 'undefined' && module.exports){module.exports = function(og){__(og);return {}}} else{__(og)}
})()