(function(){
	var _m = (function(og){
		var __state = {
			signedIn: false,
			user: null
		}

		class OG_USER_AUTH extends og.authentication{
			constructor(){
				super()
				this._initialize = false
				this._user = null
				this._session = null
				this._session_id = null
				this._server = null

				this._state = {
					processingForm: false,
					error: null,
					active: false,
					signedIn: false,
					user: null
				}
			}
			use(authdb){
				if(this._initialize){
					return
				}

				this._authdb = authdb
				this._authdb.on('signedIn', (user) => {
					if(!this._state.processingForm){
						this._signIn({firebase_id: user.uid}).then((user) => {
							this._refresh(user)
							this._activate()
							this._emitSignedIn()
						})
					}
					else{
						this._activate()
					}
				})

				this._authdb.on('signedOut', () => {
					if(!this._state.processingForm){
						this._signOut().then(() => {
							this._refresh(null)
							this._activate()
							this._emitSignedOut()
						})
					}
					else{
						this._activate()
					}
				})

				this._user = new og.dm_user()
				this._initialize = true
			}
			signUp(fields){
				this._reset()
				this._processingForm()
				return new Promise((resolve, reject) => {
					this._authdb.signUp(fields.email, fields.password).then((response) => {

						//signed in already or processing data
						if(!response){
							resolve()
							return
						}

						//email exists or fields are invalid
						if(response.error){
							this._error(this._authdb.lastError)
							resolve()
						}

						//signin success
						else if(response.user){
							fields.firebase_id = response.user.uid
							this._signUp(fields).then((user) => {
								this._refresh(user)
								this._emitSignedIn()
								resolve()
							})
						}

						//something went wrong
						else{
							og.log('AUTH: something went wrong')
							resolve()
						}

					})
				})
			}
			signIn(fields){
				this._reset()
				this._processingForm()
				return new Promise((resolve, reject) => {
					this._authdb.signIn(fields.email, fields.password).then((response) => {

						//signed in already or processing data
						if(!response){
							resolve()
							return
						}

						//wrong email or password
						if(response.error){
							this._error(this._authdb.lastError)
							resolve()
						}

						//signin success
						else if(response.user){
							this._signIn({firebase_id: response.user.uid}).then((user) => {
								this._refresh(user)
								this._activate()
								this._emitSignedIn()
								resolve()
							})
						}

						//something went wrong
						else{
							og.log('AUTH: something went wrong')
							resolve()
						}

					})
				})
			}
			signOut(){
				return new Promise((resolve, reject) => {
					this._authdb.signOut().then((response) => {
						og.log('AUTH: signout', response)
						this._signOut().then(() => {
							this._reset()
							this._emitSignedOut()
							resolve()
						})
					})
				})
			}
			onSignIn(listener){
				if(this.signedIn){
					listener()
				}
				else{
					this.on('signedIn', listener)
				}
			}
			onSignOut(listener){
				if(this.signedOut){
					listener()
				}
				else{
					this.on('signedOut', listener)
				}
			}

			_activate(){
				if(this._state.active == null){
					this._state.active = true
				}
			}
			_signIn(fields){
				return this._post('auth_signin', fields)
			}
			_signUp(fields){
				return this._post('auth_signup', fields)
			}
			_signOut(){
				return this._post('auth_signout')
			}

			_error(message){
				this._refresh(null)
				this._state.error = message
			}
			_processingForm(){
				this._state.processingForm = true
			}
			_emitSignedIn(){
				og.log('AUTH: emit->signedIn')
				this.emit('signedIn')
			}
			_emitSignedOut(){
				og.log('AUTH: emit->signedOut')
				this.emit('signedOut')
			}

			_reset(){
				this._state.user = null
				this._state.error = null
				this._state.processingForm = false
				__state.signedIn = false
			}
			_refresh(user){
				if(user){
					this._state.user = user
					__state.signedIn = true
				}
				else{
					this._state.user = null
					__state.signedIn = false
				}
				this._state.signedIn = __state.signedIn
				this._state.processingForm = false
			}
			_get(path, req){
				return og.http.get(og.url(path), req || {})
			}
			_post(path, body){
				return og.http.post(og.url(path), body || {})
			}
			/************************/
			//server
			server__route(req, res, next){
				next()
			}
			server__connect(server){
				if(!og.env.server){
					return
				}

				this._server = server
				this._server.post('/auth_signup', (data, req, res) => {
					return new Promise((resolve, reject) => {
						og.log('auth_signup')
						this.__auth_signup({resolve: resolve, reject: reject}, data, req, res)
					})
				})
				this._server.post('/auth_signin', (data, req, res) => {
					return new Promise((resolve, reject) => {
						og.log('auth_signin')
						this.__auth_signin({resolve: resolve, reject: reject}, data, req, res)
					})
				})
				this._server.post('/auth_signout', (data, req, res) => {
					return new Promise((resolve, reject) => {
						og.log('auth_signout')
						this.__auth_signout({resolve: resolve, reject: reject}, data, req, res)
					})
				})
			}
			server__load__authenticated__user(req, res){
				return new Promise((resolve) => {
					var session_id = this.__getSessionId(req, res)
					var session = this._server.getModule('SESSION')
					session.read_user(session_id).then((result) => {
						resolve(result)
					})
				})
			}
			__auth_signup(promise, columns, req, res){
				var session_id = this.__getSessionId(req, res)
				var user = this._server.getModule('USER')

				user.create(columns).then((user) => {
					this.__auth_signin(promise, {
						session_id: session_id,
						user_id: user.user_id,
					}, req, res)
				})
			}
			__auth_signin(promise, columns, req, res){
				var session_id = this.__getSessionId(req, res)
				var session = this._server.getModule('SESSION')
				var user = this._server.getModule('USER')

				user.read(columns).then((user) => {
					if(og.u.not(user)){
						console.log('Failed to signin. User does not exist', columns.user_id)
						promise.resolve([])
						return
					}

					session.check({session_id: session_id}).then((exists) => {
						if(exists){
							promise.resolve(user)
						}
						else{
							session.create({
								session_id: session_id,
								user_id: user.user_id
							}).then(() => {
								promise.resolve(user)
							})
						}
					})
				})
			}
			__auth_signout(promise, columns, req, res){
				if(req.cookies['og_session']){
					var session_id = req.cookies['og_session']
					var session = this._server.getModule('SESSION')
					res.clearCookie('og_session', session_id)
					session.delete({session_id: session_id}).then(() => {
						promise.resolve({})
					})
				}
				else{
					promise.resolve()
				}
			}
			__getSessionId(req, res){
				var session = null
				if(req.cookies['og_session']){
					session = req.cookies['og_session']
				}
				else{
					session = og.u.uniqueId()
					res.cookie('og_session', session)
				}

				//console.log('AUTH session id:', session)
				return session
			}
			get active(){
				return this._state.active
			}
			get error(){
				return this._state.error
			}
			get state(){
				return this._state
			}
			get signedIn(){
				return __state.signedIn
			}
			get signedOut(){
				return !__state.signedIn
			}
			get user(){
				return this._state.user
			}
		}

		return OG_USER_AUTH
	})
	if(typeof module != 'undefined' && module.exports){
		module.exports = function(og){
			var auth = _m(og)
			og.use(auth, {as: 'auth', singleton: true })
			og.server.include(og.auth, og.server.types.AUTH)
			return auth
		}
	}
	else{
		og.use(_m(og), {as: 'auth', singleton: true })
	}
})()
//this.module = new og.dm_user()

