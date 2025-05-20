(function(){
	var __ = (function(og){

		class OG_SOCKET{
			constructor(){
				this._server = {
					io: null,
					users: {},
					sockets: {},
				}
				this._client = {
					io: null,
				}
				this._ = {
					get: 'get-',
					post: 'post-',
				}
				this._events = {
					notifcation: 'notifcation',
					share: 'share',

					message: 'message',
					signin: 'signin',
					disconnect: 'disconnect'
				}
				this._listeners = {}
			}
			///////////////////////////////////////////////////
			////CLIENT METHODS
			///////////////////////////////////////////////////

			///////////////////////////////////////////////////
			////CLIENT LISTENERS
			_client_register_listeners(id, listeners){
				listeners = og.u.defaults(listeners, {
					notifcation: function(){},
					message: function(){},
				})
				this._listeners[id] = {
					notifcation: listeners.notifcation,
					message: listeners.message,
				}
			}
			_client_deregister_listeners(id){
				if(og.u.has(this._listeners, id)){
					delete this._listeners[id]
				}
			}
			_client_call_listeners(event, response){
				og.u.each(this._listeners, (listener, id) => {
					if(og.u.has(listener, event)){
						listener[event](response)
					}
				})
			}
			///////////////////////////////////////////////////
			////CLIENT CONNECTIONS
			_client_connect(props){
				props = og.u.defaults(props, {
					id: null,
					on: null
				})

				if(props.id && props.on){
					this._client_register_listeners(props.id, props.on)
				}
				///////////////////////////////////////////////////
				this._client.io = io(og.host)
				///////////////////////////////////////////////////
				////CLIENT CONNECTION
				this._client.io.on('connect', () => {
					///////////////////////////////////////////////////
					////SIGNIN
					this._client.io.emit(this._events.signin, {user_id: og.auth.user.user_id})
					///////////////////////////////////////////////////
				})
				///////////////////////////////////////////////////

				///////////////////////////////////////////////////
				////RECEIVE NOTIFICATION
				this._client.io.on(this._.post + this._events.notifcation, (response) => {
					this._client_call_listeners(this._events.notifcation, response)
				})
				///////////////////////////////////////////////////
				////RECEIVE NOTIFICATION
				this._client.io.on(this._.post + this._events.message, (response) => {
					console.log('incoming message', response)
					this._client_call_listeners(this._events.message, response)
				})
				///////////////////////////////////////////////////
			}
			_client_disconnect(id){
				if(og.u.isset(id)){
					this._client_deregister_listeners(id)
				}
			}
			_client_emit(content){
				this._client.io.emit(this._.get + content.event, content.json)
			}

			///////////////////////////////////////////////////
			////MIDDLEWARE
			emit(content){
				og.env.on({
					client: () => {
						this._client_emit(content)
					},
					server: () => {
						this._server_emit(content)
					},
				})
			}

			disconnect(props){
				og.env.on({
					client: () => {
						this._client_disconnect(props)
					},
					server: () => {
						this._server_disconnect(props)
					},
				})
			}

			connect(props){
				og.env.on({
					client: () => {
						this._client_connect(props)
					},
					server: () => {
						this._server_connect(props)
					},
				})
			}

			///////////////////////////////////////////////////
			////SERVER METHODS
			///////////////////////////////////////////////////
			server_refresh_user_groups(user_id){
				return this._server_refresh_user_groups(user_id)
			}
			///////////////////////////////////////////////////
			server_before_connect(http){}
			_server_connect(http){
				this._server_connect_socket(http)
			}
			_server_connect_socket(http){
				this._server.io = require('socket.io')(http)

				this._server.io.on('connection', (socket) => {
					console.log('socket connection. socket_id:', socket.id)
					///////////////////////////////////////////////////
					////SIGNIN
					socket.on(this._events.signin, (props) => {
						console.log('socket signin. user_id:', props.user_id)
						this._server_add_user(socket, props.user_id)
						//@TODO ALERT ASSOCIATES OF ONLINE STATUS
					})
					///////////////////////////////////////////////////

					///////////////////////////////////////////////////
					////SIGNOUT
					socket.on(this._events.disconnect, (reason) => {
						if (reason === 'io server disconnect') {
							console.log('the disconnection was initiated by the server, reconnecting manually...')
							// the disconnection was initiated by the server, you need to reconnect manually
							socket.connect();
						}
						else{
							console.log('--------disconnecting socket--------')
							this._server_disconnected(socket.id)
							console.log('------------------------------------')
						}
					})
					///////////////////////////////////////////////////

					///////////////////////////////////////////////////
					////NOTIFICATION
					////props.user = to user
					socket.on(this._.get + this._events.notifcation, (props) => {
						console.log('socket ', this._.get + this._events.notifcation,':', socket.id)
						this._server_emit_notifcation(props)
					})
					///////////////////////////////////////////////////
					////MESSAGE
					socket.on(this._.get + this._events.message, (props) => {
						console.log('socket ', this._.get + this._events.message,':', socket.id)
						this._server_emit_message(props)
					})
					///////////////////////////////////////////////////
				});
			}
			_server_emit_notifcation(props){
				this._server_get_user_sockets(props.user_id).then((sockets) => {
					sockets.forEach((socket_id) => {
						console.log('socket to', this._events.notifcation, socket_id, props.user_id)
						this._server.io.to(socket_id).emit(this._.post + this._events.notifcation, props)
					})
				})
			}
			_server_emit_message(props){
				console.log('outgoing message to record group', props.group)
				console.log('outgoing message', props.message)
				this._server.io.to(props.group.name).emit(this._.post + this._events.message, props)
			}
			_server_add_user(socket, user_id){
				return new Promise((resolve) => {
					var socket_id = socket.id
					if(!og.u.has(this._server.users, user_id)){
						this._server.users[user_id] = {}
					}
					this._server.users[user_id][socket_id] = {user_id: user_id, socket_id: socket_id, socket: socket, groups: {}}
					this._server.sockets[socket_id] = user_id
					this._server_refresh_user_groups(user_id).then(() => {
						resolve()
					})
				})
			}
			_server_refresh_user_groups(user_id){
				//todo: this needs to delay and wait for user to stop clicking follow
				return new Promise((resolve) => {
					var user = og.server.getModule('USER')
					this._server_clear_user_groups(user_id)
					user.read_user_groups(user_id).then((record_groups) => {
						record_groups.forEach((record_group) => {
							this._server_add_user_group(user_id, record_group)
						})
						resolve()
					})
				})
			}
			_server_clear_user_groups(user_id){
				og.u.each(this._server.users[user_id], (data, socket_id) => {
					og.u.each(data.groups, (record_group, name) => {
						data.socket.leave(record_group.name)
					})
				})
			}
			_server_add_user_group(user_id, record_group){
				og.u.each(this._server.users[user_id], (data, socket_id) => {
					console.log('join record_group -> ', record_group.name)
					data.groups[record_group.name] = record_group
					data.socket.join(record_group.name)
				})
			}
			_server_get_user_sockets(user_id){
				return new Promise((resolve) => {
					var sockets = []
					if(og.u.has(this._server.users, user_id)){
						og.u.each(this._server.users[user_id], (socket_data) => {
							sockets.push(socket_data.socket_id)
						})
					}
					resolve(sockets)
				})
			}
			_server_disconnected(socket_id){
				return new Promise((resolve) => {
					//find socket
					if(og.u.has(this._server.sockets, socket_id)){
						console.log('disconnecting socket:', socket_id)
						let user_id = this._server.sockets[socket_id]
						console.log('disconnecting socket user:', user_id)
						//find associated user
						if(og.u.has(this._server.users, user_id)){
							console.log('removing user socket...')
							//find and remove socket from user
							if(og.u.has(this._server.users[user_id], socket_id)){
								delete this._server.users[user_id][socket_id]
								console.log('socket removed from user')
								//remove user if no sockets are left
								if(og.u.size(this._server.users[user_id]) == 0){
									console.log('removing user')
									delete this._server.users[user_id]
								}
								else{
									console.log('user still online')
								}
							}
						}
						delete this._server.sockets[socket_id]
						console.log('socket disconnected', socket_id)
					}
					resolve()
				})
			}
			_server_disconnect(){

			}

			get events(){
				return this._events
			}
		}
		og.use(OG_SOCKET, 			{as: 'socket', 			singleton: true})
	})
	if(typeof module != 'undefined' && module.exports){module.exports = function(og){__(og);return {}}} else{__(og)}
})()