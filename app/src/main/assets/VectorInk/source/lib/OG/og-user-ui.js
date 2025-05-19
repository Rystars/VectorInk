Vue.component('og-profile-cards', {
	props: {
		model: Object//->OG_NET_USERS
	},
	template: `
		<div class="og-profile-cards">
			<template v-for="user in users">
				<div :key="user.user_id">
					<og-profile-card :user="user" @follow="$emit('follow', user)"></og-profile-card>
				</div>
			</template>
		</div>
	`,

	mounted: function(){

	},
	beforeDestroy: function(){
	},
	data: function(){
		return {
			users: this.model.users
		}
	},
	methods: {
		follow: function(){

		}
	}
})

Vue.component('og-profile-card', {
	props: {
		user: Object
	},
	template: `
		<div class="og-profile-card">
			<f7-card class="demo-facebook-card">
			<f7-card-header class="no-border">
				<div>{{user.user_id}}</div>
			</f7-card-header>
			<f7-card-content :padding="false">
				<div>{{user.name}}</div>
				<div>{{user.email}}</div>
			</f7-card-content>
			<f7-card-footer class="no-border">
				<f7-link @click="$emit('follow')">Follow</f7-link>
			</f7-card-footer>
			</f7-card>
		</div>
	`,

	mounted: function(){

	},
	beforeDestroy: function(){
	},
	data: function(){
		return {
		}
	},
	methods: {
	}
})

