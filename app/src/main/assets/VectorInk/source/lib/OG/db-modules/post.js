(function(){
	var __ = (function(og){
		class POST extends og.storage{
			follow(props){
				return this._send(props, 'follow_post')
			}
			share(props){
				return this._send(props, 'share_post')
			}
			group(props){
				return this._send(props, 'share_to_post')
			}
			_send(props, route){
				props = og.u.defaults(props, {
					user_id: null,
					title: '',
					caption: '',
					message: '',
					image: '',
				})
				return this.create(props, route)
			}

			constructor(server, db){
				super(server, db, 'post')
				this.attributes('default', 	['post_id', 'author_id', 'user_id', 'record_group_id', 'post_type', 'title', 'caption', 'message', 'image', 'content', 'content_type', 'url', 'created_at', 'updated_at'])
				this.attributes('create', 	['post_id', 'author_id', 'user_id', 'record_group_id', 'post_type', 'title', 'caption', 'message', 'image', 'content', 'content_type', 'url', 'created_at', 'updated_at'])
				this.attributes('update', 	['title', 'caption', 'message', 'image', 'content', 'content_type', 'url'])
				this.attributes('delete', 	['post_id'])

				this._key('primary', 		'post_id')

				this._get('read_post', 			this.__read)
				this._get('read_news_feed', 	this.__read_news_feed, {auth: true})
				this._post('create_post', 		this.__create, {auth: true})
				this._post('update_post', 		this.__update, {auth: true})
				this._post('delete_post', 		this.__delete, {auth: true})

				this._post('follow_post', 		this.__follow, 		{auth: true})
				this._post('share_post', 		this.__share, 		{auth: true})
				this._post('share_to_post', 	this.__share_to, 	{auth: true})

				this._types = {
					follow: 'F',

					share: 'S',

					share_to: 'G',
				}
			}
			_post_mail(post_id, user_id){
				let post_mail = og.server.getModule('POST_MAIL')
				return post_mail.create({
					post_id: post_id,
					user_id: user_id,
				})
			}
			__create(promise, props, user){
				props.author_id = user.user_id

                this._create(props).then((result) => {
					this._post_mail(result.post_id, props.user_id).then(() => {
						this.__read(promise, result)
					})
                })
            }
			__follow(promise, props, auth){
				props.post_type = this._types.follow
				props.title = 'You have a new follower'
				props.message = auth.name + ' Is Following you'
				props.author_id = auth.user_id

				var user = og.server.module('USER')
				user.follow_user(props.user_id, auth).then((followed) => {
					if(followed.error){
						promise.resolve(followed)
						return
					}

					og.socket.server_refresh_user_groups(props.user_id).then(() => {
						this._create(props).then((result) => {
							this._post_mail(result.post_id, props.user_id).then(() => {
								this.__read(promise, result)
							})
						})
					})
				})
            }
			__share(promise, props, auth){
				props.post_type = this._types.share
				props.author_id = auth.user_id
				console.log('__share post')
				var user = og.server.module('USER')
				user.read({user_id: auth.user_id}).then((user_data) => {
					console.log('read user...')
					user.read_owner_feed_group(auth.user_id).then((group_data) => {
						console.log('read user feed group...')
						props.record_group_id = group_data.record_group_id
						this._create(props).then((post_data) => {
							console.log('created post...')
							promise.resolve({post: post_data, user: user_data, group: group_data})
						})
					})
				})
            }
			__share_to(promise, props, user){
				props.post_type = this._types.share_to
                this.__create(promise, props, user)
			}
			__read_news_feed(promise, props, user){
				this._read_news_feed(user.user_id).then((response) => {
					promise.resolve(response)
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
			_read_news_feed(user_id){

				return new Promise((resolve, reject) => {
					this.query([
						'SELECT',
						'a.post_id, a.author_id, a.post_type, a.title, a.message,',
						'b.user_id AS user_user_id, b.email AS user_email, b.name AS user_name,',
						'c.name as group_name, c.record_group_id',
						'FROM post a',
						'JOIN user b ON b.user_id = a.author_id',
						'JOIN record_group c ON c.record_group_id = a.record_group_id AND c.owner_id = a.author_id',
						'JOIN record_group_user d ON d.group_id = c.record_group_id',
						'WHERE', ['d.user_id', '=', user_id]
					])
					.run({type: 'SELECT', replacements: [user_id]})
					.then((results) => {
						var posts = []
						og.u.process(results, (result, next) => {
							let post = {
								post_id: result.post_id,
								author_id: result.author_id,
								post_type: result.post_type,
								title: result.title,
								message: result.message,
								user: {
									user_id: result.user_user_id,
									name: result.user_name,
									email: result.user_email,
								},
								group: {
									record_group_id: result.record_group_id,
									name: result.group_name,
								},
								files: []
							}
							let media = new og.media()
							media.module = 'post'
							media.id = result.post_id
							media.read().then((files) => {
								post.files = files
								posts.push(post)
								next()
							})
						}).then(() => {
							resolve(posts)
						})
					})
				})
			}
			read(props){
				return og.env.on({
					server: () => {
						return this._read(props)
					},
					client: () => {
						return this.get('read_post', props)
					},
				})
			}
			read_news_feed(user_id){
				return og.env.on({
					server: () => {
						return this.__read_news_feed(user_id)
					},
					client: () => {
						return this.get('read_news_feed', {})
					},
				})
			}
			create(props, route){
				return og.env.on({
					server: () => {
						return this._create(props).then((result) => {
							return this._read(result)
						})
					},
					client: () => {
						return this.post(route, props)
					},
				})
			}
			update(props){
				return og.env.on({
					server: () => {
						return this._update(props)
					},
					client: () => {
						return this.post('update_post', props)
					},
				})
			}
			delete(props){
				return og.env.on({
					server: () => {
						return this._delete(props)
					},
					client: () => {
						return this.post('delete_post', props)
					},
				})
			}
		}
		og.server.include(POST, og.server.types.DM)
		og.use(POST, {as: 'dm_post', singleton: false})
	})
	if(typeof module != 'undefined' && module.exports){module.exports = function(og){__(og);return {}}} else{__(og)}
})()