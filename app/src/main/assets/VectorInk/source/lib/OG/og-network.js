(function(){
	var __ = (function(og){
		class OG_NET_USERS{
			constructor(){
				this._dm = new og.dm_user()
				this._users = []
			}
			refresh(){
				og.u.resolve(this._users, this.load())
			}
			load(){
				return new Promise((resolve) => {
					resolve([])
				})
			}
			get dm(){
				return this._dm
			}
			get users(){
				return this._users
			}
			get length(){
				return this._users.length
			}
		}
		class OG_NET_FOLLOWING extends OG_NET_USERS{
			constructor(){
				super()
			}
		}
		class OG_NET_FOLLOWERS extends OG_NET_USERS{
			constructor(){
				super()
			}
		}
		class OG_NET_SUGGESTIONS extends OG_NET_USERS{
			constructor(){
				super()
			}
			load(){
				return this.dm.suggested_users()
			}
		}

		class OG_NET_FEED{
			constructor(){
				this._posts = []
				this._dm = new og.dm_post()
				this.reverse = false
			}
			push(data){
				if(this.reverse){
					og.u.array_unshift(this._posts, data)
				}
				else {
					og.u.array_push(this._posts, data)
				}
			}
			refresh(){
				og.u.resolve(this._posts, this._dm.read_news_feed())
			}

			get posts(){
				return this._posts
			}
		}
		class OG_NETWORK{
			constructor(){
				this._connected = false
				this._user_assoc = new og.dm_user_assoc()

				this.suggestions = new OG_NET_SUGGESTIONS()
				this.feeds = {
					news: new OG_NET_FEED()
				}
				this.feeds.news.reverse = true
			}
			follow(user){
				let post = new og.post()
				return post.follow(user)
			}
			broadcast(name){
				let user = new og.dm_user()
				return user.start_broadcast({description: name}).then((result) => {
					return result
				})
			}
			share(content){
				//let post = new og.dm_post()
				//return post.as_public(content)
			}

			connect(){
				if(this._connected){
					return
				}
				og.socket.connect({
					id: 'og-network-feed',
					on: {
						notifcation: (props) => {
							og.app.notification.broadcast(props.title)
						},
						message: (props) => {
							switch(props.group.type){
								case 'feed':
									this.feeds.news.push(props)
									break
							}
						},
					}
				})

				this.refresh_suggestions()
				this.refresh_feeds()
				this._connected = true
			}
			disconnect(){
				og.socket.disconnect('og-network-feed')
			}

			refresh_suggestions(){
				this.suggestions.refresh()
			}
			refresh_feeds(){
				this.feeds.news.refresh()
			}
			server__route(req, res, next){
				next()
			}
			server__connect(server){
			}
		}
		og.use(OG_NETWORK, 			{as: 'network', 			singleton: true})
		og.server.include(og.network, og.server.types.UTILITY)
	})
	if(typeof module != 'undefined' && module.exports){module.exports = function(og){__(og);return {}}} else{__(og)}
})()