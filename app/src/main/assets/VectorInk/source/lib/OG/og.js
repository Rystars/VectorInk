(function () {
	var _njs_env = typeof module !== 'undefined' && module.exports;
	var og = null;
	/*===================================================================================
	=	BASE CLASSES																	=
	====================================================================================*/
	/*====================================
	=          	MAIN CLASS				 =
	====================================*/
	class OG {
		constructor() {
			this.njs = _njs_env;
			this._debug = true;
			this._online = _njs_env ? true : navigator.onLine;
			this._settings = {
				url: null,
			};
			this.__state = {
				modules: {},
			};
		}
		setup(settings) {
			this._settings = this.u.defaults(settings, {
				url: 'http://127.0.0.1:3000',
				dir: '',
			});

			if (window && window.addEventListener) {
				window.addEventListener('offline', (e) => {
					this._online = false;
					// this.log('offline');
				});
				window.addEventListener('online', (e) => {
					this._online = false;
					// this.log('online');
				});
			}
		}
		use(construct, props) {
			var module = null;
			var name = null;
			var options = { singleton: false, as: null };
			props = props || {};

			options.singleton = props.singleton || false;
			options.as = props.as || null;

			name = options.as || object.prototype.constructor.name;

			if (options.singleton) {
				module = new construct();
			} else {
				module = construct;
			}
			this.__state.modules[name] = module;
			this.__defineModule(name);
		}
		define(object, name, props) {
			Object.defineProperty(object, name, props);
		}
		log(props) {
			if (!this._debug) {
				return;
			}

			if (props && props instanceof Promise) {
				props.then((result) => {
					console.log(result);
				});
			} else {
				console.log.apply(null, arguments);
			}
		}
		error() {
			if (!this._debug) {
				return;
			}

			console.error.apply(null, arguments);
		}
		notify() {
			console.warn.apply(null, arguments);
		}
		resolve(promise) {
			return promise
				.then((result) => {
					return result;
				})
				.catch((err) => {
					console.error(err); //todo store/send to server
				});
		}
		url(path) {
			return this.host + '/' + path;
		}
		__defineModule(name) {
			this.define(this, name, {
				//enumerable: true,
				get: () => {
					return this.__state.modules[name];
				},
			});
		}

		get settings() {
			return this._settings;
		}
		get host() {
			return this._settings.url;
		}
		get dir() {
			return this._settings.dir;
		}
		get online() {
			return navigator.onLine || this._online;
		}
	}
	/*====================================
	=          OG MODULE CLASS		 	=
	====================================*/
	class OG_MODULE {
		constructor() {
			this.emitter = new og.emitter();
		}
		server__route(req, res, next) {
			next();
		}
		server__connect() {}
		on(action, listener) {
			this.emitter.on(action, listener);
		}
		emit(action, props) {
			this.emitter.emit(action, props);
		}
	}
	class OG_AUTHENTICATION extends OG_MODULE {
		constructor() {
			super();
		}
		test() {
			console.test('called test');
		}
	}
	/*===================================================================================
	=	RECORD KEEPING																	=
	====================================================================================*/
	class OG_DB_REQUEST {
		constructor() {
			this._props = {};
		}

		prop(key, value) {
			this._props[key] = value;
		}

		get json() {
			return this._props;
		}
	}
	/*====================================
	=  	ABSTRACT DB RECORD OLUMN CLASS	=
	====================================*/
	class OG_DB_COLUMN {
		constructor(name, config) {
			this._u = new OG_UTIL();
			this._name = name;
			this._config = config;
			this.value = '';
		}
		cast(value, type) {
			return this._u.cast(value, type);
		}
		uncast(value, type) {
			return this._u.uncast(value, type);
		}
		clear() {
			this.value = '';
		}
		get empty() {
			if (this.value) {
				return true;
			} else {
				return false;
			}
		}
		get type() {
			return this._config.type;
		}
		get value() {
			return this._value;
		}
		get export() {
			return this.uncast(this._value, this._config.type);
		}
		set value(v) {
			this._value = this.cast(v, this._config.type);
		}
	}
	/*====================================
	=  	ABSTRACT DB RECORD CLASS		=
	====================================*/
	class OG_DB_RECORD {
		constructor() {
			this.__state = {
				table: null,
				primaryKey: null,
				primaryKeyType: null,
				new: true,
				fields: {},
				inititial: {},
				config: {},
				defaults: {
					primaryKey: 'id',
					primaryKeyValue: '',
					primaryKeyType: 'STRING',
				},
			};
		}
		define(config, table) {
			this.__state.config = config;
			this.__state.table = table || null;
		}
		initialize(props) {
			this.__state.initial = props;
			this.__refresh();

			this.__state.new = props == null;
		}
		save() {
			if (this.__state.new) {
				return this.__create();
			} else {
				return this.__update();
			}
		}
		delete() {
			this.__delete();
		}
		each(callback) {
			og.u.each(this.__state.fields, (field, name) => {
				if (og.u.not(this.__state.fields[name])) {
					return;
				}
				if (og.u.type(this.__state.fields[name], 'function')) {
					return;
				}
				callback(field, name);
			});
		}
		registerColumn(name, type) {
			this.__registerColumn({ name: name, type: type }, name);
		}
		prop(name, value) {
			if (og.u.isset(value)) {
				if (this.has(name)) {
					this.__state.fields[name].value = value;
				}
			} else {
				if (this.has(name)) {
					return this.__state.fields[name].value;
				}
			}
		}
		props(props) {
			og.u.each(props, (value, name) => {
				this.prop(name, value);
			});
		}
		generatePrimaryKey() {
			if (this.__isNew()) {
				this.__generatePrimaryKey();
			}
		}
		getPrimaryKey() {
			return this.__primaryKey();
		}
		getPrimaryKeyValue() {
			return this.__primaryKeyValue();
		}
		has(name) {
			return og.u.has(this.__state.config.fields, name);
		}
		export() {
			return this.__export();
		}

		//////////////
		__isNew() {
			return this.__state.new;
		}
		__create() {
			if (this.__state.table == null) {
				return;
			}
			this.__state.table.create(this);
		}
		__update() {
			if (this.__state.table == null) {
				return;
			}
			this.__state.table.update(this);
		}
		__delete() {
			if (this.__state.table == null) {
				return;
			}
			this.__state.table.delete(this);
		}
		__export() {
			var result = {};
			this.each((field, name) => {
				result[name] = field.export;
			});
			return result;
		}
		__refresh() {
			this.__reset();
			this.__assign();
		}
		__assign() {
			og.u.each(this.__state.initial, (value, name) => {
				this.__assignValue(value, name);
			});
		}
		__reset() {
			og.u.each(this.__state.config.fields, (config, name) => {
				this.__registerColumn(config, name);
			});
		}
		__registerColumn(config, name) {
			this.__asssignProperty(name);
			this.__assignField(config, name);
			this.__assignPrimaryKey(config, name);
		}
		__asssignProperty(name) {
			if (!og.u.has(this.__state.fields, name)) {
				Object.defineProperty(this, name, {
					get: () => {
						return this.prop(name);
					},
					set: (value) => {
						this.prop(name, value);
					},
				});
			}
		}
		__assignField(config, name) {
			this.__state.fields[name] = new OG_DB_COLUMN(name, config);
		}
		__assignPrimaryKey(config, name) {
			if (og.u.has(config, 'primaryKey') && config.primaryKey) {
				this.__state.primaryKey = name;
				this.__state.primaryKeyType = config.type;
			}
		}
		__assignValue(value, name) {
			if (!og.u.has(this.__state.fields, name)) {
				og.error('field', name, 'does not exist in this table');
				return;
			}
			this.__state.fields[name].value = value;
		}
		__primaryKey() {
			return this.__state.primaryKey;
		}
		__primaryKeyValue() {
			return this.__state.fields[this.__state.primaryKey].value;
		}
		__generatePrimaryKey() {
			this.__state.fields[this.__state.primaryKey].value = this.__uniqueID();
			this.__state.new = false;
		}
		__uniqueID() {
			return og.u.uniqueId();
		}
	}
	/*====================================
	=  	LDB RECORD CLASS				=
	====================================*/
	class OG_SQL_DB_RECORD extends OG_DB_RECORD {
		constructor() {
			super();
		}
		__export() {
			this.generatePrimaryKey();
			return super.__export();
		}
	}
	/*====================================
	=  	LDB RECORD CLASS				=
	====================================*/
	class OG_LDB_RECORD extends OG_DB_RECORD {
		constructor() {
			super();
			this.__LDBItem = null;
		}
		__set_LDB_REF(LDBItem) {
			this.__LDBItem = LDBItem;
			var record = {};
			Object.keys(this.__LDBItem).forEach((key) => {
				if (this.has(key)) {
					record[key] = this.__LDBItem[key];
				}
			});
			record.local_id = this.__LDBItem._id;
			this.initialize(record);
		}
		__export() {
			if (this.__isNew()) {
				this.generatePrimaryKey();
				return super.__export();
			} else if (this.__LDBItem != null) {
				this.each((field, name) => {
					this.__LDBItem[name] = field.export;
				});
				return this.__LDBItem;
			} else {
				console.error('unassigned LDB ITEM on record');
				return null;
			}
		}
		set LDB_REF(REF) {
			this.__set_LDB_REF(REF);
		}
	}
	/*====================================
	=  	FDB RECORD CLASS				=
	====================================*/
	class OG_FDB_RECORD extends OG_DB_RECORD {
		constructor() {
			super();
			this.__FDBItem = null;
		}
		__set_FDB_REF(FDBItem) {
			this.__FDBItem = FDBItem;
		}
		__export() {
			this.generatePrimaryKey();
			return super.__export();
		}
		set FDB_REF(REF) {
			this.__set_FDB_REF(REF);
		}
		get FDB_REF() {
			return this.__FDBItem;
		}
	}
	/*====================================
	=  	ABSTRACT DB MODULE CLASS		=
	====================================*/
	class OG_DB_MODULE extends OG_MODULE {
		constructor() {
			super();
			this._ref = null;
			this._config = null;
			this._dbm = null;
			this._dbmRecord = null;
			this._lib = null;
			this._parent = null;
			this._models = {};
			this._listeners = {};
		}

		use(module) {
			if (OG_DB_MODULE.isPrototypeOf(module)) {
				this._dbm = module;
			} else if (OG_DB_RECORD.isPrototypeOf(module)) {
				this._dbmRecord = module;
			} else if (og.u.type(module, 'object') && og.u.has(module, 'lib')) {
				this._lib = module.lib;
			}
		}
		/**
		 * returns OG_DB_TABLE
		 */

		define(ref, config, parent) {
			this._ref = ref;
			this._config = config;
			this._parent = parent || null;
		}

		_addModel(ref, config, parent) {
			this._models[ref] = this._addDBM(ref, config);
			return this._models[ref];
		}
		_newRecord(config, ref) {
			if (this._dbmRecord) {
				var record = new this._dbmRecord();
				record.define(config, ref);
				return record;
			} else {
				return null;
			}
		}

		_log() {
			console.log('LOG:', this.constructor.name, '*******************');
			console.log.apply(null, arguments);
		}

		_error() {
			console.log('ERROR:', this.constructor.name, '*******************');
			console.error.apply(null, arguments);
		}

		_addDBM(ref, config) {
			if (this._dbm) {
				var dbm = new this._dbm();
				dbm.define(ref, config);
				return dbm;
			} else {
				return null;
			}
		}

		get $models() {
			return this._models;
		}
		get config() {
			return this._config;
		}
	}
	/*===================================================================================
	=  	STORAGE TABLES																	=
	====================================================================================*/
	/*====================================
	=  	ABSTRACT DB STORAGE CLASS		=
	====================================*/
	class OG_DB_STORAGE extends OG_DB_MODULE {
		constructor() {
			super();
			this.use(OG_DB_RECORD);
			this.__state = {};
			this.prep = {
				forCreate: (item) => {
					item.created_at = new Date();
					return item;
				},
				forUpdate: (item) => {
					item.updated_at = new Date();
					return item;
				},
			};
		}
		/**
		 * returns OG_DB_TABLE
		 */
		define(ref, table) {
			super.define(ref, table);
		}
		newRecord() {
			///@todo assign indexes froom config... see sequalize
			var record = this._newRecord(this._config, this);
			record.initialize(null);
			return record;
		}
		create(OG_DB_RECORD) {
			return new Promise((resolve, reject) => {
				this._create(OG_DB_RECORD, { resolve: resolve, reject: reject });
			});
		}
		read(request) {
			return new Promise((resolve, reject) => {
				this._read(request || {}, { resolve: resolve, reject: reject });
			});
		}
		update(OG_DB_RECORD) {
			return new Promise((resolve, reject) => {
				this._update(OG_DB_RECORD, { resolve: resolve, reject: reject });
			});
		}
		delete(OG_DB_RECORD) {
			return new Promise((resolve, reject) => {
				this._delete(OG_DB_RECORD, { resolve: resolve, reject: reject });
			});
		}
		hasField(name) {
			return og.u.has(this._config.fields, name);
		}
		fieldType(name) {
			return this._config.fields[name].type;
		}
		_create(OG_DB_RECORD, promise) {
			promise.resolve();
		}
		_update(OG_DB_RECORD, promise) {
			promise.resolve();
		}
		_read(request, promise) {
			promise.resolve();
		}
		_delete(OG_DB_RECORD, promise) {
			promise.resolve();
		}

		get tableName() {
			return this._ref;
		}
	}
	/*====================================
	=  	SQL DB STORAGE CLASS			=
	====================================*/
	class OG_SQL_DB_STORAGE extends OG_DB_STORAGE {
		constructor() {
			super();
			this.use(OG_SQL_DB_RECORD);
			this._jsql = new jsql();
			this.__state = {};
		}
		_create(OG_SQL_DB_RECORD, promise) {
			this._jsql.add(this.tableName, this.prep.forCreate(OG_SQL_DB_RECORD.export())).then(() => {
				promise.resolve();
			});
		}
		_read(request, promise) {
			this._jsql.get(this.tableName, request).then(() => {
				var results = [];
				response.forEach((data) => {
					var record = this.newRecord();
					record.initialize(data);
					results.push(record);
				});
				promise.resolve(results);
			});
		}
		_update(OG_SQL_DB_RECORD, promise) {
			var primaryKey = OG_SQL_DB_RECORD.getPrimaryKey();
			var primaryKeyValue = OG_SQL_DB_RECORD.getPrimaryKeyValue();
			var where = {};
			where[primaryKey] = primaryKeyValue;
			this._jsql.put(this.tableName, this.prep.forUpdate(OG_SQL_DB_RECORD.export()), where).then(() => {
				promise.resolve();
			});
		}
		_delete(OG_SQL_DB_RECORD, promise) {
			var primaryKey = OG_SQL_DB_RECORD.getPrimaryKey();
			var primaryKeyValue = OG_SQL_DB_RECORD.getPrimaryKeyValue();
			var where = {};
			where[primaryKey] = primaryKeyValue;
			this._jsql.delete(this.tableName, where).then(() => {
				promise.resolve();
			});
		}
	}
	/*====================================
	=  	ABSTRACT DOC STORAGE CLASS		=
	====================================*/
	class OG_DB_DOC_STORAGE extends OG_DB_STORAGE {
		constructor() {
			super();
			this.__state = {};
		}
		define(ref, config) {
			super.define(ref, config);
			this._collection = this.getCollection();
		}
		getCollection() {
			if (this._lib) {
				return new this._lib.Collection(this._ref);
			} else {
				return {};
			}
		}
	}
	/*====================================
	=  	LDB DOC STORAGE CLASS			=
	====================================*/
	class OG_LDB_DOC_STORAGE extends OG_DB_DOC_STORAGE {
		constructor() {
			super();
			this.use(OG_LDB_RECORD);
			this.use({ lib: LDB });
			this.__state = {};
		}
		_create(OG_LDB_RECORD, promise) {
			this._collection.save(this.prep.forCreate(OG_LDB_RECORD.export()), (_item) => {
				OG_LDB_RECORD.LDB_REF = _item;
				promise.resolve();
			});
		}
		_read(request, promise) {
			this._collection.find(request, (response) => {
				var results = [];
				response.forEach((_item) => {
					var record = this.newRecord();
					record.LDB_REF = _item;
					results.push(record);
					//record.setObjectRef(record)
				});
				promise.resolve(results);
			});
		}
		_update(OG_LDB_RECORD, promise) {
			var LDB_ITEM = this.prep.forUpdate(OG_LDB_RECORD.export());
			LDB_ITEM.save();
			promise.resolve();
		}
		_delete(OG_LDB_RECORD, promise) {
			var LDB_ITEM = OG_LDB_RECORD.export();
			LDB_ITEM.delete();
			promise.resolve();
		}
	}
	/*====================================
	=  	FIREBASE DB STORAGE CLASS		=
	====================================*/
	class OG_FDB_STORAGE extends OG_DB_DOC_STORAGE {
		constructor() {
			super();
			this.use(OG_FDB_RECORD);
			this.use({ lib: firebase.firestore() });
			this.__state = {};
		}
		_create(OG_FDB_RECORD, promise) {
			var data = OG_FDB_RECORD.export();
			var docid = OG_FDB_RECORD.getPrimaryKeyValue();
			this.getCollection()
				.doc(docid)
				.set(this.prep.forCreate(data), () => {
					promise.resolve();
				})
				.catch((error) => {
					this._error('Error fetching document: ', error);
					promise.reject();
				});
		}
		_read(request, promise) {
			this._assignedCollection(request)
				.get(request)
				.then((querySnapshot) => {
					var results = [];

					if (querySnapshot.forEach) {
						querySnapshot.forEach((doc) => {
							var data = doc.data();
							var record = this.newRecord();
							record.FDB_REF = doc;
							record.initialize(data);
							results.push(record);
						});
					} else if (querySnapshot.data) {
						var data = doc.data();
						var record = this.newRecord();
						record.FDB_REF = doc;
						record.initialize(data);
						results.push(record);
					}
					promise.resolve(results);
				})
				.catch((error) => {
					this._error('Error fetching document: ', error);
					promise.reject();
				});
		}
		_update(OG_FDB_RECORD, promise) {
			var data = OG_FDB_RECORD.export();
			var docid = OG_FDB_RECORD.getPrimaryKeyValue();
			//var ref = OG_FDB_RECORD.FDB_REF
			this.getCollection()
				.doc(docid)
				.set(this.prep.forUpdate(data))
				.then(() => {
					promise.resolve();
				})
				.catch((error) => {
					this._error('Error updating document: ', error);
					promise.reject();
				});
		}
		_delete(OG_FDB_RECORD, promise) {
			var docid = OG_FDB_RECORD.getPrimaryKeyValue();
			this.getCollection()
				.doc(docid)
				.delete()
				.then(() => {
					promise.resolve();
				})
				.catch((error) => {
					this._error('Error deleting document: ', error);
					promise.reject();
				});
		}
		/*
		where: [
			['email', '==', email]
		]
		*/
		_assignedCollection(request) {
			var collection = this.getCollection();
			if (og.u.has(request, 'where')) {
				og.u.each(request.where, (where, index) => {
					var field = where[0];
					var op = where[1];
					var value = where[2];
					if (this.hasField(field)) {
						value = og.u.cast(value, this.fieldType(field));
						collection = collection.where(field, op, value);
					}
				});
			}
			return collection;
		}
		/**
		 * returns OG_DB_TABLE
		 */
		getCollection() {
			return firebase.firestore().collection(this._ref);
		}
	}
	/*===================================================================================
	=  	DATABASES																		=
	====================================================================================*/
	/*====================================
	=  	ABSTRACT DB STORAGE CLASS		=
	====================================*/
	class OG_DB_LAYER extends OG_DB_MODULE {
		constructor() {
			super();
			this.use(OG_DB_STORAGE);
		}
		/**
		 * returns OG_DB_TABLE
		 */
		define(ref, table) {
			var table = this._addModel(ref, table);
		}

		initialize(db) {}
	}
	/*====================================
	=	ABSTRACT DOC DB STORAGE CLASS	=
	====================================*/
	class OG_SQL_DB extends OG_DB_LAYER {
		constructor() {
			super();
			this.use(OG_SQL_DB_STORAGE);
		}
	}
	/*====================================
	=	ABSTRACT DOC DB STORAGE CLASS	=
	====================================*/
	class OG_DB_DOC extends OG_DB_LAYER {
		constructor() {
			super();
			this.use(OG_DB_DOC_STORAGE);
		}
	}
	/*====================================
	=	LDB STORAGE CLASS				=
	====================================*/
	class OG_LDB_DOC extends OG_DB_DOC {
		constructor() {
			super();
			this.use(OG_LDB_DOC_STORAGE);
			this.use({ lib: LDB });
		}
	}
	/*====================================
	=	FDB STORAGE CLASS				=
	====================================*/
	class OG_FDB_DOC extends OG_DB_DOC {
		constructor() {
			super();
			this.use(OG_FDB_STORAGE);
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
		initialize(db) {
			if (og.u.has(db, 'config') && og.u.has(db.config, 'firebase')) {
				this._initializeFirebase(db.config.firebase);
				this.use({ lib: firebase.firestore() });
			}
		}
		signUp(email, password) {
			return new Promise((resolve, reject) => {
				if (this.signedIn || this.processing) {
					resolve(null);
					return;
				}

				this._authStart();
				firebase
					.auth()
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
				if (this.signedIn || this.processing) {
					resolve(null);
					return;
				}

				this._authStart();
				firebase
					.auth()
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
				firebase
					.auth()
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
		_initializeFirebase(credentials) {
			firebase.initializeApp(credentials);
			this._startAuthStateChangeListener();
		}
		_startAuthStateChangeListener() {
			firebase.auth().onAuthStateChanged((user) => {
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
	/*====================================
	=	DB MGR CLASS					=
	====================================*/
	class OG_DB_MANAGER extends OG_MODULE {
		constructor() {
			super();
			this.isremote = false;
			this._config = {
				path: null,
				tables: [],
			};
			this._tables = {};
			this._dbms = {
				local: {
					module: OG_LDB_DOC, //OG_DB_DOC,
					instance: null,
				},
				firebase: {
					module: OG_FDB_DOC,
					instance: null,
				},
				/*
				remote: {
					module: null,//OG_SQL_DB,
					instance: null
				},
				*/
			};
		}
		define(configPath) {
			return new Promise((resolve) => {
				this._config.path = configPath;
				og.http.get(this._config.path).then((db) => {
					this._setup(db);
					resolve(db);
				});
			});
		}
		_setup(db) {
			this._dbm_instantiate(db);
			db.tables.forEach((table) => {
				this._dbm_define(table);
				this._tables[table.name] = table.fields;
			});
		}
		_dbm_instantiate(db) {
			og.u.each(this._dbms, (dbm) => {
				dbm.instance = new dbm.module();
				dbm.instance.initialize(db);
			});
		}
		_dbm_define(table) {
			og.u.each(this._dbms, (dbm) => {
				dbm.instance.define(table.name, table);
			});
		}
		get tables() {
			return this._dbms.local.instance.$models;
		}
		get local() {
			return this._dbms.local.instance;
		}
		get firebase() {
			return this._dbms.firebase.instance;
		}
		get remote() {
			return null; //this._dbms.remote.instance
		}
	}
	/*===================================================================================
	=	UTILITIES																		=
	/*==================================================================================*/
	/*====================================
	=	ENVIRORNMENT CLASS		 		=
	====================================*/
	class OG_ENV {
		constructor() {}
		on(props) {
			if (this.server) {
				return props.server();
			} else {
				return props.client();
			}
		}
		get device() {
			var result = {
				tablet: false,
				phone: false,
			};
			if ($(window).width() > 600) {
				result.tablet = true;
			} else {
				result.phone = true;
			}
			return result;
		}
		get server() {
			return _njs_env;
		}
		get nodejs() {
			return _njs_env;
		}
		get mobile() {
			// var md = new MobileDetect(window.navigator.userAgent);
			// return md.mobile();
			return (
				!_njs_env &&
				window &&
				navigator &&
				('ontouchstart' in window || navigator.maxTouchPoints > 0 || navigator.msMaxTouchPoints > 0)
			);
			// return (function(a){
			//     return /(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino|android|ipad|playbook|silk/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4))
			// })(navigator.userAgent||navigator.vendor||window.opera)
		}
		get tablet() {
			let check = false;
			(function (a) {
				if (
					/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino|android|ipad|playbook|silk/i.test(
						a
					) ||
					/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(
						a.substr(0, 4)
					)
				)
					check = true;
			})(navigator.userAgent || navigator.vendor || window.opera);
			return check;
		}
		get web() {
			return !_njs_env;
		}
	}
	/*====================================
	=	UTILTY CLASS					 =
	=====================================*/
	class OG_UTIL {
		constructor() {
			this.BREAK = '--break-loop--';
			this.__id = 0;
			this.__copyDepth = 400;

			this.types = {
				string: (v) => {
					return v.toString();
				},
				int: (v) => {
					return parseInt(v);
				},
				integer: (v) => {
					return parseInt(v);
				},
				blob: (v) => {
					return v;
				},
				number: (v) => {
					return Number(v);
				},
				map: (v, toString) => {
					if (toString && this.is(v, 'object')) {
						return this.stringify(v);
					}
					return this.json(v);
				},
				date: (v, toString) => {
					if (toString && this.is(v, 'object') && v instanceof Date) {
						return v.toJSON();
					}
					if (this.is(v, 'object') && v instanceof Date) {
						return v;
					}
					if (this.isset(v)) {
						if (!this.is(v, 'string')) {
							v = v.toString();
						}
					} else {
						return new Date();
					}
					if (v.length == 0) {
						return new Date();
					} else {
						return new Date(v);
					}
				},
			};
		}
		duplicate(item, times) {
			var result = [];
			for (var i = 0; i < times; i++) {
				result.push(item);
			}
			return result;
		}
		substitute(array, value) {
			var result = [];
			for (var i = 0; i < array.length; i++) {
				result.push(value);
			}
			return result;
		}
		in(value, possibles) {
			for (var n in possibles) {
				if (possibles[n] == value) {
					return true;
				}
			}
			return false;
		}
		json(x) {
			var result = x;
			if (typeof x == 'string') {
				try {
					result = JSON.parse(x);
				} catch (error) {
					console.warn(error);
					result = null;
				}
			}
			return result;
		}
		string(v) {
			if (this.not(v)) {
				return '';
			}

			if (typeof v.toString == 'function') {
				return v.toString();
			}

			return this.stringify(v);
		}
		stringify(x) {
			if (this.is(x, 'object')) {
				return JSON.stringify(x);
			}
			return x;
		}
		not(x, y) {
			var z = typeof y == 'undefined' || y == null;
			if (typeof x == 'undefined' || x == null) {
				if (z) {
					return true;
				} else {
					return y;
				}
			} else {
				if (z) {
					return false;
				} else {
					return x;
				}
			}
		}
		isset(x) {
			return !this.not(x);
		}
		type(x, is) {
			if (this.not(is)) {
				if (x instanceof Array) {
					return 'array';
				} else {
					return typeof x;
				}
			} else {
				if (is == 'array') {
					return x instanceof Array;
				}
				return typeof x == is;
			}
		}
		find(object, where) {
			var result = [];
			this.each(object, (record, index) => {
				this.each(where, (value, key) => {
					if (og.u.has(record, key)) {
						if (record[key] == value) {
							result.push(record);
							return this.BREAK;
						}
					}
				});
			});

			return result;
		}
		has(object, prop) {
			if (this.not(object)) {
				return false;
			}
			if (!this.is(object, 'object')) {
				if (this.is(object, 'array')) {
					for (var i = 0; i < object.length; i++) {
						if (object[i] == prop) {
							return true;
						}
					}
				} else {
					return false;
				}
			}
			return object.hasOwnProperty(prop) || prop in object;
		}
		is(x, op, ob) {
			if (this.not(x)) {
				return false;
			} else if (this.not(op)) {
				return !this.not(x);
			} else if (this.not(ob)) {
				return this.type(x, op);
			} else {
				switch (op) {
					case 'in':
						return this.has(ob, x);
						break;
					default:
						return false;
				}
			}
		}
		cast(value, type) {
			type = type.toString().toLowerCase();
			var fn = this.types[type];
			if (fn) {
				return this.types[type](value);
			} else {
				console.log('invalid type cast', type);
				return value;
			}
		}
		uncast(value, type) {
			return this.types[type.toString().toLowerCase()](value, true);
		}
		each(object, callback) {
			var broken = false;
			if (this.is(object, 'array')) {
				object.forEach((value, index) => {
					if (broken) {
						return;
					}

					var res = callback(value, index);

					if (typeof res == 'string' && res === this.BREAK) {
						broken = true;
					}
				});
			} else if (this.is(object, 'object')) {
				Object.keys(object).forEach((key, index) => {
					if (broken) {
						return;
					}

					var res = callback(object[key], key, index);

					if (typeof res == 'string' && res === this.BREAK) {
						broken = true;
					}
				});
			} else if (this.is(object, 'number')) {
				for (var i = 0; i < object; i++) {
					if (broken) {
						continue;
					}

					var res = callback(i);

					if (typeof res == 'string' && res === this.BREAK) {
						broken = true;
					}
				}
			}
		}
		process(arr, cb) {
			return new Promise((resolve) => {
				if (!(arr instanceof Array)) {
					var list = [];
					for (var n in arr) {
						arr[n].__key = n;
						list.push(arr[n]);
					}
					arr = list;
					list = null;
				}
				var i = 0;
				var ld = function () {
					if (arr[i] == null) {
						resolve();
					} else {
						cb(
							arr[i],
							() => {
								i++;
								ld();
							},
							i
						);
					}
				};
				ld();
			});
		}
		size(object) {
			if (this.is(object, 'array')) {
				return object.length;
			} else if (this.is(object, 'object')) {
				return Object.keys(object).length;
			} else {
				return 0;
			}
		}
		values(collection) {
			return Object.values(collection);
		}
		defaults(object, defaults) {
			object = this.not(object, {});
			defaults = this.not(defaults, {});
			this.each(defaults, (value, key, index) => {
				if (this.has(object, key)) {
					object[key] = object[key];
				} else {
					object[key] = value;
				}
			});
			return object;
		}
		if(a, b) {
			if (a) {
				b();
			}
		}
		uniqueId(k) {
			k = k || Math.random().toString(36).substr(2, 9);
			this.__id++;
			return k + '_' + new Date().getTime() + '' + this.__id;
			//return k + Math.random().toString(36).substr(2, 9) + '-' + ((new Date()).getTime());
		}
		copy(object, depth) {
			depth = depth || 0;
			depth++;

			if (depth >= this.__copyDepth) {
				og.error('reached max copy depth');
				return null;
			}
			let result = {};
			if(object instanceof Array){
				result = [];
				for(let n = 0; n < object.length; n++){
					if (typeof object[n] == 'object') {
						result.push(this.copy(object[n]));
					} else {
						result.push(object[n]);
					}
				}
			}
			else{
				for (var n in object) {
					if (typeof object[n] == 'object') {
						result[n] = this.copy(object[n]);
					} else {
						result[n] = object[n];
					}
				}
			}
			return result;
		}
		promise(callback) {
			return new Promise((resolve, reject) => {
				callback({ resolve: resolve, reject: reject });
			});
		}
		resolve(assignee, promise, props) {
			props = this.defaults(props, {
				append: false,
				prepend: false,
			});
			promise.then((result) => {
				if (this.is(assignee, 'array') && this.is(result, 'array')) {
					if (props.append) {
						result.forEach((item) => {
							assignee.push(item);
						});
					} else if (props.prepend) {
						result.forEach((item) => {
							assignee.unshift(item);
						});
					} else {
						assignee.splice(0, assignee.length);
						result.forEach((item) => {
							assignee.splice(assignee.length, 0, item);
						});
					}
				} else {
					assignee = result;
				}
			});
		}
		image_to_base64(url) {
			return new Promise((resolve) => {
				// Create an Image object
				var img = new Image();

				// Set up a function to run once the image has loaded
				img.onload = function() {
					// Create a canvas element
					var canvas = document.createElement('canvas');
					var ctx = canvas.getContext('2d');

					// Set the canvas to the same dimensions as the image
					canvas.width = img.width;
					canvas.height = img.height;

					// Draw the image onto the canvas
					ctx.drawImage(img, 0, 0);

					// Convert the canvas to a data URL
					var dataURL = canvas.toDataURL('image/png');

					// Call the callback function with the result
					resolve(dataURL);
				};

				// Handle cross-origin access if necessary
				img.crossOrigin = 'Anonymous';

				// Start loading the image
				img.src = url;
			});
		}
		file_to_base64(file) {
			return new Promise((resolve, reject) => {
				var reader = new FileReader();
				reader.readAsDataURL(file);
				reader.onload = function () {
					resolve(reader.result);
				};
				reader.onerror = function (error) {
					console.error('FILE UPLOAD ERROR: ', error);
					reject(error);
				};
			});
		}
		blob_to_base64(blob){
			return new Promise((resolve) => {
				let reader = new FileReader();
				reader.readAsDataURL(blob); 
				reader.onloadend = function() {
					resolve(reader.result);
				}	
			})
		}
		base64_to_blob(dataUrl, type){
			var b64Data = dataUrl.split(',')[1];
			var contentType = type || 'image/png';
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

			var blob = new Blob(byteArrays, {type: contentType});
			return blob;
		}
        base64_to_file(dataurl, filename) {
            var arr = dataurl.split(','),
                mime = arr[0].match(/:(.*?);/)[1],
                bstr = atob(arr[1]), 
                n = bstr.length, 
                u8arr = new Uint8Array(n);
                
            while(n--){
                u8arr[n] = bstr.charCodeAt(n);
            }
            
            return new File([u8arr], filename, {type:mime});
        }
		rest(a, from) {
			from = from || 0;
			let args = [];
			for (let i = from; i < a.length; i++) {
				args.push(a[i]);
			}
			return args;
		}
		toArray(a) {
			if (!this.is(a, 'array')) {
				let b = [];
				return b.slice.call(a);
			}
			return a;
		}
		random(from, to) {
			return Math.floor(Math.random() * to) + from;
		}
		sort(list, prop, desc){
            if (desc){
                return list.sort((a, b) => (a[prop] > b[prop]) ? 1 : -1)    
            }
			return list.sort((a, b) => (a[prop] < b[prop]) ? 1 : -1)
		}
		array(a) {
			if (!this.is(a, 'array')) {
				return [a];
			}
			return a;
		}
		in_array(n, h) {
			return (
				h.filter((v) => {
					return v == n;
				}).length > 0
			);
		}
		array_push(a, item) {
			a.splice(a.length, 0, item);
		}
		array_unshift(a, item) {
			a.splice(0, 0, item);
		}
		array_has(a, value, prop) {
			let index = a.findIndex((item) => {
				return item[prop] == value;
			});
			return index != -1;
		}
		array_delete(a, value, prop) {
			let index = a.findIndex((item) => {
				return item[prop] == value;
			});
			if (index != -1) {
				a.splice(index, 1);
			}
		}
		array_find(a, value, prop) {
			let index = a.findIndex((item) => {
				return item[prop] == value;
			});
			if (index != -1) {
				return a[index];
			}
			return null;
		}
		array_empty(a) {
			a.splice(0, a.length);
		}
		array_replace(a, b) {
			this.array_empty(a);
			b.forEach((item) => {
				this.array_push(a, item);
			});
		}
		bytes(bytes){
			const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
			if (bytes === 0) return {size: 0, unit: 'Bytes'};

			const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)), 10);

			if (i === 0) return {size: bytes, unit: sizes[i]};

			return {size: (bytes / (1024 ** i)).toFixed(1), unit: sizes[i]};
		}
		byteSize(data){
			let str = this.stringify(data);
			let size = (new Blob([str])).size;
			let bytes = this.bytes(size);
			return bytes;
		}
        replace(originalString, searchString, replaceString) {
            // Use a regular expression with the 'g' flag for global replacement
            // searchString = searchString.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
            const regex = new RegExp(searchString, 'g');
            return originalString.replace(regex, replaceString);
        }
	}
	/*====================================
	=	MAP CLASS						=
	====================================*/
	class OG_MAP {
		constructor() {
			this._map = new Map();
		}
		set(x, y) {
			this._map.set(x, y);
		}
		delete(x) {
			return this._map.delete(x);
		}
		forEach(callback) {
			this._map.forEach(callback);
		}
		has(x) {
			return this._map.has(x);
		}
		get(x) {
			return this._map.get(x);
		}

		add(x, y) {
			if (!y && 'id' in x) {
				y = x;
				x = x.id;
			}
			this.set(x, y);
		}
		remove(x) {
			return this.delete(x);
		}
		clear() {
			this._map.clear();
		}
		$do(fn, props) {
			return new Promise((resolve, reject) => {
				og.u
					.process(this.array, (module, next) => {
						if (module instanceof og.module) {
							let value = module[fn];
							let result = null;
							if (typeof value == 'function') {
								result = value.apply(module, og.u.rest(og.u.toArray(arguments), 2));
							}
							if (result instanceof Promise) {
								result
									.then(() => {
										if (props.each) {
											props.each(result);
										}
										next();
									})
									.catch((error) => {
										console.error('OG_MAP call():', error);
										reject();
									});
							} else {
								if (props.each) {
									props.each(result);
								}
								next();
							}
						}
					})
					.then(() => {
						resolve();
					});
			});
		}
		$(fn, props) {
			return this.$do(fn, props);
		}
		each(callback) {
			this._map.forEach(callback);
		}
		get length() {
			return this._map.size;
		}
		get isEmpty() {
			return this._map.size == 0;
		}
		get entries() {
			return this._map.entries();
		}
		get keys() {
			return this._map.keys();
		}
		get values() {
			return this._map.values();
		}
		get first() {
			return this._map.values().next().value;
		}
		get last() {
			return Array.from(this._map)[this._map.size - 1][1];
		}
		get array() {
			return Array.from(this._map.values());
		}
	}
	/*====================================
	=	LIST CLASS						=
	====================================*/
	class OG_LIST {
		constructor(list) {
			this._list = list || [];
			this._pointers = {
				name: {},
				index: {},
			};
		}
		empty() {
			og.u.array_empty(this._list);
		}
		push(x, y) {
			if (og.u.not(y)) {
				og.u.array_push(this._list, x);
			} else {
				og.u.array_push(this._list, y);
				this._pointers.name[x] = this._list.length - 1;
			}
		}
		replace(x) {
			og.u.array_replace(this._list, x);
		}
		unshift(x) {
			og.u.array_unshift(this._list, x);
		}
		remove(x) {
			if (og.u.is(x, 'string') && x.prop && og.u.has(this._pointers, x)) {
				let y = x;
				x = this._pointers[y];
				delete this._pointers[y];
			}

			og.u.array_unshift(this._list, x);
		}
		get(x) {
			if (og.u.has(this._pointers, x)) {
				return this._list[this._pointers[x]];
			} else {
				return this._list[x];
			}
		}
		has(x) {
			let r = this.get(x);
			return r != null;
		}
		forEach(c) {
			this._list.forEach((x) => {
				c(x);
			});
		}
		get length() {
			return this._list.length;
		}
		get list() {
			return this._list;
		}
		get first() {
			return this._list[0];
		}
		set list(list) {
			this.empty();
			list.forEach((item) => {
				this.push(item);
			});
		}
	}
	/*====================================
	=	VARIABLE CLASS					=
	====================================*/
	class OG_VAR {
		constructor() {
			this.__a = 'VktQMzM9';
			this.__b = 'PT0=';
			this.__c = 'VKP33=PT12Z3gtPGpPbiAmZU9mPiBP==';
		}
		global_x(x) {
			return window[atob(x)];
		}
		json_x(x) {
			return JSON.parse(atob(x));
		}
		var_x(x) {
			return atob(x);
		}
		x_var(x) {
			return btoa(x);
		}
		x_json(y) {
			return btoa(JSON.stringify(y));
		}
		x_tk(n) {
			return this.x_json({ t: og.u.uniqueId(this.__c + '--t--' + n), k: og.u.uniqueId(this.__c + '--k--' + n) });
		}
		tk_x(n) {
			return {
				a: this.__a,
				b: this.__b,
				c: this.json_x({ t: og.u.uniqueId(this.__c + '--t--' + n), k: og.u.uniqueId(this.__c + '--k--' + n) }),
			};
		}
	}
	/*====================================
	=	FILE SYSTEM CLASS				=
	====================================*/
	class OG_FS {
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
				this._readdir(path, { resolve: resolve, reject: reject });
			});
		}

		_read(path, promise) {
			var fs = require('fs');
			fs.readFile(path, 'utf8', function (err, data) {
				if (err) {
					promise.reject(err);
				} else {
					promise.resolve(data);
				}
			});
		}
		_readdir(path, promise) {
			var fs = require('fs');
			fs.readdir(path, function (err, files) {
				if (err) {
					promise.reject(err);
				} else {
					promise.resolve(files);
				}
			});
		}
	}
	/*====================================
	=	EVENT EMITTER CLASS				=
	====================================*/
	class OG_EMIITER {
		constructor() {
			this._map = new Map();
			this._indexes = 0;
		}
		destroy() {
			this.reset();
		}
		reset() {
			this._map.clear();
		}
		on(action, a1, a2) {
			OG_EMIITER.counter++;
			let slot;
			let fn;
			let ev;
			if (a2) {
				slot = a1;
				fn = a2;
			} else {
				this._indexes++;
				slot = this._indexes;
				fn = a1;
			}

			if (!this._map.has(action)) {
				this._map.set(action, new Map());
			}

			ev = this._map.get(action);

			if (ev.has(slot)) {
				console.error('slot', slot, 'already taken');
			} else {
				ev.set(slot, fn);
			}
			return slot;
		}
		off(action, slot) {
			if (this._map.has(action)) {
				let ev = this._map.get(action);
				if (ev.has(slot)) {
					ev.delete(slot);
				}
			}
		}
		emit(action, props) {
			if (this._map.has(action)) {
				let ev = this._map.get(action);
				ev.forEach((fn) => {
					if (typeof fn == 'function') {
						fn(typeof props == 'undefined' ? null : props);
					}
				});
			}
		}
	}
	OG_EMIITER.counter = 0;
	/*====================================
	=	HTTP CLASS						=
	====================================*/
	class OG_HTTP {
		constructor() {
			this.EventListener = new og.emitter();
			this.slowRequestTime = 450;
			this._requestTimer = null;
			this._requests = [];
		}
		emitRequest() {
			this.emit('request');
			if (this._requestTimer != null) {
				clearTimeout(this._requestTimer);
			}
			this._requestTimer = setTimeout(() => {
				if (this._requests.length) {
					this.emit('slow-response');
				}
			}, this.slowRequestTime);
		}
		addRequest(url) {
			this._requests.push(url);
			return this._requests.length - 1;
		}
		clearRequest(index) {
			this._requests.splice(index, 1);
		}

		parseResponse(response) {
			return new Promise((resolve, reject) => {
				response
					.text()
					.then((data) => {
						try {
							if (data) {
								data = JSON.parse(data);
							} else {
								data = null;
							}
						} catch (error) {
							this.error(error, data);
							reject(error);
						}
						resolve(data);
					})
					.catch((error) => {
						this.error('Error Parsing Response Text', error);
						reject(error);
					});
			});
		}
		error(error, data) {
			console.error(error, data || '');
		}
		url(url, params) {
			if (!(url instanceof URL)) {
				url = new URL(url);
			}
			if (params && typeof params == 'object') {
				Object.keys(params).forEach((key) => url.searchParams.append(key, params[key]));
			}
			//url.searchParams.append('_dt', (new Date()).getTime());
			return url;
		}
		stringify(body) {
			return Object.keys(body)
				.map((key) => {
					let val = body[key];
					if (val instanceof Array) {
						return key + '[]=' + val.join('&' + key + '[]=');
					} else {
						return key + '=' + escape(val);
					}
				})
				.join('&');
		}
		get(url, queryString, props) {
			return this.fetch(
				url,
				queryString,
				{
					method: 'GET',
					headers: {
						Accept: 'application/json',
						'Content-Type': 'application/json',
					},
				},
				props
			);
		}
		post(url, body, props) {
			body = body || {};
			body = this.stringify(body);

			return this.fetch(
				url,
				null,
				{
					method: 'POST',
					headers: {
						Accept: 'application/json',
						'Content-Type': 'application/x-www-form-urlencoded',
					},
					body: body,
				},
				props
			);
		}
		fetch(url, queryString, ajaxProps, httpProps) {
			httpProps = og.u.defaults(httpProps || {}, {
				parseResponse: true,
				emitOnRequest: true,
			});

			if (httpProps.emitOnRequest) {
				this.emitRequest();
			}

			url = this.url(url, queryString);

			var requestId = this.addRequest(url);
			return new Promise((resolve, reject) => {
				fetch(url, ajaxProps)
					.then((response) => {
						this.clearRequest(requestId);

						if (!response.ok) {
							this.error('Server Error', response.statusText);
							reject();
						}

						if (httpProps.parseResponse === false) {
							resolve(response);
						} else {
							this.parseResponse(response)
								.then((data) => {
									this.emit('response');
									resolve(data);
								})
								.catch((error) => {
									reject(error);
								});
						}
					})
					.catch((error) => {
						this.error('Server Error', error);
						reject(error);
					});
			});
		}
		on(action, listener) {
			this.EventListener.on(action, listener);
		}
		emit(action, props) {
			this.EventListener.emit(action, props);
		}
	}
	/*====================================
	=	DOM CLASS						 =
	=====================================*/
	class OG_DOM {
		constructor() {}
		attr(element, x, y) {
			element.setAttribute(x, y);
			return this;
		}
		less(props) {
			props = og.u.defaults(props, { rel: 'stylesheet/less' });
			return this.stylesheet(props);
		}
		stylesheet(props) {
			props = og.u.defaults(props, {
				element: 'link',
				type: 'text/css',
				rel: 'stylesheet',
				src: './',
				id: '',
				html: '',
			});
			var element = document.createElement(props.element);
			element.type = props.type;
			if (props.id) {
				this.attr(element, 'id', props.id);
			}

			if (props.element == 'link') {
				element.rel = props.rel;
				element.href = props.src;
			} else {
				if (props.html) {
					element.innerHTML = html;
				}
			}
			document.getElementsByTagName('head')[0].appendChild(element);
			return element;
		}
		get dimensions() {
			return {
				width: window.innerWidth,
				height: window.innerHeight,
			};
		}
		get width() {
			return this.dimensions.width;
		}
		get height() {
			return this.dimensions.height;
		}
	}
	/*===================================================================================
	=	SERVER CLASSES																	=
	====================================================================================*/
	class OG_SERVER_DB {
		constructor(server) {
			this._server = server;
			this._orm = null;
			this._db = null;
			this._tables = {};
			this._modules = {};
			this._definitions = {};
			this._state = {
				connected: false,
				server: false,
				client: true,
			};
			this._settings = {
				force: false,
				showDropTables: false,
			};
		}
		connect() {
			this._orm = require('sequelize');
			this._db = new this._orm(
				this._server.settings.mysql.database,
				this._server.settings.mysql.username,
				this._server.settings.mysql.password,
				{
					host: 'localhost',
					dialect: 'mysql',
					logging: false,
					pool: {
						max: 5,
						min: 0,
						idle: 10000,
					},
				}
			);
			return this._connect();
		}
		load() {
			return this._loadConfig();
		}
		module(name, module) {
			this._modules[name] = module;
		}
		query(qs, props) {
			var type = props.type || 'SELECT';
			return this._db.query(qs, {
				replacements: props.replacements || null,
				type: this._db.QueryTypes[type],
			});
		}
		getFields(from) {
			var result = null;
			og.u.each(this._rawConfig.tables, (table) => {
				if (from == table.name) {
					result = table.fields;
				}
			});

			return result;
		}
		getField(from, fieldName) {
			var result = null;
			var fields = this.getFields(from);
			og.u.each(fields, (field, name) => {
				if (fieldName == name) {
					result = field;
				}
			});

			return result;
		}
		getPrimaryKey(name) {
			var result = null;
			var fields = this.getFields(name);
			og.u.each(fields, (field) => {
				if (og.u.has(field, 'primaryKey')) {
					result = field;
				}
			});
			return result;
		}
		getFalltenedColumnDefaultValues(name, columns) {
			var result = [];
			var fields = this.getFields(name);
			og.u.each(fields, (field, name) => {
				if (og.u.has(columns, name)) {
					result.push(columns[name]);
				} else {
					result.push(og.u.cast('', field.type));
				}
			});
			return result;
		}
		_loadConfig() {
			return new Promise((resolve, reject) => {
				og.fs.read(__dirname + '/db-modules/db-config.json').then((data) => {
					this._rawConfig = JSON.parse(data);
					this._config = JSON.parse(data);
					resolve();
				});
			});
		}
		_connect() {
			return new Promise((resolve, reject) => {
				var tables = [];
				og.u.each(this._config.tables, (table) => {
					tables.push(table.name);
					this._createTable(table);
				});

				og.u
					.process(this._tables, (table, next) => {
						table
							.sync({
								force: this._settings.force,
							})
							.then(() => {
								next();
							});
					})
					.then(() => {
						if (this._settings.showDropTables) {
							console.log('DROP TABLE ' + tables.join('; DROP TABLE ') + ';');
						}
						resolve();
					});
			});
		}
		_createTable(props) {
			og.u.each(props.fields, (field) => {
				field.type = this._orm[field.type.toUpperCase()];
				field.allowNull = true;
			});
			var options = {
				createdAt: 'created_at',
				updatedAt: 'updated_at',
				underscored: true,
				freezeTableName: true, // Model tableName will be the same as the model name
			};
			if (props.indexes) {
				options.indexes = props.indexes;
			}
			var table = this._db.define(props.name, props.fields, options, props.config || null);

			this._tables[props.name] = table;
		}
		get tables() {
			return this._tables;
		}
		get orm() {
			return this._db;
		}
	}
	class OG_SERVER extends OG_MODULE {
		constructor() {
			super();
			this.settings = {
				db: false,
				app: '/client',
				port: 3000,
				use: () => {},
				mysql: {
					database: 'sandbox',
					username: 'root',
					password: 'Jasmine76%@',
					//password: 'fTekGoat2788',
				},
				security: {
					restrict: false,
					cookie: {
						name: 'v8ew4gw937g6439f679',
						value: 'eiguheowrgheogreuygho',
					},
				},
				body_parser: {
					json: { limit: '10000mb' },
					urlencoded: { limit: '100000mb', extended: true },
				},
			};
			this.types = {
				DM: 'data_module',
				UTILITY: 'auth_module',
				AUTH: 'auth_module',
			};

			this._db = null;
			this._routes = [];
			this._server = null;
			this._instance = null;
			this._express = null;
			this._http = null;
			this._auth = null;
			this._modules = {
				database: {},
				utility: {},
			};
			this._parsers = {
				body: null,
				cookie: null,
			};
		}
		connect(rootDir) {
			this._initialize();
			this._useUtilities();

			this.use(this._express.static(rootDir + this.settings.app));
			return new Promise((resolve, reject) => {
				if (og.socket) {
					og.socket.server_before_connect(this._http);
				}
				this._instance = this._http.listen(this.settings.port, () => {
					if (this.settings.db) {
						this._loadDatabase().then(() => {
							this._connectDatabase().then(() => {
								this._connectUtilities().then(() => {
									if (og.socket) {
										og.socket.connect(this._http);
									}
									this.emit('connected');
									console.log('listening on ', this.settings.port, rootDir + this.settings.app);
									resolve();
								});
							});
						});
					} else {
						this._connectUtilities().then(() => {
							this.emit('connected');
							console.log('listening on ', this.settings.port, rootDir + this.settings.app);
							resolve();
						})
					}
				});
			});
		}
		setup(props) {
			props = og.u.defaults(props, {
				app: '',
				port: 3000,
				database: '',
				username: '',
				password: '',
				restrict: true,
				use: () => {},
			});
			this.settings.app = props.app;
			this.settings.port = props.port;
			this.settings.mysql.database = props.database;
			this.settings.mysql.username = props.username;
			this.settings.mysql.password = props.password;
			this.settings.security.restrict = props.restrict;
			this.settings.use = props.use;
		}
		use(method) {
			this._server.use(method);
		}
		get(url, callback) {
			this._server.get(url, (req, res) => {
				this._loadSignedInUser(req, res).then((user) => {
					callback(req.query, req, res, { user: user })
						.then((response) => {
							res.status(200).json(response);
						})
						.catch((error) => {
							console.error(error);
							res.writeHead(404);
						});
				});
			});
		}
		post(url, callback) {
			this._server.post(url, (req, res) => {
				this._loadSignedInUser(req, res).then((user) => {
					var result = req.body;
					if (typeof req.body == 'string') {
						result = JSON.parse(req.body);
					}

					callback(result, req, res, { user: user })
						.then((response) => {
							res.status(200).json(response);
						})
						.catch((error) => {
							console.error(error);
							res.writeHead(404);
						});
				});
			});
		}

		include(object, type) {
			switch (type) {
				case this.types.AUTH:
					if (typeof object == 'object' && object instanceof OG_MODULE) {
						this._modules.utility[object.constructor.name] = object;
						if (this._auth == null) {
							this._auth = this._modules.utility[object.constructor.name];
						}
					}
					break;
				case this.types.UTILITY:
					if (typeof object == 'object' && object instanceof OG_MODULE) {
						this._modules.utility[object.constructor.name] = object;
					}
					break;
				case this.types.DM:
					if (typeof object == 'function' && og.storage.isPrototypeOf(object)) {
						var name = object.prototype.constructor.name;
						this._modules.database[name] = {
							construct: object,
							instance: null,
						};
					}
					break;
			}
		}
		getModule(name) {
			return this._modules.database[name].instance;
		}
		module(name) {
			return this.getModule(name);
		}
		jsonEncode(){
			return this._parsers.body.json(this.settings.body_parser.json);
		}
		urlEncode(){
			return this._parsers.body.urlencoded(this.settings.body_parser.urlencoded);
		}

		/********************************************************************
		*																	*
		*																	*
		/********************************************************************/
		_loadSignedInUser(req, res) {
			return new Promise((resolve) => {
				if (this._auth && this._db) {
					this._auth.server__load__authenticated__user(req, res).then((result) => {
						//console.log('---------------------------------------------------')
						//console.log('--------------', 'SERVER user:', '-----------------')
						//console.log(result)
						//console.log('--------------', 'SERVER user:', '-----------------')
						//console.log('---------------------------------------------------')
						resolve(result);
					});
				} else {
					resolve(null);
				}
			});
		}
		_useUtilities() {
			og.u.each(this._modules.utility, (module) => {
				this.use((req, res, next) => {
					module.server__route(req, res, next);
				});
			});
		}
		_connectUtilities() {
			return new Promise((resolve) => {
				og.u
					.process(this._modules.utility, (module, next) => {
						var result = module.server__connect(this);
						if (result instanceof Promise) {
							result.then(() => {
								next();
							});
						} else {
							next();
						}
					})
					.then(() => {
						resolve();
					});
			});
		}
		/********************************************************************/
		_initialize() {
			this._express = require('express');
			this._server = this._express();
			this._parsers.body = require('body-parser');
			this._parsers.cookie = require('cookie-parser')();
			this._http = require('http').createServer(this._server);
			this.settings.use(this._server);
			
			this.use(this._parsers.body.json(this.settings.body_parser.json));
			this.use(this._parsers.body.urlencoded(this.settings.body_parser.urlencoded));
			this.use(this._parsers.cookie);
			this.use(this._access().cookie);
			this.use(this._access().headers);
		}
		_loadDatabase() {
			return new Promise((resolve, reject) => {
				if (this.settings.mysql.database == null) {
					this._db = null;
					resolve();
					return;
				}
				this._db = new OG_SERVER_DB(this);
				this._db
					.load()
					.then(() => {
						og.u.each(this._modules.database, (module, name) => {
							module.instance = new module.construct(this, this._db);
							this._db.module(name, module);
						});
						resolve();
					})
					.catch(() => {
						resolve();
					});
			});
		}
		_connectDatabase() {
			if (this._db == null) {
				return Promise.resolve();
			}
			return this._db.connect();
		}
		_access() {
			return {
				cookie: this._cookieAccess(),
				headers: this._headerAccess(),
			};
		}
		_cookieAccess() {
			return (req, res, next) => {
				var name = this.settings.security.cookie.name;
				var key = this.settings.security.cookie.value;
				var cookie = req.cookies[name];
				if (this.settings.security.restrict) {
					if (cookie != null && cookie == key) {
						res.cookie(name, key);
						next();
					} else {
						res.writeHead(404);
						return res.end();
					}
				} else {
					res.cookie(name, key);
					next();
				}
			};
		}
		_headerAccess() {
			return (req, res, next) => {
				res.header('Access-Control-Allow-Origin', '*');
				res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
				next();
			};
		}
		get db() {
			return this._db;
		}
	}
	class OG_CONTENT {
		constructor() {
			this._type = null;
			this._event = null;
			this._fields = {
				id: null,
				user_id: null,
				user: null,
				title: null,
				message: null,
				group: null,
			};
			this.data = {};
		}

		get json() {
			let result = {};
			og.u.each(this._fields, (value, key) => {
				if (value != null) {
					result[key] = value;
				}
			});
			return result;
		}
		get type() {
			return this._type;
		}
		get event() {
			return this._event;
		}
		get id() {
			return this._fields.id;
		}
		get user_id() {
			return this._fields.user_id;
		}
		get user() {
			return this._fields.user;
		}
		get group() {
			return this._fields.group;
		}
		get title() {
			return this._fields.title;
		}
		get message() {
			return this._fields.message;
		}
		set id(v) {
			this._fields.id = v;
		}
		set user_id(v) {
			this._fields.user_id = v;
		}
		set user(v) {
			this._fields.user = v;
		}
		set group(v) {
			this._fields.group = v;
		}
		set title(v) {
			this._fields.title = v;
		}
		set message(v) {
			this._fields.message = v;
		}
	}
	class OG_POST extends OG_CONTENT {
		constructor() {
			super();
			this.files = [];
		}
		follow(user) {
			this.user_id = user.user_id;
			let post = new og.dm_post();
			return post.follow(this.json).then((result) => {
				this.send_notification();
				return result;
			});
		}
		share() {
			if (this.message == null || this.message.toString().trim().length == 0) {
				return Promise.resolve({ error: true, message: '' });
			}

			return new Promise((resolve) => {
				let post = new og.dm_post();
				console.log('sharing post...');
				post.share(this.json).then((response) => {
					console.log('post created...');
					this.id = response.post.post_id;
					this.group = response.group;
					this.user = response.user;

					var media = new og.media();
					media.module = 'post';
					media.id = this.id;
					media.files = this.files;
					media.save().then(() => {
						this.send_message();
						resolve();
					});
				});
			});
		}
		send_notification() {
			this._event = og.socket.events.notifcation;
			this.send();
		}
		send_message() {
			this._event = og.socket.events.message;
			this.send();
		}
		send() {
			og.socket.emit(this);
		}
	}
	class OG_MEDIA {
		construct() {
			this.module = '';
			this.id = '';
			this.files = [];
		}
		save() {
			return new Promise((resolve) => {
				og.u
					.process(this.files, (content, next) => {
						var media = new og.dm_media();
						console.log('write media', this.module, this.id);
						console.log(content);
						console.log('---------------------------------------');
						var processor = new og.media_processor();
						processor.size = 300;
						processor.resize(content).then((dataUrl) => {
							console.log('reduced media from', content.length, 'to', dataUrl.length);
							media
								.create({
									media_module: this.module,
									media_module_id: this.id,
									content: dataUrl,
								})
								.then((result) => {
									next();
								});
						});
					})
					.then(() => {
						resolve();
					});
			});
		}
		read() {
			var media = og.server.module('MEDIA');
			return media
				.read_files({
					module: this.module,
					id: this.id,
				})
				.then((response) => {
					return response;
				});
		}
	}
	class OG_RESOURCE_ITEM {
		constructor(props) {
			props = og.u.defaults(props, {
				id: og.u.uniqueId(),
				dir: '',
				type: '',
				name: '',
				filename: '',
				ext: '',
				classname: '',
				category: '',
				path: '',
			});

			this.id = props.id;
			this.name = props.name;
			this.type = props.type;
			this.filename = props.filename;
			this.ext = props.ext;
			this.classname = props.classname;
			this.category = props.category;
			this.dir = props.dir;
			this.path = props.path;
			this.sequence = 0;
			this.title = '';

			this.content = '';
			this.blob = null;
			this.remove = false;

			this.rename = {
				active: false,
				filename: '',
			};

			if (this.filename.length && !this.ext.length) {
				this.ext = this.filename.split('.').pop().toLowerCase();
			}

			this.title = this.filename.split('.').slice(0, -1).join('.').split('-').join(' ');
			this.classname = this.title.toLowerCase().split(' ').join('-');
			this.name = this.classname + '.' + this.ext;
			this.path = this.dir + '/' + this.name;
		}

		rename(n) {
			this.rename.filename = n + '.' + this.ext;
			this.rename.active = true;
		}

		get json() {
			var filename = this.filename;
			if (this.rename.active) {
				filename = this.rename.filename;
			}
			return {
				id: this.id,
				title: this.title,
				type: this.type,
				name: this.name,
				ext: this.ext,
				filename: filename,
				classname: this.classname,
				category: this.category,
				path: this.path,
				newPath: this.newPath,
				sequence: this.sequence,
			};
		}
	}
	class OG_RESOURCE_LOADER extends OG_MODULE {
		constructor() {
			super();
			if (og.env.server) {
				og.server.include(this, og.server.types.UTILITY);
			}
		}
		server__route(req, res, next) {
			next();
		}
		server__connect(server) {
			server.get('/load_resource', (result, req, res, data) => {
				return this.load(result);
			});
		}
		fetch(props) {
			props = og.u.defaults(props, { dir: '', path: '', type: '', category: '', user_id: 0 });
			return og.http.get(og.url('load_resource'), props);
		}
		load(props) {
			this.fs = new OG_FS();
			props = og.u.defaults(props, { dir: '', path: '', type: '', category: '', user_id: 0 });
			return this.loadResource(props);
		}

		loadResource(props) {
			return new Promise((resolve, reject) => {
				var resources = [];
				this.fs.readdir(props.dir).then((files) => {
					files.forEach((file) => {
						if (file.match(/ds_store/gi)) {
							return;
						}
						var resource = new OG_RESOURCE_ITEM({
							dir: props.path,
							type: props.type,
							category: props.category,
							filename: file,
						});
						resources.push(resource.json);
					});
					resolve(resources);
				});
			});
		}

		storeResource(dir, resources, props) {
			return new Promise((resolve, reject) => {
				og.u
					.process(resources, (resource, next) => {
						console.log('rename', dir + '/' + resource.filename, ' > ', dir + '/' + resource.name);
						//next()
						this.fs
							.read(dir + '/' + resource.filename)
							.then((contents) => {
								this.fs
									.rename(dir + '/' + resource.filename, dir + '/' + resource.name)
									.then(() => {})
									.catch((error) => {
										console.log('rename error', error);
										reject();
									});
							})
							.catch((error) => {
								console.log('rename error', error);
								reject();
							});
					})
					.then(() => {
						resolve();
					});
			});
		}

		putResource(resource) {
			return new Promise((resolve, reject) => {
				this.jsql.table.resource
					.findAll
					//{
					//    where:{
					//        name: resource.name
					//    }
					//}
					()
					.then((data) => {
						console.log('--------resources-------');
						console.log(JSON.stringify(data));
						console.log('---------------');
						if (data.length) {
							next();
						} else {
							this.jsql.table.resource
								.create({
									resource_id: this.jsql.util.uniqueId(),
									name: resource.name,
									class_name: resource.classname,
									title: resource.title,
									ext: resource.ext,
									path: resource.path,
									file_name: resource.name,
									content: props.contents ? contents : '',
									type: props.type,
									category: props.category,
									user_id: 0,
								})
								.then((model) => {
									next();
								})
								.catch((error) => {
									console.log('save error', error);
									reject();
								});
						}
					});
			});
		}
	}
	class OG_DS extends OG_MODULE {
		constructor() {
			super();
			if (og.env.server) {
				og.server.include(this, og.server.types.UTILITY);
			}
		}
		server__route(req, res, next) {
			next();
		}
		server__connect(server) {
			server.get('/ls', (result, req, res, data) => {
				return this.__ls(result);
			});
		}
		ls(n) {
			let props = { ds: n };
			return og.http.get(og.url('ls'), props);
		}
		__ls(n) {
			return new Promise((resolve) => {
				let dirTree = require('directory-tree');
				let tree = dirTree(n.ds);
				resolve(tree);	
			})
		}
	}
	/*====================================
	=	METRIC							=
	====================================*/
	class OG_METRIC{
		constructor(){
			this._dpi = 96;
		}
		dpi(dpi) {
			if (typeof dpi != 'undefined') {
				this._dpi = dpi;
			}
			else{
				return this._dpi;
			}
			// return document.getElementById("dpi").offsetHeight;
		}
		dpmm() {
			return 25.4 / this.dpi();
			// return document.getElementById("dpmm").offsetHeight;
		}
		dpcm() {
			return 2.54 / this.dpi();
			// return document.getElementById("dpcm").offsetHeight;
		}
		toInches(value, dec) {
			if (typeof dec == 'undefined') {
				dec = 2;
			}
			return Number(Number(value / this.dpi()).toFixed(dec));
		}
		toCentimeters(value, dec) {
			if (typeof dec == 'undefined') {
				dec = 2;
			}
			return Number(Number(value * this.dpcm()).toFixed(dec));
		}
		toMillimeters(value, dec) {
			if (typeof dec == 'undefined') {
				dec = 2;
			}
			return Number(Number(value * this.dpmm()).toFixed(dec));
		}	
		fromInches(value) {
			return value * this.dpi();
		}
		fromCentimeters(value) {
			return value / this.dpcm();
		}
		fromMillimeters(value) {
			return value / this.dpmm();
		}	
		convert(value, metric, dec) {
			if (metric == 'in') {
				return this.toInches(value, dec);
			}
			if (metric == 'mm') {
				return this.toMillimeters(value, dec);
			}
			if (metric == 'cm') {
				return this.toCentimeters(value, dec);
			}
			return value;
		}
		toPixels(value, metric){
			if (metric == 'in') {
				return this.fromInches(value);
			}
			if (metric == 'mm') {
				return this.fromMillimeters(value);
			}
			if (metric == 'cm') {
				return this.fromCentimeters(value);
			}
			return value;
		}
	}
	/*====================================
	=	FS								=
	====================================*/
	class OG_FILE_STORAGE{
		constructor(){
			this.dir = 'local';
		}
		
		write(name, data){
			return new Promise((resolve, reject) => {
				let path = this.dir + '/' + name;
				let fileStorage = new FileStorage();
				fileStorage.write(path, data).then(() => {
					resolve({error: false, path: path});
				}, function(error) {
					reject();
				});
			});
		}
		read(name){
			return new Promise((resolve, reject) => {
				let path = this.dir + '/' + name;
				let fileStorage = new FileStorage();
				fileStorage.read(path).then((result) => {
					resolve({error: false, result: result});
				}, function(error) {
					reject();
				});
			});
		}
		base64ToBlob(dataUrl, type) {
			var b64Data = dataUrl.split(',')[1];
			var contentType = 'image/' + type.toLowerCase();
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
	
		  var blob = new Blob(byteArrays, {type: contentType});
		  return blob;
		}
	}
	/*====================================
	=	CONVERT							=
	====================================*/
	class OG_CONVERT {
		aiToSVG(inputFile){
			return new Promise((resolve) => {
				// inputFile.arrayBuffer().then((buffer) => {
					let defaultClient = cloudmersiveConvertApiClient.ApiClient.instance;
					let Apikey = defaultClient.authentications['Apikey'];
					Apikey.apiKey = 'd5a28ec7-d12a-4879-9600-baac709f2925';
					let api = new cloudmersiveConvertApiClient.ConvertImageApi()
					api.convertImageImageFormatConvert('AAI', 'SVG', inputFile, (error, data, response) => {
						resolve(response.body);
					});
				// });
			});
		}
	}
	/*====================================
	=	REGISTRATION					=
	====================================*/
	og = new OG();
	og.use(OG_MODULE, { as: 'module', singleton: false });
	og.use(OG_AUTHENTICATION, { as: 'authentication', singleton: false });
	og.use(OG_DOM, { as: 'dom', singleton: true });
	og.use(OG_ENV, { as: 'env', singleton: true });
	og.use(OG_UTIL, { as: 'u', singleton: true });
	og.use(OG_LIST, { as: 'list', singleton: false });
	og.use(OG_VAR, { as: 'var', singleton: true });
	og.use(OG_EMIITER, { as: 'emitter', singleton: false });
	og.use(OG_HTTP, { as: 'http', singleton: true });
	og.use(OG_FS, { as: 'fs', singleton: true });
	og.use(OG_DB_REQUEST, { as: 'request', singleton: false });
	og.use(OG_DB_COLUMN, { as: 'column', singleton: false });
	og.use(OG_DB_RECORD, { as: 'record', singleton: false });
	og.use(OG_DB_MANAGER, { as: 'db', singleton: true });
	og.use(OG_SERVER, { as: 'server', singleton: true });
	og.use(OG_CONTENT, { as: 'content', singleton: false });
	og.use(OG_MEDIA, { as: 'media', singleton: false });
	og.use(OG_POST, { as: 'post', singleton: false });
	og.use(OG_MAP, { as: 'map', singleton: false });
	og.use(OG_RESOURCE_LOADER, { as: 'resource_loader', singleton: true });
	og.use(OG_DS, { as: 'ds', singleton: true });
	og.use(OG_METRIC, { as: 'metric', singleton: true });
	og.use(OG_FILE_STORAGE, { as: 'file', singleton: true });
	og.use(OG_CONVERT, { as: 'convert', singleton: true });

	if (_njs_env) {
		module.exports = og;
	} else {
		window.og = og;
	}
})();
