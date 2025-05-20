(function(){
	var __ = (function(og){
		class MEDIA extends og.storage{
			constructor(server, db){
				super(server, db, 'media')
				this.attributes('default', 	['media_id', 'user_id', 'media_module', 'media_module_id', 'mime', 'content', 'description', 'url', 'created_at', 'updated_at'])
				this.attributes('create', 	['media_id', 'user_id', 'media_module', 'media_module_id', 'mime', 'content', 'description', 'url', 'created_at', 'updated_at'])
				this.attributes('update', 	['title', 'caption', 'message', 'image', 'content', 'content_type', 'url'])
				this.attributes('delete', 	['media_id'])

				this._key('primary', 		'media_id')

				this._get('read_media', 		this.__read, 		{auth: true})
				this._get('read_files', 		this.__read_files, 	{auth: true})
				this._post('create_media', 		this.__create, 		{auth: true})
				this._post('update_media', 		this.__update, 		{auth: true})
				this._post('delete_media', 		this.__delete, 		{auth: true})
			}
			__create(promise, props, user){
				props.user_id = user.user_id
				this._create(props).then((response) => {
					this.__read(promise, response)
				})
            }
			__read(promise, props){
				this._read(props).then((response) => {
					promise.resolve(response)
				})
			}
			__read_files(promise, props){
				this._read_files(props).then((response) => {
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
			_read_files(props){
				return this.query([
					'SELECT', 	this.select.default,
					'FROM',		this.table,
					'WHERE',
					['media_module', '=', props.module],
					'AND',
					['media_module_id', '=', props.id]

				])
				.run({type:'SELECT', replacements: [props.module, props.id], log: false})
				.then((response) => {
					response.forEach((result) => {
						if(typeof result.content == 'object'){
							console.log('parse media content')
							result.content = String.fromCharCode.apply(null, new Uint16Array(result.content))
						}
					})
					return response
				})
			}

			read(props){
				return og.env.on({
					server: () => {
						return this._read(props)
					},
					client: () => {
						return this.get('read_media', props)
					},
				})
			}
			read_files(props){
				return og.env.on({
					server: () => {
						return this._read_files(props)
					},
					client: () => {
						return this.get('read_files', props)
					},
				})
			}
			create(props){
				return og.env.on({
					server: () => {
						return this._create(props).then((result) => {
							return this._read(result)
						})
					},
					client: () => {
						return this.post('create_media', props)
					},
				})
			}
			update(props){
				return og.env.on({
					server: () => {
						return this._update(props)
					},
					client: () => {
						return this.post('update_media', props)
					},
				})
			}
			delete(props){
				return og.env.on({
					server: () => {
						return this._delete(props)
					},
					client: () => {
						return this.post('delete_media', props)
					},
				})
			}
		}
		og.server.include(MEDIA, og.server.types.DM)
		og.use(MEDIA, {as: 'dm_media', singleton: false})
	})
	if(typeof module != 'undefined' && module.exports){module.exports = function(og){__(og);return {}}} else{__(og)}
})()