/*
	class OG_AUTH{
		constructor(){
			this._state = {
				processing: false,
			}

			this._verification = {
				existence: {
					error: false,
					message: 'This Account Already Exists'
				},
				success: {
					error: false,
					record: null
				}
			}

			this._form = {
				key: {n: 'email', v: null, type: 'email'},
				secret: {v: 'password', v: null, length: 6},
				rules: {}
			}

			this._module = og.db.tables.user
			this.instance = null
		}
		register(){
			return new Promise((resolve, reject) => {
				this.__verifyExistence().then((exists) => {
					this._verification.existence.error = false
					if(exists){
						this._verification.existence.error = true
						resolve(this._verification.existence)
					}
					else{
						this._create().then((record) => {
							this._verification.success.record = record
							resolve(this._verification.success)
						})
					}
				})
			})
		}

		_create(promise){
			var instance = this._module.newRecord()
			instance[this.key.name] = this.key.value
			instance[this.secret.name] = this.secret.value
			instance.save().then((record) => {
				promise.resolve(record)
			})
		}
		_verifyKeyExistence(promise){
			this._module.read(this._getVerificationRequest().json).then((records) => {
				promise.resolve(records.length > 0)
			})
		}
		_verifyKeyValue(){}
		_verifySecretValue(){}
		_defaults(props){
			props = og.u.defaults(props, {
				keyName: 'email',
				keyValue: null,
				keyType: 'email',
				secretName: 'secret',
				secretValue: null,
				secretLength: 6,
			})
			this._form.key.n = props.keyName
			this._form.key.v = props.keyValue
			this._form.secret.n = props.secretName
			this._form.secret.v = props.secretValue
			this._form.secret.length = props.secretLength
		}
		_getVerificationRequest(){
			var req = new og.request()
			req.prop(this._form.key.n, this._form.key.v)
			return req
		}
		_getRegistrationRequest(){
			var req = new og.request()
			req.prop(this._form.key.n, this._form.key.v)
			req.prop(this._form.secret.n, this._form.secret.v)
			return req
		}

		__create(){
			return new Promise((resolve, reject) => {
				this._verifyExistence({resolve: resolve, reject: reject})
			})
		}
		__verifyExistence(){
			return new Promise((resolve, reject) => {
				this._verifyExistence({resolve: resolve, reject: reject})
			})
		}

		get key(){
			return {name: this._form.key.n, value: this._form.key.v}
		}
		get secret(){
			return {name: this._form.secret.n, value: this._form.secret.v}
		}

		set key(value){
			this._form.key.v = value
		}
		set secret(value){
			this._form.secret.v = value
		}
	}



_create(){
	this.module.verify(this._getRegistrationRequest().json).then((record) => {
		promise.resolve(record)
	})
}

_verifyKeyExistence(promise){
	this.module.verify(this._getVerificationRequest().json).then((response) => {
		promise.resolve(response.exists)
	})
}

verifyEmail(){
	return this._verifyKeyExistence()
}

get email(){
	return this.key.v
}
get password(){
	return this.secret.v
}
set email(value){
	this.key = value
}
set password(value){
	this.secret = value
}
*/