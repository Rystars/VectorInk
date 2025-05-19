(function(){
	var __ = (function(og){
		class POST_MAIL extends og.storage{
			constructor(server, db){
				super(server, db, 'post_mail')
				this.attributes('create', 	['post_mail_id', 'post_id', 'user_id', 'viewed', 'updated_at'])
				this.attributes('default', 	['post_mail_id', 'post_id', 'user_id', 'viewed', 'updated_at'])
				this.attributes('delete', 	['post_mail_id'])

				this._key('primary', 				'post_mail_id')

				this._get('read_post_mail', 		this.__read)
				this._post('create_post_mail', 		this.__create)
			}
			__create(promise, props){
                this._create(props).then((result) => {
                    this.__read(promise, result)
                })

            }
			__read(promise, props){
				this._read(props).then((response) => {
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
			read(props){
				return og.env.on({
					server: () => {
						return this._read(props)
					},
					client: () => {
						return this.get('read_post_mail', props)
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
						return this.post('create_post_mail', props)
					},
				})
			}
		}
		og.server.include(POST_MAIL, og.server.types.DM)
		og.use(POST_MAIL, {as: 'dm_post_mail', singleton: false})
	})
	if(typeof module != 'undefined' && module.exports){module.exports = function(og){__(og);return {}}} else{__(og)}
})()