class BlackStripeUI{
    constructor(Stripe){
        this.Stripe = Stripe
        this.Elements = this.Stripe.elements()
        this.card = null
        this.form = null
        this.style = {
            base: {
                color: '#32325d',
                fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
                fontSmoothing: 'antialiased',
                fontSize: '16px',
                '::placeholder': {
                    color: '#aab7c4'
                }
            },
            invalid: {
                color: '#fa755a',
                iconColor: '#fa755a'
            }
        }
        this.listeners = {
            onSubmit: () => {}
        }
    }
    
    onSubmit(listener){
        this.listeners.onSubmit = listener
    }
    
    draw(){
        this.form = $('#fs-form')
        this.card = this.Elements.create('card', {style: this.style});
        this.card.mount('#fs-card');
        this.registerUiEvents()
    }
    registerUiEvents(){
        this.card.addEventListener('change', (event) => {
          var displayError = document.getElementById('fs-errors');
          if (event.error) {
            displayError.textContent = event.error.message;
          } else {
            displayError.textContent = '';
          }
        });
        
        this.form.on('submit', () => {
            this.listeners.onSubmit()
            return false
        })
    }
}
class BlackStripeQuery{
    constructor(BlackStripe){
        this.BlackStripe = BlackStripe
        this.endpoints = {
            get_customer: {
                url: '/get-customer'
            },
            get_subscription: {
                url: '/get-subscription'
            },
        }
    }
    
    init(app){
        //get_customer > customer_server(id)
        app.post(this.endpoints.get_customer.url, (req, res) => {
            this.customer_server(req.body.id).then((customer) => {
                res.status(200).json(customer)                
            })
        })
        app.post(this.endpoints.get_subscription.url, (req, res) => {
            var id = ''
            var customer = null
            if(req.body.hasOwnProperty('customer')){
                customer = req.body.customer
                customer.subscriptions.data.forEach((subscription) => {
                    if(subscription.status == 'active'){
                        id = subscription.id
                    }
                })
            }
            else{
                id = req.body.id
            }
            
            if(id){
                this.subscription_server(id).then((customer) => {
                    res.status(200).json(customer)
                })
            }
            else{
                res.status(200).json({error: true, msg: 'invalid subscription id'})
            }
        })
    }

    customer(id){
        return new Promise((resolve, reject) => {
           this.fetch('get_customer', {id: id}).then((customer) => {
               console.log(customer)
               resolve(customer)
           })
        })
    }
    customer_server(id){
        return new Promise((resolve, reject) => {
            this.BlackStripe.Stripe.customers.retrieve(id, (err, customer) => {
                resolve(customer)
            })
        })
    }
    subscription(data){
        var props = {}
        if(typeof data == 'object'){
            props.customer = data
        }
        else{
            props.id = data
        }
        
        return new Promise((resolve, reject) => {
           this.fetch('get_subscription', props).then((subscription) => {
               //console.log(subscription)
               resolve(subscription)
           })
        })
    }
    subscription_server(id){
        return new Promise((resolve, reject) => {
            this.BlackStripe.Stripe.subscriptions.retrieve(id, (err, subscription) => {
                resolve(subscription)
            })
        })
    }
    
    fetch(endpoint, body){
        body = body || {}
        return fetch(this.endpoints[endpoint].url, {
          method: 'post',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(body)
        }).then(response => {
          return response.json();
        })
    }
}
class BlackStripe{
    constructor(key, product){
        this.njs = typeof module !== 'undefined' && module.exports        
        this._product = null
        this._Stripe = null
        this.BlackStripeUI = null
        this.query = new BlackStripeQuery(this)
        this.user = {
            email: 'test-user-b@test-mail.com'
        }
        this.endpoints = {
            create_customer: {
                url: '/create-customer'
            },
            create_subscription: {
                url: '/create-subscription'
            },
        }
        
        if(key){
            this.key = key
        }
        if(product){
            this.product = product
        }
    }
    
    authenticate(customerId){
        return new Promise((resolve, reject) => {
            this.query.customer(customerId).then((customer) => {
                var result = null
                if(customer){
                    customer.subscriptions.data.forEach((subscription) => {
                        if(subscription.status == 'active' && subscription.plan.id == this._product){
                            result = subscription
                        }
                    })
                }
                resolve(result)
            })            
        })
    }
    
    init(app){
        app.post(this.endpoints.create_customer.url, (req, res) => {
            this.server_createCustomer(req.body).then((customer) => {
                this.server_createSubscription(customer).then((subscription) => {
                    res.status(200).json(subscription);                
                })    
            })
        })
        this.query.init(app)
    }
    
    render(){
        this.BlackStripeUI.onSubmit(() => {
            this.client_createPaymentMethod().then((result) => {
                this.client_createCustomer(result.paymentMethod).then((subscription) => {
                    console.log(subscription)
                })
            })
        })
        this.BlackStripeUI.draw()
    }
   
    client_createPaymentMethod(){
        return new Promise((resolve, reject) => {
            this.Stripe.createPaymentMethod('card', this.BlackStripeUI.card, {
              billing_details: {
                email: this.user.email,
              },
            }).then(function(result) {
                resolve(result)
            })  
        })
    }
    
    client_createCustomer(paymentMethod){
        return fetch(this.endpoints.create_customer.url, {
          method: 'post',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            email: this.user.email,
            payment_method: paymentMethod.id
          })
        }).then(response => {
          return response.json();
        })
    }
    
    server_createCustomer(req){
        return new Promise((resolve, reject) => {
            this.Stripe.customers.create({
              payment_method: req.payment_method,
              email: req.email,
              invoice_settings: {
                default_payment_method: req.payment_method
              }
            }, (err, customer) => {
                resolve(customer)
            })
        })
    }
    
    server_createSubscription(customer){
        return new Promise((resolve, reject) => {
            this.Stripe.subscriptions.create({
              customer: customer.id,
              items: [{ plan: this._product }],
              expand: ["latest_invoice.payment_intent"]
            }, (err, subscription) => {
                resolve(subscription)
            });            
        })
    }
    
    get product(){
        return this._product
    }
    get key(){
        return this._key
    }
    set product(v){
        this._product = v
    }
    set key(v){
        this._key = v
        if(this.njs){
            this.Stripe = require('stripe')(this._key)
        }
        else{
            this.Stripe = Stripe(this.key)
            this.BlackStripeUI = new BlackStripeUI(this.Stripe)
        }
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = new BlackStripe()
}
else{
    window.BlackStripe = BlackStripe
}

/************************************************************************************************************
tokenizing
// Handle form submission.
var form = document.getElementById('fs-form');
form.addEventListener('submit', (event) => {
  event.preventDefault();
  this.Stripe.createToken(this.card).then((result) => {
    if (result.error) {
      // Inform the user if there was an error.
      var errorElement = document.getElementById('card-errors');
      errorElement.textContent = result.error.message;
    } else {
      // Send the token to your server.
      tokenHandler(result.token);
    }
  });
});

// Submit the form with the token ID.
function tokenHandler(token) {
  // Insert the token ID into the form so it gets submitted to the server
  var form = document.getElementById('fs-form');
  var hiddenInput = document.createElement('input');
  hiddenInput.setAttribute('type', 'hidden');
  hiddenInput.setAttribute('name', 'stripeToken');
  hiddenInput.setAttribute('value', token.id);
  form.appendChild(hiddenInput);

  // Submit the form
  form.submit();
}
*/