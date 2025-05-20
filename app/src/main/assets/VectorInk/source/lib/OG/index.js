var __og__dir 	= 		__dirname + '/apps/hib/lib/og/OG'
var __og__db 	= 		__og__dir + '/db-modules'
var og 			= 		require(__og__dir + '/og')
/**********************/
require(__og__db + '/storage')(og)
require(__og__db + '/user')(og)
require(__og__db + '/session')(og)
require(__og__dir + '/og-auth')(og)

/**********************/
og.server.setup({
	app: '/apps',
	port: 3000,
	database: 'sandbox',
	username: 'root',
	password: 'Jasmine76%@',
})
/**********************/
og.server.connect(__dirname).then(() => {
	//DROP TABLE user_room; DROP TABLE user; DROP TABLE room; DROP TABLE resource; DROP TABLE book_reference; DROP TABLE category; DROP TABLE post; DROP TABLE media; DROP TABLE session;
})