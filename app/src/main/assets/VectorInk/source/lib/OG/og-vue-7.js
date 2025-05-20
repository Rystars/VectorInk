(function () {
	Vue.component('og-button', {
		props: {
			text: {
				type: String,
				default: '',
			},
			size: {
				type: String,
				default: '40',
			},
			align: {
				type: String,
				default: 'auto',
			},
		},
		template: `
			<f7-button
				raised fill round
				:class="['w-' + size, 'og-align-' + align]"
				@click="$emit('click')"
			>{{text}}</f7-button>
		`,
		data: function () {
			return {};
		},
		methods: {},
	});
	Vue.component('og-icon', {
		props: {
			icon: {
				type: String,
				default: 'grin',
			},
			align: {
				type: String,
				default: 'auto',
			},
			size: {
				type: String,
				default: 'md',
			},
		},
		template: `
			<f7-link
				:icon-only="true"
				:icon="'fas fa-' + icon"
				:class="['og-icon', 'og-font-' + size, 'og-align-' + align]"
				@click="$emit('click')"
			></f7-link>
		`,
		data: function () {
			return {};
		},
		methods: {},
	});
	Vue.component('og-input', {
		props: {
			field: og.form_field,
		},
		template: `
			<div class="og-input">
				<label>{{field.label}}</label>
				<input
					:type="field.type"
					:value="value"
					@keyup="keyup"
				/>
			</div>
		`,
		mounted: function () {
			this.field.on('change', () => {
				this.value = this.field.value;
			});
		},
		data: function () {
			return {
				value: this.field.value,
			};
		},
		methods: {
			keyup: function (event) {
				this.field.value = event.target.value;
			},
		},
	});
	Vue.component('og-form', {
		props: {
			form: og.form,
		},
		template: `
			<div class="og-form og-f-center">
				<form action="." @submit="submit" class="w-1/2">
					<div v-for="field in form.fields" :key="field.id">
						<og-input :field="field"></og-input>
					</div>
					<slot></slot>
				</form>
			</div>
		`,
		methods: {
			submit: function (event) {
				event.preventDefault();
				this.$emit('submit');
				return false;
			},
		},
	});
	Vue.component('og-signup', {
		template: `
			<f7-login-screen class="og-signup" :opened="$og.app.signup.active" @loginscreen:opened="$og.app.signup.activate()" @loginscreen:closed="$og.app.signup.deactivate()">
				<f7-page login-screen>
					<f7-link class="close-button top-right" :icon-only="true" icon="fa fa-times" login-screen-close></f7-link>
					<div class="mt-48">
						<f7-login-screen-title>Sign Up</f7-login-screen-title>
						<og-form :form="$og.app.signup.form" @submit="signup">
							<f7-button type="submit">Sign Up</f7-button>
						</og-form>
					</div>
				</f7-page>
			</f7-login-screen>
		`,
		methods: {
			signup: function () {
				this.$og.auth.signUp(this.$og.app.signup.form.json).then((response) => {
					this.$og.app.signup.form.clear();
					this.$f7.loginScreen.close();
				});
			},
		},
	});
	Vue.component('og-signin', {
		template: `
			<f7-login-screen class="og-signin" :opened="$og.app.signin.active"  @loginscreen:opened="$og.app.signin.activate()" @loginscreen:closed="$og.app.signin.deactivate()">
				<f7-page login-screen>
					<f7-link class="close-button top-right" :icon-only="true" icon="fa fa-times" login-screen-close></f7-link>
					<div class="mt-48">
						<f7-login-screen-title>Sign In</f7-login-screen-title>
						<og-form :form="$og.app.signin.form" @submit="signin">
							<f7-button type="submit">Sign In</f7-button>
						</og-form>
					</div>
				</f7-page>
			</f7-login-screen>
		`,
		methods: {
			signin: function () {
				this.$og.auth.signIn(this.$og.app.signin.form.json).then((response) => {
					this.$og.app.signin.form.clear();
					this.$f7.loginScreen.close();
				});
			},
		},
	});
	Vue.component('og-popup', {
		props: {
			title: {
				type: String,
				default: '',
			},
			close: {
				type: Boolean,
				default: true,
			},
			model: {
				type: og.app.component,
				default: null,
			},
		},
		template: `
			<f7-popup :opened="is_open" @popup:opened="on_opened" @popup:closed="on_closed">
				<f7-page>
					<f7-navbar :title="title" innerClass="navbar-inner-centered-title">
					<f7-nav-right>
						<f7-link v-if="close" popup-close><i class="fas fa-times"></i></f7-link>
					</f7-nav-right>
					</f7-navbar>
					<div slot="default" class="h-full">
						<slot></slot>
					</div>
				</f7-page>
			</f7-popup>
		`,
		computed: {
			is_open: function () {
				return this.model ? this.model.active : this.opened;
			},
		},
		data: function () {
			return {
				state: {
					opened: false,
				},
			};
		},
		methods: {
			on_opened: function () {
				if (this.model) {
					this.model.activate();
				}
				this.opened = true;
			},
			on_closed: function () {
				if (this.model) {
					this.model.deactivate();
				}
				this.opened = false;
			},
		},
	});
	Vue.component('og-card', {
		props: {
			title: {
				type: String,
				default: '',
			},
			content: {
				type: String,
				default: '',
			},
		},
		template: `
			<f7-card class="og-card">
				<slot name="header">
					<f7-card-header class="no-border" valign="bottom">
						<span v-if="title">{{title}}</span>
					</f7-card-header>
				</slot>

				<f7-card-content class="og-f-center overflow-hidden">
					<div v-if="content.length" v-html="content"></div>
					<slot name="body"></slot>
				</f7-card-content>

				<f7-card-footer>
					<slot name="footer"></slot>
				</f7-card-footer>
			</f7-card>
		`,
		data: function () {
			return {
				state: {
					opened: false,
				},
			};
		},
		methods: {},
	});
	Vue.component('og-media-card', {
		props: {
			content: {
				type: String,
				default: '',
			},
		},
		template: `
			<f7-card class="og-media-card">
				<f7-card-content class="og-f-center overflow-hidden">
					<div class="content" v-if="content.length" v-html="content"></div>
					<div class="cover" @click="$emit('select')"></div>
					<slot></slot>
				</f7-card-content>
				<f7-card-footer>
					<vx-dropdown
						v-model="state.opened"
						:right="false"
						:above="false"
						:hover="false"
						:interactive="true"
						class="w-12 h-12 vx-flex-center"
					>
						<a href="javascript: void(0);" class="dropdown-toggle w-full h-full flex justify-center items-center color-gray-400">
							<i class="fa fa-ellipsis-v"></i>
						</a>

						<div slot="dropdown">
							<f7-link class="dropdown-item w-48 flex justify-between items-center" @click="$emit('edit')" icon="fal fa-pencil">
								<span class="mx-4">Edit</span>
							</f7-link>
							<f7-link class="dropdown-item w-48 flex justify-between items-center" @click="$emit('delete')" icon="fal fa-trash">
								<span class="mx-4">Delete</span>
							</f7-link>
						</div>
					</vx-dropdown>
				</f7-card-footer>
			</f7-card>
		`,
		data: function () {
			return {
				state: {
					opened: false,
				},
			};
		},
		methods: {},
	});
	Vue.component('og-navbar', {
		props: {
			title: {
				type: String,
				default: '',
			},
			back: {
				type: [String, Object],
				default: null,
			},
			signup: {
				type: Boolean,
				default: false,
			},
			signin: {
				type: Boolean,
				default: false,
			},
		},
		template: `
			<f7-navbar :back-link="back">
				<f7-nav-left>
					<template>
						<slot name="left"></slot>
					</template>
				</f7-nav-left>
				<f7-nav-title>{{title}}</f7-nav-title>
				<f7-nav-right>
					<template v-if="!state.auth.signedIn">
						<slot name="right"></slot>
						<f7-link v-if="signup" login-screen-open=".og-signup">Sign Up</f7-link>
						<f7-link v-if="signin" login-screen-open=".og-signin">Sign In</f7-link>
					</template>
					<template v-if="state.auth.signedIn">
						<slot name="right"></slot>
						<!--<f7-link @click="signOut">Sign Out</f7-link>-->
					</template>
				</f7-nav-right>
			</f7-navbar>
		`,
		data: function () {
			return {
				state: {
					auth: this.$og.auth.state,
				},
			};
		},
		mounted: function () {},
		updated: function () {},
		methods: {
			signOut: function () {
				this.$og.auth.signOut();
			},
			beforein: function (event) {},
			afterin: function () {},
		},
	});
	Vue.component('og-page', {
		props: {
			name: {
				type: String,
				default: 'home-page',
			},
		},
		template: `
			<f7-page :name="name" @page:beforein="beforein" @page:afterin="afterin">
				<div slot="default">
					<slot></slot>
				</div>
			</f7-page>
		`,
		data: function () {
			return {};
		},
		mounted: function () {},
		updated: function () {},
		methods: {
			beforein: function (event) {},
			afterin: function () {},
		},
	});
})();
