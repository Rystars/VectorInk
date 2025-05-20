module.exports = function(props){
	var __og__dir 	= 		__dirname// + '/client/fiddle/hib/lib/og'
	var __og__db 	= 		__og__dir + '/db-modules'
	var og 			= 		require(__og__dir + '/og')
	/**********************/
	require(__og__dir + '/og-socket')(og)
	/**********************/
	require(__og__db + '/storage')(og)
	require(__og__db + '/user')(og)
	require(__og__db + '/user_assoc')(og)
	require(__og__db + '/media')(og)
	require(__og__db + '/post')(og)
	require(__og__db + '/post-mail')(og)
	require(__og__db + '/session')(og)
	require(__og__dir + '/og-auth')(og)
	
	return og
}