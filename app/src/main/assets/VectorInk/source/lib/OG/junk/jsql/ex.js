var server = require('./jsql/jsql-server')
//drop table book_reference; drop table category; drop table resource;
server.connect({
        database: 'jsql',
        username: 'root',
        password: 'jeo8872',
        port: 3000,
        src: __dirname + '/app-dev',
        restrict: {
            bypass: true,
            name: 'gw475gtw4#$^H34g734g40384',
            value: 'h787g8w73E%^JE9f739',
        }
    }).then(() => {
    /*
        server.jsql.query(`
            INSERT INTO user
            SET user_id = :user_id, email = :email, first_name = :first_name, last_name = :last_name, password = :password
        `, {
            user_id: '2788',
            email: 'jonofarrow@gmail.com',
            first_name: 'Jonathan',
            last_name: 'OFarrow',
            password: 'jeo8872',
            }, 'INSERT').then((results) => {
            console.log(results)
        })
        */

        var ds = require('./app-dev/app/dev/utilities/datasource.js');
        ds.connect(server.app)

        var resource = require('./jsql/jsql-resource')
        resource.load(server.jsql, './app-dev/draw/resource/fonts', {
            path: 'resource/fonts',
            type: 'font',
            contents: false,
            category: 'bold'
        })
    /*
        resource.load(server.jsql, './app-dev/draw/resource/icons', {
            path: 'resource/icons',
            type: 'icons',
            contents: true
        })
        */
        //var table = app.table
        //var user = table.user
        //var channel = table.channel
	})

	(function(){
		var JSQL_MODULE = require('../../jsql/jsql-module')
		class JSQL_USER extends JSQL_MODULE{
			create(){
				server.jsql.query(`
					INSERT INTO user
					SET user_id = :user_id, email = :email, first_name = :first_name, last_name = :last_name, password = :password
				`, {
					user_id: '2788',
					email: 'jonofarrow@gmail.com',
					first_name: 'Jonathan',
					last_name: 'OFarrow',
					password: 'jeo8872',
					}, 'INSERT').then((results) => {
					console.log(results)
				})
			}
		}
		module.exports = JSQL_USER
	})()