Vue.component('og-paypal-subscribe-button', {
	props: {
		model: Object,
		product: Object,
	},
	template: `
		<div class="og-paypal-subscribe-form">
			<div id="paypal-button-container"></div>
		</div>
	`,
	mounted: function(){
		paypal.Buttons({

			createSubscription: function(data, actions) {
		  
			  return actions.subscription.create({
		  
				'plan_id': 'P-2UF78835G6983425GLSM44MA'
		  
			  });
		  
			},
		  
		  
			onApprove: function(data, actions) {
		  
			  alert('You have successfully created subscription ' + data.subscriptionID);
		  
			}
		  
		  
		  }).render('#paypal-button-container');
	},
	data: function(){
		return {
		}
	},
	methods: {
	}
})


Vue.component('og-stripe-subscribe-form', {
	props: {
	},
	template: `
		<div class="og-stripe-subscribe-form">
			<form id="subscription-form">
				<div id="card-element" class="MyCardElement">
					<!-- Elements will create input elements here -->
				</div>

				<!-- We'll put the error messages in this element -->
				<div id="card-errors" role="alert"></div>
				<button type="submit">Subscribe</button>
			<form>
		</div>
	`,
	mounted: function(){
	},
	data: function(){
		return {
		}
	},
	methods: {
	}
})

Vue.component('og-stripe-connect-button', {
	props: {
	},
	template: `
		<f7-link :href="url" target="_blank">Connect With Stripe</f7-link>
	`,
	mounted: function(){
	},
	data: function(){
		return {
			url: this.$og.stripe.modes.connect.oauthLink(this.$og.auth.user)
		}
	},
	methods: {
	}
})

/*
// Initialize Stripe.js with the same connected account ID used when creating
// the Checkout Session.
var stripe = Stripe('pk_test_604i4uQZodrrCwR5uTf2YYE500CAzUHqHF', {
  stripeAccount: '{{CONNECTED_STRIPE_ACCOUNT_ID}}'
});

stripe.redirectToCheckout({
  // Make the id field from the Checkout Session creation API response
  // available to this file, so you can provide it as parameter here
  // instead of the {{CHECKOUT_SESSION_ID}} placeholder.
  sessionId: '{{CHECKOUT_SESSION_ID}}'
}).then(function (result) {
  // If `redirectToCheckout` fails due to a browser or network
  // error, display the localized error message to your customer
  // using `result.error.message`.
});
*/