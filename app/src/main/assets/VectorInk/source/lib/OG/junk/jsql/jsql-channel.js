(function(){
	class JSQL_CHANNEL{
		constructor(){
			this.cli = new JSQL_CLI()
			this.cli.url.open_channel = '/open_channel'
			this.io = null
			this._connected = false
			this.channelKey = null
		}

		open(channel_id){
			this.cli.get(this.cli.url.open_channel, {channel_id: channel_id}).then((response) => {
				if(!response.channel){
					resolve()
				}
				else{
					var socket = io();
					socket.on(response.channel, function (msg) {
						console.log('incoming', msg)
					});
				}
			})
		}

		connect(server, http){
			this.server = server
			this.jsql = this.server.jsql
			this.io = require('socket.io')(this.server.http)
			this._listen(this.server.app)
			this._connected = true

			this.io.on('connection', function(socket){
				socket.on('message', function(msg){
					this.io.emit('message', msg);
				});
			});
		}

		_listen(app){
			app.get(this.cli.url.open_channel, (req, res) => {
				this.__open(req.query).then((response) => {
					res.status(200).json(response)
				}).catch((error) => {
					console.error(error)
					res.writeHead(404)
				})
			})
		}

		__open(req){
			return new Promise((resolve, reject) => {
				this.jsql.table.channel.findById(req.channel_id).then((response) => {
					if(response.length){
						var data = response[0].dataValues
						this.jsql.table.post.findAll({
							where: {
								channel_id: req.channel_id
							}
						}).then((response) => {
							var posts = []
							response.forEach((post) => {
								posts.push(post.dataValues)
							})

							this.channelKey = 'message_' + channel_id
							this._openSocket(this.channelKey)
							resolve({channel: this.channelKey, posts: posts})
						})
					}
					else{
						resolve({channel: null})
					}
				})
			})
		}
	}

	if (typeof module != 'undefined' && module.exports) {
		module.exports = new JSQL_CHANNEL()
	} else {
		window.jsql_channel = new JSQL_CHANNEL()
	}
})()