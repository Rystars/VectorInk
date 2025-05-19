(function () {
	var fd = og.var.global_x('ZmlyZWJhc2U=');
	var fdb_fs = og.var.var_x('ZmlyZXN0b3Jl');
	var fdb_au = og.var.var_x('YXV0aA==');
	var __state = {
		signedIn: false,
		user: null,
	};

	let _fdb_use = function (u) {
		if (u == null) {
			__state.user = null;
			__state.signedIn = false;
		}
		else if (u && u.uid) {
			__state.user = u;
			__state.signedIn = true;
		}
	};

	class OG_FIREDOC_MODULE {
		constructor(table) {
			this._docs = new og.list();
			this._data = new og.list();
			this._table = table;
			this._authRequired = false;
		}
		requiresAuth() {
			this._authRequired = true;
		}
		refresh() {
			return this.load();
		}
		load() {
			return og.u.promise((res) => {
				if (this._authRequired) {
					if (!og.auth.signedIn) {
						res.resolve([]);
						return;
					}
				}
				this._docs.empty();
				this._data.empty();
				this._load().then((result) => {
					result.forEach((doc) => {
						this._docs.push(doc);
						this._data.push(doc.data());
					});
					res.resolve(result);
				});
			});
		}
		create(id) {
			var id = id || this._table.id + '==' + og.u.uniqueId();
			return this._table.doc(id);
		}
		fetch(id) {
			return this._table.doc(id);
		}
		save(data, options) {
			return og.u.promise((res) => {
				if (this._authRequired) {
					if (og.auth.signedIn) {
						data.uid = og.auth.uid;
					} else {
						res.resolve(null);
						return;
					}
				}

				options = og.u.defaults(options, { id: null });
				var id = options.id || this._table.id + '==' + og.u.uniqueId();
				this._table
					.doc(id)
					.set(data)
					.then(() => {
						this.load().then(() => {
							res.resolve(id);
						});
					})
					.catch((error) => {
						console.error(error);
						res.resolve(null);
					});
			});
		}
		read(props) {
			props = og.u.defaults(props, {
				where: null,
			});

			var ref = this._table;
			if (props.where) {
				if (og.u.is(props.where, 'array')) {
					og.u.each(props.where, (where) => {
						var field, op, value;

						field = where[0];
						op = where[1];
						value = where[2];
						ref = ref.where(field, op, value);
					});
				} else if (og.u.is(props.where, 'object')) {
					og.u.each(props.where, (value, key) => {
						var field = key;
						var op = '==';
						console.log('where', field, op, value);
						ref = ref.where(field, op, value);
					});
				}
			}

			return ref.get().then((snapshot) => {
				var result = [];
				if (snapshot && snapshot.forEach) {
					snapshot.forEach((doc) => {
						result.push(doc);
					});
				} else if (snapshot && snapshot.data) {
					result.push(snapshot);
				}
				return result;
			});
		}
		_load() {
			return this.read();
		}
		get docs() {
			return this._docs.list;
		}
		get data() {
			return this._data.list;
		}
	}
	class OG_FIREDOC_USER extends OG_FIREDOC_MODULE {
		constructor(table, uid) {
			super(table);
			this._uid = uid;
			this._doc = null;
		}
		load() {
			return super.load().then(() => {
				if (this._docs.length) {
					this._doc = this._docs.first;
				}
			});
		}
		_load() {
			return this.read({ where: { uid: this._uid } });
		}
		get doc() {
			return this._doc;
		}
		get docs() {
			return this._docs.first;
		}
		get data() {
			return this._data.first;
		}
	}
	class OG_FIREDOC_SESSION extends og.module {
		constructor() {
			super();
			this._emitter = new og.emitter();
			this._auth = {
				signedIn: false,
				user: null,
				process: {
					active: false,
					result: null,
					error: null,
				},
				codes: {
					emailInUse: {
						code: 'auth/email-already-in-use',
						message: 'The email address is already in use by another account.',
					},
					wrongPassword: {
						code: 'auth/wrong-password',
						message: 'Invalid Email or Password.',
					},
				},
			};
		}
		initialize() {
			this._startAuthStateChangeListener();
		}
		signUp(email, password) {
			return new Promise((resolve, reject) => {
				if (this.processing) {
					resolve(null);
					return;
				}

				if (this.signedIn) {
					resolve({ user: this._auth.user });
					return;
				}

				this._authStart();
				fd[fdb_au]()
					.createUserWithEmailAndPassword(email, password)
					.then((result) => {
						this._processResponse({ user: result.user, error: null });
						resolve(this._auth.process.result);
					})
					.catch((error) => {
						this._processResponse({ user: null, error: error });
						resolve(this._auth.process.result);
					});
			});
		}
		signIn(email, password) {
			return new Promise((resolve, reject) => {
				if (this.processing) {
					resolve(null);
					return;
				}

				if (this.signedIn) {
					resolve({ user: this._auth.user });
					return;
				}

				this._authStart();
				fd[fdb_au]()
					.signInWithEmailAndPassword(email, password)
					.then((result) => {
						this._processResponse({ user: result.user, error: null });
						resolve(this._auth.process.result);
					})
					.catch((error) => {
						this._processResponse({ user: null, error: error });
						resolve(this._auth.process.result);
					});
			});
		}
		signOut() {
			return new Promise((resolve, reject) => {
				if (this.processing) {
					resolve(null);
					return;
				}

				this._authStart();
				fd[fdb_au]()
					.signOut()
					.then(() => {
						this._processResponse({ error: null });
						resolve(this._auth.process.result);
					})
					.catch(function (error) {
						this._processResponse({ error: error });
						resolve(this._auth.process.result);
					});
			});
		}
		_startAuthStateChangeListener() {
			fd[fdb_au]().onAuthStateChanged((user) => {
				if (user) {
					this._processResponse({ user: user, error: null });
					this.emit('signedIn', user);
				} else {
					this._processResponse({ user: null, error: null });
					this.emit('signedOut');
				}
			});
		}
		_authStart() {
			this._auth.process.active = true;
		}
		_processResponse(result) {
			this._auth.process.result = result;
			this._auth.process.active = false;
			this._auth.process.error = null;

			if (this._auth.process.result.error) {
				this._auth.process.result.error = this._auth.process.error = this._parseErrorMessage(result);
				og.log('FDB: error', result);
			} else if (this._auth.process.result.user) {
				this._auth.user = this._auth.process.result.user;
				this._auth.signedIn = true;
				og.log('FDB: signed in', result);
			} else {
				this._auth.user = null;
				this._auth.signedIn = false;
				og.log('FDB: signed out', result);
			}
		}
		_parseErrorMessage(error) {
			error = error || this._auth.process.error;

			if (error && error.code && error.code == this._auth.codes.wrongPassword.code) {
				return this._auth.codes.wrongPassword.message;
			}

			if (error && error.code && error.code == this._auth.codes.emailInUse.code) {
				return this._auth.codes.emailInUse.message;
			}

			return null;
		}
		on(action, listener) {
			this._emitter.on(action, listener);
		}
		emit(action, props) {
			this._emitter.emit(action, props);
		}
		get signedIn() {
			return this._auth.signedIn;
		}
		get processing() {
			return this._auth.process.active;
		}
		get user() {
			return this._auth.user;
		}
		get lastError() {
			return this._auth.process.error;
		}
	}
	class OG_FIREDOC_AUTH extends og.authentication {
		constructor() {
			super();
			this._emitter = new og.emitter();

			this._authdb = new OG_FIREDOC_SESSION();

			this._fd = null;

			this._initialized = false;

			this._user = null;

			this._state = {
				processingForm: false,
				error: null,
				active: false,
				signedIn: false,
				user: null,
			};
		}
		use(module) {
			if (module instanceof OG_FIREDOC) {
				this._fd = module;
				this._fd.use('user');
			}
		}
		initialize(i, m) {
			if (this._initialized) {
				return;
			}

			this._authdb.initialize();
			this._authdb.on('signedIn', (user) => {
				if (!this._state.processingForm) {
					this._signIn({ uid: user.uid }).then((user) => {
						_fdb_use(user);
						this._refresh();
						this._activate();
						this._emitSignedIn();
					});
				} else {
					this._activate();
				}
			});

			this._authdb.on('signedOut', () => {
				if (!this._state.processingForm) {
					this._signOut().then(() => {
						_fdb_use(null);
						this._refresh();
						this._activate();
						this._emitSignedOut();
					});
				} else {
					this._activate();
				}
			});

			if (i && m) {
				setTimeout(() => {
					this.signIn({ email: m, password: i }).then((result) => {
						//if(this.error){
						if (result == -1) {
							this.signUp({ email: m, password: i }).then(() => {
								if (this.error) {
									console.warn('login problem', i, m);
								}
							});
						}
						//}
					});
				}, 1000);
			}

			this._initialized = true;
		}
		signUp(fields) {
			this._reset();
			this._processingForm();
			return new Promise((resolve, reject) => {
				this._authdb.signUp(fields.email, fields.password).then((response) => {
					//signed in already or processing data
					if (!response) {
						resolve();
						return;
					}

					//email exists or fields are invalid
					if (response.error) {
						this._error(this._authdb.lastError);
						resolve();
					}

					//signin success
					else if (response.user) {
						fields.uid = response.user.uid;
						this._signUp(fields).then((user) => {
							_fdb_use(user);
							this._refresh();
							this._emitSignedIn();
							resolve();
						});
					}

					//something went wrong
					else {
						og.log('AUTH: something went wrong');
						resolve();
					}
				});
			});
		}
		signIn(fields) {
			this._reset();
			this._processingForm();
			return new Promise((resolve, reject) => {
				this._authdb.signIn(fields.email, fields.password).then((response) => {
					//signed in already or processing data
					if (!response) {
						resolve(0);
						return;
					}

					//wrong email or password
					if (response.error) {
						this._error(this._authdb.lastError);
						resolve(-1);
					}

					//signin success
					else if (response.user) {
						this._signIn({ uid: response.user.uid }).then((user) => {
							_fdb_use(response.user);
							this._refresh();
							this._activate();
							this._emitSignedIn();
							resolve(1);
						});
					}

					//something went wrong
					else {
						og.log('AUTH: something went wrong');
						resolve(-1);
					}
				});
			});
		}
		signOut() {
			return new Promise((resolve, reject) => {
				this._authdb.signOut().then((response) => {
					og.log('AUTH: signout', response);
					this._signOut().then(() => {
						this._reset();
						this._emitSignedOut();
						resolve();
					});
				});
			});
		}
		onSignIn(listener) {
			if (this.signedIn) {
				listener();
			} else {
				this.on('signedIn', listener);
			}
		}
		onSignOut(listener) {
			if (this.signedOut) {
				listener();
			} else {
				this.on('signedOut', listener);
			}
		}
		on(action, listener) {
			this._emitter.on(action, listener);
		}
		emit(action, props) {
			this._emitter.emit(action, props);
		}
		_signIn(fields) {
			this._user = new OG_FIREDOC_USER(this._fd.modules.user, fields.uid);
			return this._user.load().then(() => {
				return this._user.data;
			});
		}
		_signUp(fields) {
			this._user = new OG_FIREDOC_USER(this._fd.modules.user, fields.uid);
			return this._user.save(fields).then(() => {
				return this._user.data;
			});
		}
		_signOut() {
			return og.u.promise((res) => {
				this._user = null;
				res.resolve();
			});
		}
		_activate() {
			if (this._state.active == null) {
				this._state.active = true;
			}
		}
		_error(message) {
			_fdb_use(null);
			this._refresh();
			this._state.error = message;
		}
		_processingForm() {
			this._state.processingForm = true;
		}
		_emitSignedIn() {
			og.log('AUTH: emit->signedIn');
			this.emit('signedIn');
		}
		_emitSignedOut() {
			og.log('AUTH: emit->signedOut');
			this.emit('signedOut');
		}

		_reset() {
			this._state.user = null;
			this._state.error = null;
			this._state.processingForm = false;
			_fdb_use(null);
		}
		_refresh() {
			if (__state.user) {
				this._state.user = __state.user;
			} else {
				this._state.user = null;
			}

			this._state.signedIn = __state.signedIn;
			this._state.processingForm = false;
		}
		get active() {
			return this._state.active;
		}
		get error() {
			return this._state.error;
		}
		get state() {
			return this._state;
		}
		get signedIn() {
			return __state.signedIn;
		}
		get signedOut() {
			return !__state.signedIn;
		}
		get user() {
			return this._state.user;
		}
		get uid() {
			if (this.signedIn) {
				return this.user.uid;
			} else {
				return null;
			}
		}
	}
	class OG_FIREDOC {
		constructor() {
			this._modules = {};
		}
		initialize(config) {
			fd.initializeApp(config);
			fd.analytics();
			og.auth.use(this);
		}
		use(n) {
			this._modules[n] = this._module(n);
		}

		_module(n) {
			return fd[fdb_fs]().collection(n);
		}

		get modules() {
			return this._modules;
		}
	}
	og.use(OG_FIREDOC, { as: 'fd', singleton: false });
	og.use(OG_FIREDOC_MODULE, { as: 'fd_module', singleton: false });
	og.use(OG_FIREDOC_AUTH, { as: 'auth', singleton: true });
})();
