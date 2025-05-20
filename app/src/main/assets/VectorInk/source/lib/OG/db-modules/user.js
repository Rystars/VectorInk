(function(){
	var __ = (function(og){
		class USER extends og.storage{
			suggested_users(props, req, res, data){
				return og.env.on({
					server: () => {
						return this._suggested_users(props, req, res, data)
					},
					client: () => {
						return this.get('suggested_users', props)
					},
				})
			}
			associated_users(props, req, res, data){
				return og.env.on({
					server: () => {
						return this._associated_users(props, req, res, data)
					},
					client: () => {
						return this.get('associated_users', props)
					},
				})
			}
			add_assoc_user_to_groups(owner_id, user_id){
				return new Promise((resolve) => {
					this._read_owner_group(owner_id, this._groups.feed).then((record_group) => {
						this._fetch_unique_group(owner_id, user_id, this._groups.feed).then((result) => {
							if(result){
								console.log('in_group')
								resolve(result)
							}
							else{
								this._add_to_group(record_group[0].record_group_id, user_id).then((result) => {
									resolve(result)
								})
							}
						})
					})
				})
			}
			read_owner_feed_group(owner_id){
				return new Promise((resolve) => {
					this._read_owner_group(owner_id, this._groups.feed).then((record_group) => {
						resolve(record_group)
					})
				})
			}
			read_user_groups(user_id){
				return new Promise((resolve) => {
					this._read_user_group(user_id, this._groups.feed).then((record_groups) => {
						resolve(record_groups)
					})
				})
			}
			follow_user(user_id, auth){
				return new Promise((resolve) => {
					var user_assoc = og.server.module('USER_ASSOC')
					user_assoc.follow({user_id: user_id}, auth).then((result) => {
						if(result.error){
							resolve(result)
						}
						else{
							this.add_assoc_user_to_groups(auth.user_id, user_id).then((result) => {
								resolve(result)
							})
						}
					})
				})
			}

			constructor(server, db){
				super(server, db, 'user')
				this.attributes('default', 	['user_id', 'firebase_id', 'user_name', 'email', 'name', 'seller_account_id', 'created_at', 'updated_at'])
				this.attributes('create', 	['user_id', 'firebase_id', 'user_name', 'email', 'name', 'created_at', 'updated_at'])
				this.attributes('basic', 	['user_id', 'user_name', 'email', 'name', 'created_at'])
				this.attributes('update', 	['user_name', 'email', 'name', 'seller_account_id'])
				this.attributes('delete', 	['user_id'])

				this._key('primary', 		'user_id')
				this._key('firebase_id', 	'firebase_id')

				this._get('read_user', 				this.__read)
				this._post('create_user', 			this.__create)
				this._post('update_user', 			this.__update)
				this._post('delete_user', 			this.__delete)
				this._get('suggested_users', 		this.__suggested_users,		{auth: true})
				this._get('associated_users', 		this.__associated_users,	{auth: true})
				this._get('start_broadcast', 		this.__start_broadcast,		{auth: true})
				this._get('join_broadcast', 		this.__join_broadcast,		{auth: true})

				this._groups = {
					feed: 'feed',
					broadcast: 'broadcast',
				}
			}
			__create(promise, props){
                this._create(props).then((result) => {
					this._create_group(result, this._groups.feed).then(() => {
						this.__read(promise, result)
					})
                })
            }
			__read(promise, props){
				this._read(props).then((response) => {
					promise.resolve(response)
				})
			}
			__update(promise, props){
				this._update(props).then((response) => {
					promise.resolve({})
				})
			}
			__delete(promise, props){
				this._delete(props).then((response) => {
					promise.resolve({})
				})
			}
			__suggested_users(promise, props, user){
				this._suggested_users(props, user).then((result) => {
					promise.resolve(result)
				})
			}
			__associated_users(promise, props, user){
				this._associated_users(props, user).then((result) => {
					promise.resolve(result)
				})
			}
			__start_broadcast(promise, props, user){
				this._start_broadcast(user).then((result) => {
					promise.resolve(result)
				})
			}
			__join_broadcast(promise, props, user){
				this._join_broadcast(props.user_id, user).then((result) => {
					promise.resolve(result)
				})
			}

			_join_broadcast(owner_id, user){
				return new Promise((resolve, reject) => {
					this._read_owner_group(owner_id, this._groups.broadcast).then((record_group) => {
						this._fetch_unique_group(owner_id, user.user_id, this._groups.broadcast).then((result) => {
							if(result){
								console.log('in_group')
								resolve(result)
							}
							else{
								this._add_to_group(record_group[0].record_group_id, user.user_id).then((result) => {
									resolve(result)
								})
							}
						})
					})
				})
			}

			_start_broadcast(props, user){
				return new Promise((resolve, reject) => {
					this._read_owner_group(user.user_id, this._groups.broadcast).then((record_group) => {
						if(record_group == null){
							this._create_group(user, this._groups.broadcast, props).then((result) => {
								resolve(result)
							})
						}
						else{
							resolve(record_group)
						}
					})
				})
			}

			_stop_broadcast(){
				//delete record_group broadcast record when user is done
			}
			_read_broadcasts(){
				return new Promise((resolve, reject) => {
					this.query([
						'SELECT a.*,b.user_id FROM record_group a',
						'JOIN user b ON b.user_id = a.owner_id',
						'WHERE a.owner_table="user"',
						'AND',
						['a.type', 		'=', type],
						'AND',
						['b.user_id', 	'=', user_id],
					])
					.run({type: 'SELECT', replacements: [type, user_id], log: false})
					.then((result) => {
						resolve(result)
					})
				})
			}

			_create_group(user, type, props){
				return new Promise((resolve, reject) => {
					props = props || {}
					let columns = {
						record_group_id: og.u.uniqueId(),
						owner_id: user.user_id,
						owner_table: 'user',
						name: 'user-' + type + '-' + user.user_id,
						description: props.description || '',
						type: type,
					}
					this.query([
						'INSERT INTO record_group SET',
						'record_group_id = :record_group_id, owner_id = :owner_id, owner_table = :owner_table, name = :name, type = :type'
					])
					.run({type: 'INSERT', replacements: columns, log: true})
					.then(() => {
						return this._add_to_group(columns.record_group_id, user.user_id)
					})
				})
			}
			_add_to_group(group_id, user_id){
				return new Promise((resolve, reject) => {
					let columns = {
						record_group_user_id: og.u.uniqueId(),
						group_id: group_id,
						user_id: user_id,
					}
					this.query([
						'INSERT IGNORE INTO record_group_user SET',
						'record_group_user_id = :record_group_user_id, group_id = :group_id, user_id = :user_id'
					])
					.run({type: 'INSERT', replacements: columns})
					.then(() => {
						resolve(columns)
					})
				})
			}
			_remove_from_group(owner_id, user_id, type){
				return new Promise((resolve, reject) => {
					if(owner_id == user_id){
						resolve({error: true, message: 'cannot remove owner from own group'})
					}
					this.query([
						'DELETE FROM record_group_user WHERE owner_table="user"',
						'AND'
						['type', '=', type],
						'AND',
						['owner_id', '=', owner_id],
						'AND',
						['user_id', '=', user_id],
					])
					.run({type: 'DELETE', replacements: [type, owner_id, user_id]})
					.then(() => {
						resolve({error: false})
					})
				})
			}
			_read_owner_group(owner_id, type){
				return new Promise((resolve, reject) => {
					this.query([
						'SELECT * FROM record_group WHERE owner_table="user"',
						'AND',
						['type', 		'=', type],
						'AND',
						['owner_id', 	'=', owner_id],
					])
					.run({type: 'SELECT', replacements: [type, owner_id]})
					.then((result) => {
						resolve(this._first(result))
					})
				})
			}
			_read_user_group(user_id, type){
				return new Promise((resolve, reject) => {
					this.query([
						'SELECT a.*,b.user_id FROM record_group a',
						'JOIN record_group_user b ON b.group_id = a.record_group_id',
						'WHERE a.owner_table="user"',
						'AND',
						['a.type', 		'=', type],
						'AND',
						['b.user_id', 	'=', user_id],
					])
					.run({type: 'SELECT', replacements: [type, user_id], log: false})
					.then((result) => {
						resolve(result)
					})
				})
			}
			_fetch_unique_group(owner_id, user_id, type){
				return new Promise((resolve, reject) => {
					this.query([
						'SELECT a.*,b.user_id FROM record_group a',
						'JOIN record_group_user b ON b.group_id = a.record_group_id',
						'WHERE a.owner_table="user"',
						'AND',
						['a.type', 		'=', type],
						'AND',
						['a.owner_id', 	'=', owner_id],
						'AND',
						['b.user_id', 	'=', user_id],
					])
					.run({type: 'SELECT', replacements: [type, owner_id, user_id]})
					.then((result) => {
						resolve(this._first(result))
					})
				})
			}
			_suggested_users(props, user){
				return new Promise((resolve, reject) => {
					this.alias = 'a'

					var user_assoc = this._server.getModule('USER_ASSOC')
					user_assoc.alias = 'b'
					this.query([
						'SELECT',		this.select.basic,
						'FROM',			this.table,
						'LEFT JOIN', 	'(',
								/////////////////////////////////////
								//join associated users
								'SELECT', 	'user_a_id',
								'FROM',		 user_assoc.table,
								'WHERE', ['user_b_id', '=', user.user_id],
								/////////////////////////////////////
						') b ON b.user_a_id = a.user_id',
						'WHERE',
						['a.user_id', '!=', user.user_id],
						'AND b.user_a_id IS NULL'
					])
					.run({type:'SELECT', log: false})
					.then((response) => {
						user_assoc.alias = null
						this.alias = null

						resolve(response)
					})
				})
			}
			_associated_users(props, user){
				return new Promise((resolve, reject) => {
					this.alias = 'a'

					var user_assoc = this._server.getModule('USER_ASSOC')
					user_assoc.alias = 'b'
					this.query([
						'SELECT',		this.select.basic,
						'FROM',			this.table,
						'JOIN', user_assoc.table, 'ON b.user_b_id = a.user_id',
						'WHERE',
						['a.user_id', '=', user.user_id]
					])
					.run({type:'SELECT', log: false})
					.then((response) => {
						user_assoc.alias = null
						this.alias = null

						resolve(response)
					})
				})
			}
			read(props){
				return og.env.on({
					server: () => {
						return this._read(props)
					},
					client: () => {
						return this.get('read_user', props)
					},
				})
			}
			create(props){
				return og.env.on({
					server: () => {
						return new Promise((resolve) => {
							this._create(props).then((result) => {
								this._create_group(result, this._groups.feed).then(() => {
									this._read(result).then((record) => {
										resolve(record)
									})
								})
							})
						})
					},
					client: () => {
						return this.post('create_user', props)
					},
				})
			}
			start_broadcast(props, user){
				return og.env.on({
					server: () => {
						return new Promise((resolve) => {
							this._start_broadcast(props, user).then((result) => {
								resolve(result)
							})
						})
					},
					client: () => {
						return this.post('start_broadcast', props)
					},
				})
			}
			update(props){
				return og.env.on({
					server: () => {
						return this._update(props)
					},
					client: () => {
						return this.post('update_user', props)
					},
				})
			}
			delete(props){
				return og.env.on({
					server: () => {
						return this._delete(props)
					},
					client: () => {
						return this.post('delete_user', props)
					},
				})
			}
		}
		og.server.include(USER, og.server.types.DM)
		og.use(USER, {as: 'dm_user', singleton: false})
	})
	if(typeof module != 'undefined' && module.exports){module.exports = function(og){__(og);return {}}} else{__(og)}
})()