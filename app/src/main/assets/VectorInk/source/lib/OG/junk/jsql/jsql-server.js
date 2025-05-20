(function () {
    var _jsql_path = '../jsql/jsql';

	class JSQL_SERVER {
		constructor() {

		}
		connect(props) {
			return new Promise((resolve, reject) => {
				props = props || {}
				var express = require('express')
				var bodyParser = require('body-parser')
                var cookieParser = require('cookie-parser')
				var app = express()
				var http = require('http').createServer(app)
                app.use(cookieParser());
				app.use(bodyParser.json({
					limit: '100mb'
				}))
				app.use(bodyParser.urlencoded({
					limit: '1000mb',
					extended: true
				}))
                app.use(function(req, res, next){
                    if(props.restrict){
                        if(props.restrict.bypass || (req.cookies[props.restrict.name] != null && req.cookies[props.restrict.name] == props.restrict.value)){
                            res.cookie(props.restrict.name, props.restrict.value)
                            next()
                        }
                        else{
                            res.writeHead(404)
                            return res.end()
                        }
                    }
                    else{
                        next()
                    }
                })
                app.use(function(req, res, next) {
                    res.header("Access-Control-Allow-Origin", "*");
                    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
                    next();
                })
				if(props.src){
					app.use(express.static(props.src))
				}

				this.express = express
				this.app = app
				this.http = http
				this.bodyParser = bodyParser

				this.server = this.http.listen(props.port || 3000, () => {
					this.jsql = require(_jsql_path)
					this.jsql.connect(this.app, props.database, props.username, props.password).then(() => {
                        resolve()
                    })
				})
			})
		}
		get table(){
			return this.jsql.table
		}
	}
	module.exports = new JSQL_SERVER()
})()
/************************************************************************
var app = require('./jsql/jsql-server')
app.connect({
	database: 'appstack',
	username: 'root',
	password: 'jeo8872',
	port: 3000
}).then(() => {
	app.jsql.table.users.
})
/************************************************************************
var admin = require('firebase-admin')
admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  databaseURL: 'https://appstack.firebaseio.com'
});
/************************************************************************
var og = require('./client/lib/og/og.js')
var shop = og.shop('sk_test_OvMKuxbHtysUgf82cfL94cdT00zvjo4Ptp', 'plan_G7qFujf4AzZGFi')
shop.init(app)
/************************************************************************/