(function(){
	var __ = (function(og){
		class USER_ASSOC extends og.storage{
			constructor(server, db){
				super(server, db, 'user_assoc')
				this.attributes('default', 	['assoc_id', 'user_a_id', 'user_b_id', 'connect_type', 'status', 'relationship', 'created_at', 'updated_at'])
				this.attributes('user', 	['assoc_id', 'user_a_id', 'user_b_id', 'connect_type', 'status', 'relationship', 'created_at', 'updated_at'])
				this.attributes('create', 	['assoc_id', 'user_a_id', 'user_b_id', 'connect_type', 'status', 'relationship', 'created_at', 'updated_at'])
				this.attributes('update', 	['user_a_id', 'user_b_id', 'connect_type', 'status', 'relationship'])
				this.attributes('delete', 	['assoc_id'])

				this._key('primary', 		'assoc_id')

				this._get('assoc_follow', 	this.__follow, 	{auth: true})
				this._get('assoc_read', 	this.__read)

				this._types = {
					follow: 'FL',
					friend: 'FR',
				}
			}

			__follow(promise, columns, req, res, data){
				this._follow(columns, req, res, data).then((result) => {
					promise.resolve(result)
				})
			}
			__read(promise, columns){
				this._read(columns).then((result) => {
					promise.resolve(result)
				})
			}
			__check(user_a_id, user_b_id, type){
				return new Promise((resolve, reject) => {
					this.query([
						'SELECT',	this.select.user,
						'FROM',		this.table,
						'WHERE',
						'(',
							'(', ['user_a_id', '=', user_a_id], 'AND', ['user_b_id', '=', user_b_id], ')',
							'OR',
							'(', ['user_a_id', '=', user_b_id], 'AND', ['user_b_id', '=', user_a_id], ')',
						')', 'AND', ['connect_type', '=', type]
					])
					.run({type:'SELECT', replacements: [user_a_id, user_b_id, user_b_id, user_a_id, type]})
					.then((response) => {
						resolve(response.length > 0)
					})
				})
			}
			__check_following(user_a_id, user_b_id, type){
				return new Promise((resolve, reject) => {
					this.query([
						'SELECT',	this.select.user,
						'FROM',		this.table,
						'WHERE',
						'(',
							['user_a_id', '=', user_a_id], 'AND', ['user_b_id', '=', user_b_id],
						')', 'AND', ['connect_type', '=', type]
					])
					.run({type:'SELECT', replacements: [user_a_id, user_b_id, user_b_id, user_a_id, type]})
					.then((response) => {
						resolve(response.length > 0)
					})
				})
			}
			_follow(columns, auth){
				return new Promise((resolve, reject) => {
					columns.user_b_id = auth.user_id
					this.__check_following(columns.user_id, columns.user_b_id, this._types.follow).then((exists) => {
						if(exists){
							og.log('Already Following')
							resolve({error: {message: 'Already Following'}})
						}
						else{
							this._create({
								user_a_id: columns.user_id,
								user_b_id: columns.user_b_id,
								connect_type: this._types.follow
							}).then((result) => {
								result.error = null
								resolve(result)
							})
						}
					})
				})
			}
			_read(columns){
				return new Promise((resolve, reject) => {
					this.alias = 'a'

					var user = this._server.getModule('USER')
					user.alias = 'b'
					this.query([
						'SELECT',	this.select.user, ', ', user.select.basic,
						'FROM',		this.table,
						'JOIN', 	user.table, 'ON', user.primaryKey, '=', 'a.user_a_id', 'OR', user.primaryKey, '=', 'a.user_b_id',
						'WHERE',	['b.user_id', '=', columns.user_id]
					])
					.run({type:'SELECT', replacements: [columns.user_id]})
					.then((response) => {
						user.alias = null
						this.alias = null
						resolve(response)
					})
				})
			}
			follow(where, user_a){
				return og.env.on({
					server: () => {
						return this._follow(where, user_a)
					},
					client: () => {
						return this.get('assoc_follow', where)
					},
				})
			}
			read(where){
				return og.env.on({
					server: () => {
						return this._read(where)
					},
					client: () => {
						return this.get('assoc_read', where)
					},
				})
			}
			read(where){
				return og.env.on({
					server: () => {
						return this._read(where)
					},
					client: () => {
						return this.get('assoc_read', where)
					},
				})
			}
		}
		og.server.include(USER_ASSOC, og.server.types.DM)
		og.use(USER_ASSOC, {as: 'dm_user_assoc', singleton: false})
	})
	if(typeof module != 'undefined' && module.exports){module.exports = function(og){__(og);return {}}} else{__(og)}
})()