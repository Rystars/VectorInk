(function(){
	class Application{
		constructor(){
			this._emitter = new EventEmitter()
			//this.initialized = false
		}

		frameworkReady(app){
			this.initialize(app)
		}

		initialize(app){
			this._emitter.emit('ready', app)
		}

		ready(listener){
			this._emitter.on('ready', listener)
		}
	}

	window.$app = new Application()

	class AngularInstance{
		constructor(name, addons){
			this.name = name
			this.module = angular.module(name, addons || []);
		}

		initialize(){
			//var domElement = document.getElementById('html');
			//angular.bootstrap(domElement, [this.name]);

			//setTimeout(() => {
				window.$app.frameworkReady(this.module)
			//}, 500)
		}
	}

	class MVC{
		constructor(addons){
			this._framework = new AngularInstance('app', addons)
			this._angular = this._framework.module
		}

		initialize(){
			this._framework.initialize()
		}

		get angular(){
			return this._framework.module
		}
	}

	window.App = MVC
})()