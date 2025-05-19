(function(){
	var __ = (function(og){
		var __STATE = '7421-3378'
		class OG_PAYPAL{
			constructor(){
				this.id = ''
				this.sandbox = true;
				this.currency = 'USD';
				this.url = {
					paypal: (this.sandbox == true) ? 'https://www.sandbox.paypal.com/cgi-bin/webscr' : 'https://www.paypal.com/cgi-bin/webscr',
					success: 'https://vectorgraphicstudio.com/billing/success.php',
					cancel: 'https://vectorgraphicstudio.com/billing/cancel.php',
					ipn: 'https://vectorgraphicstudio.com/billing/ipn.php',
				};
				this._products = [];
			}

			add(name, id, price){
				this._products.push({
					name: name,
					id: id,
					price: price,
				})
			}

			get products(){
				return this._products;
			}
		}
		
		class OG_STRIPE_SUBSCRIBE_UI{
			constructor(stripe, props){
				// Set your publishable key: remember to change this to your live publishable key in production
				// See your keys here: https://dashboard.stripe.com/account/apikeys
				this._stripe = stripe
				this._listeners = props.on
				this._elements = stripe.elements()
				this._card = null

				// Set up Stripe.js and Elements to use in checkout form
				this._ui = {
					style: {
						base: {
						  color: "#32325d",
						  fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
						  fontSmoothing: "antialiased",
						  fontSize: "16px",
						  "::placeholder": {
							color: "#aab7c4"
						  }
						},
						invalid: {
						  color: "#fa755a",
						  iconColor: "#fa755a"
						}
					}
				}
			}
			draw(){
				this._card = this._elements.create("card", { style: style })
				this._card.mount("#card-element")

				this._card.addEventListener('change', function(event) {
					let error = document.getElementById('card-errors')
					if (event.error) {
						error.textContent = event.error.message
					} else {
						error.textContent = ''
					}
				})
				////
				this._form = document.getElementById('subscription-form');

				this._form.addEventListener('submit', function(event) {
					// We don't want to let default form submission happen here,
					// which would refresh the page.
					event.preventDefault();

					this._stripe.createPaymentMethod({
						type: 'card',
						card: this._card,
						billing_details: {
							email: og.auth.user.email,
						},
					}).then((result, email) => {
						this._listeners.createPaymentMethod(result, email)
					})
				})
			}
		}
		class OG_STRIPE{
			constructor(){
				this._stripe = null
				this._subscribe_ui = null
				this._products = {
					subscription1: {
						plan: 'plan_FSDjyHWis0QVwl'
					}
				}
				this._modes = {
					subscription: {},
					connect: {
						oauthLink: (user) => {
							let url = 'https://connect.stripe.com/oauth/authorize'
							url += '?client_id=ca_GvyHFM8Es5OWh4ktQUr6JE2QrIbXPcbj'
							url += '&state=' + _STATE_VALUE
							url += '&scope=read_write'
							url += '&response_type=code'
							url += '&stripe_user[email]=' + user.email
							return url
						},
						oauth: {
							redirect_url: 'http://127.0.0.1:3000/fiddle/hib/og.html',
						},
					},
					checkout: {
						success_url: 'http://127.0.0.1:3000/fiddle/hib/og.html',
						cancel_url: 'http://127.0.0.1:3000/fiddle/hib/og.html',
					}
				}

				og.env.on({
					client: () => {
						this._stripe = Stripe('pk_test_604i4uQZodrrCwR5uTf2YYE500CAzUHqHF')
					},
					server: () => {
						this._stripe = require('stripe')('sk_test_OvMKuxbHtysUgf82cfL94cdT00zvjo4Ptp')
					},
				})
			}

			//CLIENT
			_createPaymentMethod(result, email){
				if(result.error){
					// Show error in payment form
					return
				}
				return this._post_create_paymentmethod({
					email: og.auth.user.email,
					payment_method: result.paymentMethod.id
				})
				.then((result) => {
					return result.json()
				})
				.then((customer) => {
					console.log('The customer has been created...')
					console.log(customer)
					console.log('.......')
      				// The customer has been created
				})
			}
			_connectCheckout(){
				this._post_checkout().then((session) => {
					this._stripe.redirectToCheckout({
						// Make the id field from the Checkout Session creation API response
						// available to this file, so you can provide it as parameter here
						// instead of the {{CHECKOUT_SESSION_ID}} placeholder.
						sessionId: session.id
					}).then(function (result) {
						// If `redirectToCheckout` fails due to a browser or network
						// error, display the localized error message to your customer
						// using `result.error.message`.
					});

				})
			}
			_post_create_paymentmethod(params){
				return og.http.post('create_stripe_paymentmethod', params)
			}
			_post_checkout(params){
				return og.http.post('stripe_connect_checkout', params)
			}

			//SERVER
			server__route(req, res, next){
				next()
			}
			server__connect(server){
				if(!og.env.server){
					return
				}

				this._server = server
				this._server.post('/create_stripe_paymentmethod', (data, req, res) => {
					return this._server_create_payment_method(data)
				})
				this._server.get('/stripe_connect_redirect', (data, req, res, auth) => {
					return this._server_stripe_connect_redirect(data, req, res, auth)
				})
				this._server.get('/stripe_connect_checkout', (data, req, res, auth) => {
					return this._server_stripe_connect_checkout(data, req, res, auth)
				})
			}

			_server_create_payment_method(data){
				this._server_create_customer(data).then((error, customer) => {
					return this._server_create_subscription(customer).then((error, subscription) => {
						return subscription
					})
				})
			}
			_server_create_customer(){
				return this._stripe.customers.create({
					payment_method: data.payment_method,
					email: data.email,
					invoice_settings: {
						default_payment_method: data.payment_method
					}
				})
			}
			_server_create_subscription(customer){
				return this._stripe.subscriptions.create({
					customer: customer.id,
					items: [this._products.subscription1],
					expand: ["latest_invoice.payment_intent"]
				})
			}
			////STRIPE CONNECT

			//REGISTRATION
			_server_stripe_connect_redirect(data, req, res, auth){
				const { code, state } = req.query
				if(state != _STATE_VALUE) {
					return res.status(403).json({ error: 'Incorrect state parameter: ' + state });
				}

				var error
				this._stripe.oauth.token({
					grant_type: 'authorization_code',
					code
				})
				.then(
					(response) => {
						let connected_account_id = response.stripe_user_id;
						let user = og.server.getModule('USER')
						user.update({user_id: auth.user.user_id, seller_account_id: connected_account_id}).then(() => {
							// Render some HTML or redirect to a different page.
							return res.status(200).json({success: true})
						})
					},
					(error) => {
						if (error.type === 'StripeInvalidGrantError') {
							return res.status(400).json({error: 'Invalid authorization code: ' + code});
						} else {
							return res.status(500).json({error: 'An unknown error occurred.'});
						}
					}
				)

				res.writeHead(302, {
					'Location': this._modes.connect.oauth.redirect_url
					//add other headers here...
				  })
				  res.end()
			}

			//CHECKOUT
			//data.line_items
			/*
			[{
				name: "Stainless Steel Water Bottle",
				amount: 1000,
				currency: 'usd',
				quantity: 1,
			}],
			*/

			_server_stripe_connect_checkout(data, req, res, auth){
				this._server_create_checkout_session(data, auth).then((session) => {
					return session
				})
			}

			_server_create_checkout_session(data, auth){
				let application_fee_amount = 1.00//@todo: calculate this

				return stripe.checkout.sessions.create({
					payment_method_types: ['card'],
					line_items: data.line_items,
					payment_intent_data: {
						application_fee_amount: application_fee_amount,
					},
					success_url: this._modes.checkout.success_url,
					cancel_url: this._modes.checkout.cancel_url,
				}, {
					stripeAccount: auth.user.seller_account_id,
				})
			}

			/**
			 * FULFILL CHECKOUT
			 * https://stripe.com/docs/connect/enable-payment-acceptance-guide/payments
				app.post('/webhook', bodyParser.raw({type: 'application/json'}), (request, response) => {
				const sig = request.headers['stripe-signature'];

				let event;

				// Verify webhook signature and extract the event.
				// See https://stripe.com/docs/webhooks/signatures for more information.
				try {
					event = stripe.webhooks.constructEvent(request.body, sig, webhook_secret);
				} catch (err) {
					return response.status(400).send(`Webhook Error: ${err.message}`);
				}

				if (event.type === 'checkout.session.completed') {
					const session = event.data.object;
					const connectedAccountId = event.account;
					handleCheckoutSession(connectedAccountId, session);
				}

				response.json({received: true});
				});

				const handleCheckoutSession = (connectedAccountId, session) => {
					// Fulfill the purchase.
				console.log('Connected account ID: ' + connectedAccountId);
				console.log('Session: ' + JSON.stringify(session));
				}

				Testing webhooks locally
				Testing webhooks locally is easy with the Stripe CLI.

				First, install the Stripe CLI on your machine if you haven’t already.

				Then, to log in run stripe login in the command line, and follow the instructions.

				Finally, to allow your local host to receive a simulated event on your connected account run stripe listen --forward-connect-to localhost:{PORT}/webhook in one terminal window, and run stripe trigger --stripe-account={{CONNECTED_STRIPE_ACCOUNT_ID}} checkout.session.completed (or trigger any other supported event) in another.
			 */

			get subscribe_ui(){
				if(this._subscribe_ui == null){
					this._subscribe_ui = new OG_STRIPE_SUBSCRIBE_UI(this._stripe, {
						on: {
							createPaymentMethod: (result, email) => {
								this._createPaymentMethod(result, email)
							}
						}
					})
				}
				return this._subscribe_ui
			}
			get modes(){
				return this._modes
			}

		}
		og.use(OG_STRIPE, 			{as: 'stripe', 			singleton: true})
		//og.use(OG_PAYPAL, 			{as: 'paypal', 			singleton: true})
		og.server.include(og.stripe, og.server.types.UTILITY)
	})
	if(typeof module != 'undefined' && module.exports){module.exports = function(og){__(og);return {}}} else{__(og)}
})()