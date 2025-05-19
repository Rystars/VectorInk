(function () {
	/*====================================
	=	FONT SHEET						=
	=====================================*/
	class OG_FONTSHEET {
		constructor() {
			this.ref = new Map();
			this.fonts = [];
			this.limit = 20;
			this.offset = 0;
			this.page = 1;
			this.styleSheet = null;
			this.loaded = false;
			//this.dir = 'src/vgx/'
			//this.path = 'src/vgx/resource/fonts.json'
			this.dir = '';
			this.path = this.dir + 'resource/fonts.json';
			this.initialized = false;
			this.ui = {
				ready: false,
			};
			this.http_get = () => {
				return og.http.get(og.host + this.path);
			};
		}
		initialize() {
			return new Promise((resolve) => {
				if (this.initialized) {
					resolve();
				}
				this._load().then(() => {
					this._createStyleSheet().then(() => {
						this.initialized = true;
						resolve();
					});
				});
			});
		}
		_createStyleSheet() {
			return new Promise((resolve) => {
				var resources = this.fonts;
				var styles = [];
				resources.forEach((resource) => {
					var dir = this.dir;
					var style = `
						@font-face{
							font-family: '${resource.title}';
							src: url(${dir + resource.path});
						}
						.${resource.classname}{
							font-family: '${resource.title}';
						}

					`;

					styles.push(style);
				});

				this.styleSheet = document.createElement('style');
				this.styleSheet.type = 'text/css';
				this.styleSheet.innerHTML = styles.join(' ');
				document.getElementsByTagName('head')[0].appendChild(this.styleSheet);

				if (!this.ui.ready) {
					og.u
						.process(resources, (resource, next) => {
							this.processFont(resource.title).then(() => {
								next();
							});
						})
						.then(() => {
							this.ui.ready = true;
						});
				}

				resolve();
			});
		}
		processFont(name) {
			return new Promise((resolve) => {
				fontSpy(name, {
					success: function () {
						resolve();
					},
					failure: function () {
						resolve();
					},
				});
			});
		}
		_fetchAllFonts() {
			return new Promise((resolve) => {
				og.http.get(og.host + this.path).then((response) => {
					resolve(response);
				});
				/*
				og.jsql.get('resource', {
					where: {type: 'font'},
				}).then((resources) => {
					resolve(resources)
				})
				*/
			});
		}
		_load() {
			return new Promise((resolve, reject) => {
				this.http_get().then((response) => {
					this.fonts = response;
					response.forEach((resource) => {
						this.ref.set(resource.id, resource);
					});
					resolve(this.fonts);
				});
				/*
				this.offset = (this.page - 1) * this.limit
				og.jsql.get('resource', {
					where: {type: 'font'},
					limit: this.limit,
					offset: this.offset,
				}).then((resources) => {
					if(resources.length){
						this.fonts = resources
					}
					resolve(this.fonts)
				})
				*/
			});
		}
		nextPage() {
			this.page++;
			return this._load();
		}
		prevPage() {
			this.page--;
			return this._load();
		}
	}
	/*====================================
	=	COMPONENT						=
	=====================================*/
	class OG_COMPONENT {
		constructor(app) {
			this._app = app || null;
			this._active = false;
			this._emitter = new og.emitter();
		}
		activate() {
			this.active = true;
		}
		deactivate() {
			this.active = false;
		}
		on(action, listener) {
			this._emitter.on(action, listener);
		}
		emit(action, props) {
			this._emitter.emit(action, props);
		}
		get active() {
			return this._active;
		}
		get app() {
			return this._app;
		}
		set active(bool) {
			this._active = bool;
		}
	}
	/*====================================
	=	ALERT					=
	=====================================*/
	class OG_ALERT extends OG_COMPONENT {
		constructor(app) {
			super(app);
		}
		show(message) {
			return new Promise((resolve) => {
				let dialog = this.app.ui.$f7.dialog.create({
					text: og.locale.get(message),
					on: {
						opened: function () {
							//console.log('notification opened')
						},
						closed: function () {
							resolve();
							//console.log('notification opened')
						},
					},
				});
				dialog.open();
			});
		}
	}
	/*====================================
	=	TOAST					=
	=====================================*/
	class OG_TOAST extends OG_COMPONENT {
		constructor(app) {
			super(app);
		}
		show(message) {
			let toast = this.app.ui.$f7.toast.create({
				position: 'top',
				horizontalPosition: 'center',
				destroyOnClose: true,
				text: og.locale.get(message),
				closeTimeout: 1000,
				closeButtonText: 'dismiss',
				closeButtonColor: 'white',
				//closeButton: true,
				//icon: '<i class="fas fa-bell"></i>',
				on: {
					opened: function () {
						//console.log('notification opened')
					},
				},
			});
			toast.open();
		}
	}
	/*====================================
	=	NOTIFICATION					=
	=====================================*/
	class OG_NOTIFICATION extends OG_COMPONENT {
		constructor(app) {
			super(app);
		}
		show(message) {
			let toast = this.app.ui.$f7.notification.create({
				position: 'top',
				text: og.locale.get(message),
				closeTimeout: 3000,
				closeButton: true,
				icon: '<i class="fas fa-bell"></i>',
				on: {
					opened: function () {
						console.log('notification opened');
					},
				},
			});
			toast.open();
		}
	}
	/*====================================
	=	FORM							=
	=====================================*/
	class OG_FORM_FIELD extends OG_COMPONENT {
		constructor(props) {
			super();
			this.id = props.id;
			this.type = props.type;
			this.label = props.label;
			this.placeholder = props.placeholder;
			this.name = props.name;
			this.required = props.required;
			this._value = props.value;
		}

		get value() {
			return this._value;
		}

		set value(value) {
			this._value = value;
			this.emit('change', this._value);
		}
	}
	/*====================================
	=	FORM							=
	=====================================*/
	class OG_FORM {
		constructor() {
			this._fields = {};
		}

		add(props) {
			props = og.u.defaults(props, {
				id: og.u.uniqueId(),
				type: 'text',
				label: '',
				placeholder: '',
				name: '',
				required: false,
				value: '',
			});
			this._fields[props.name] = new OG_FORM_FIELD(props);
		}
		clear() {
			og.u.each(this._fields, (field) => {
				field.value = '';
			});
		}

		get fields() {
			return this._fields;
		}
		get json() {
			var result = {};
			og.u.each(this._fields, (field) => {
				result[field.name] = field.value;
			});

			return result;
		}
	}
	/*====================================
	=	SIGNUP							=
	=====================================*/
	class OG_SIGNUP extends OG_COMPONENT {
		constructor(app) {
			super(app);
			this.form = new OG_FORM();
			this.form.add({ label: 'Name', name: 'name', type: 'text', required: true });
			this.form.add({ label: 'Email', name: 'email', type: 'email', required: true });
			this.form.add({ label: 'Password', name: 'password', type: 'password', required: true });
			this.form.fields.name.value = 'tester ' + og.u.uniqueId();
			this.form.fields.email.value = 'tester.' + og.u.uniqueId() + '@email.com';
			this.form.fields.password.value = '123qwe';
		}
	}
	/*====================================
	=	SIGNIN							=
	=====================================*/
	class OG_SIGNIN extends OG_COMPONENT {
		constructor(app) {
			super(app);
			this.form = new OG_FORM();
			this.form.add({ label: 'Email', name: 'email', type: 'email', required: true });
			this.form.add({ label: 'Password', name: 'password', type: 'password', required: true });
		}
	}
	/*====================================
	=		SESSION CLASS				=
	=====================================*/
	class OG_SESSION{
		constructor(){
			this.props = {
				loggedIn: false
			};
			this.member = {
				loggedIn: false
			};
			this._emitter = new og.emitter();
			this.refresh = {
				state: null,
				loggedIn: false,
				listener: null
			}
		}
		onRefresh(listener){
			if(this.refresh.loggedIn){
				if(this.refresh.state){
					listener(this.refresh.state);
				}
				this.refresh.state = null;
			}
			else{
				this.refresh.listener = listener;
			}
		}
		init(member){
			this.member = member;
			this.props.loggedIn = this.member.loggedIn;
			let state = this.state();

			if(this.member.loggedIn && !state.loggedIn && state.path != '/'){
				this.refresh.loggedIn = true;
				if(this.refresh.listener){
					this.refresh.listener(state);
				}
				else{
					this.refresh.state = state;
				}
			}
			this.emit('ready');
			// this._emitter
		}
		state(path, props){
			if(path){
				this.refresh.state = null;
				let route = og.app.routes.filter((route) => {return route.path == path});
				this.set('app_state', {
					path: path,
					component: route,
					loggedIn: this.member.loggedIn,
					props: props || {}
				});
			}
			else{
				let route = og.app.routes.filter((route) => {return route.path == '/'});
				return this.get('app_state') || {
					path: '/',
					component: route,
					loggedIn: false,
					props: {}
				};
			}
		}
		start(){
			if(window.MemberStack){
				setTimeout(() => {
					window.MemberStack.reload();
				}, 1000);
			}
		}
		set(key, value){
			Lockr.set(key, value);
		}
		get(key, value){
			return Lockr.get(key);
		}
		on(action, listener) {
			this._emitter.on(action, listener);
		}
		emit(action, props) {
			this._emitter.emit(action, props);
		}
		get user(){
			return this.member;
		}
		get loggedIn(){
			return this.member.loggedIn;
		}
	}
	/*====================================
	=	APP IO							=
	=====================================*/
	class OG_IO_PROPS {
		constructor(app) {
			this.app = app;
			this.props = {};
			this.state = {
				input: false,
			};
		}
		href(path, props) {
			og.session.state(path, props);
			if (props) {
				this.input(props);
				this.props[path] = props;
			}
		}
		input(data, id) {
			this.data = data;
			this.state.input = true;
		}
		output(path) {
			var props = null;

			if (this.state.input && og.u.has(this.props, path) && this.props[path] != null) {
				props = this.props[path];
				this.props[path] = null;
			}

			return { props: props };
		}
	}	
	/*====================================
	=	F7 VUE APP CLASS				=
	=====================================*/
	class OG_APP {
		constructor() {
			this.ui = null;
			this.f7 = null;
			this.theme = 'aurora';
			this._config = {
				routes: [],
			};
			this._components = {
				signup: new OG_SIGNUP(this),
				signin: new OG_SIGNIN(this),
				notification: new OG_NOTIFICATION(this),
				toast: new OG_TOAST(this),
				alert: new OG_ALERT(this),
				io: new OG_IO_PROPS(this),
				session: new OG_IO_PROPS(this),
			};
		}
		route(path, component) {
			this._config.routes.push({
				path: path,
				component: component,
				options: {
					transition: 'f7-fade',
				},
			});
		}
		use(module) {
			Framework7.use(module);
		}
		create(state) {
			state = state || {url: '/'};
			(function (self) {
				Framework7.use(Framework7Vue);

				// Init Vue App
				self.ui = new Vue({
					// App Root Element
					el: '#app',

					// App root data
					data() {
						return {
							state: state,
							// Framework7 parameters that we pass to <f7-app> component
							f7params: {
								// Array with app routes
								routes: self._config.routes,
								// App Name
								name: 'Vector Ink',
								// App id
								id: 'com.app.vectorink',
								// ...
								// theme: 'md', //og.env.mobile ? 'auto' : 'aurora',
								theme: self.theme,
								touch: {
									mdTouchRipple: false
								},
								dialog: {
									buttonOk: __l('Ok'),
									buttonCancel: __l('Cancel'),
								},
								touchRippleElements: '.no-touch-ripple-allowed'
							},
						};
					},
					// App root methods
					methods: {
						// ....
					},
				});
			})(this);
		}

		get component() {
			return OG_COMPONENT;
		}
		get components() {
			return this._components;
		}
		get signup() {
			return this._components.signup;
		}
		get signin() {
			return this._components.signin;
		}
		get notification() {
			return this._components.notification;
		}
		get toast() {
			return this._components.toast;
		}
		get alert() {
			return this._components.alert;
		}
		get io() {
			return this._components.io;
		}
		get routes() {
			return this._config.routes;
		}
	}

	og.use(OG_APP, { as: 'app', singleton: true });
	og.use(OG_SESSION, { as: 'session', singleton: true });
	//og.use(OG_FONTSHEET, 	{as: 'fontsheet', 		singleton: true})

	og.use(OG_FORM, { as: 'form', singleton: false });
	og.use(OG_FORM_FIELD, { as: 'form_field', singleton: false });
	
	// if(typeof window.MemberStack != 'undefined'){
	// 	window.MemberStack.onReady.then((member) => {
	// 		og.session.init(member);
	// 	});
	// }
	Vue.prototype.$og = og;
})();
