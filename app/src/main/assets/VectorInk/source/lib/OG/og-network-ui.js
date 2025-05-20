Vue.component('og-news-feed', {
	props: {
	},
	template: `
		<div class="og-news-feed">
			<template v-if="$og.auth.signedIn && $og.auth.user">
				<og-news-feed-input></og-news-feed-input>
				<og-news-feed-cards
					:model="$og.network.feeds.news"
				></og-news-feed-cards>
				<og-profile-cards
					:model="$og.network.suggestions"
					@follow="follow"
					class="og-f-scroll og-w-100"
				></og-profile-cards>

			</template>
		</div>
	`,
	beforeDestroy: function(){
		this.$og.network.disconnect()
	},
	mounted: function(){
		this.$og.network.connect()
	},
	data: function(){
		return {
		}
	},
	methods: {
		follow: function(user){
			this.$og.network.follow(user).then((result) => {
				console.log('post (follow) response -> ', result)
				this.$og.network.suggestions.refresh()
			})
		}
	}
})
Vue.component('og-news-feed-input', {
	props: {
	},
	template: `
		<div class="og-news-feed-input og-border-b-gray og-rel">
			<f7-list inline-labels no-hairlines>
				<f7-list-input
					type="textarea"
					resizable
					placeholder="Say Something..."
					@input="input"
				>
				</f7-list-input>
			</f7-list>
			<og-file-viewer :files="images"></og-file-viewer>
			<og-menu>
				<og-file-input @change="filesChanged">
					<og-icon icon="image" align="left" size="lg"></og-icon>
				</og-file-input>
				<og-button @click="post" text="Post" size="24" align="right"></og-button>
			</og-menu>
		</div>
	`,

	mounted: function(){

	},
	beforeDestroy: function(){
	},
	data: function(){
		return {
			message: '',
			images: []
		}
	},
	methods: {
		filesChanged: function(files){
			og.u.array_replace(this.images, files)
		},
		input: function(event){
			this.message = event.target.value
		},
		post: function(){
			let post = new og.post()
			post.message = this.message
			post.files = this.images
			post.share().then(() => {
				og.u.array_empty(this.images)
				this.message = ''
			})
			//let content = new og.content()
			//content.description =
		}
	}
})

Vue.component('og-news-feed-cards', {
	props: {
		model: Object//->OG_NET_FEED
	},
	template: `
		<div class="og-news-feed-cards">
			<template v-for="post in posts">
				<div :key="post.id">
					<og-news-feed-card :post="post"></og-news-feed-card>
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
			posts: this.model.posts
		}
	},
	methods: {
		follow: function(){

		}
	}
})

Vue.component('og-news-feed-card', {
	props: {
		post: Object
	},
	template: `
		<div class="og-profile-card">
			<f7-card class="demo-facebook-card">
				<f7-card-header class="no-border">
					<div>{{post.user.name}}</div>
				</f7-card-header>
				<f7-card-content :padding="false">
					<div>{{post.message}}</div>
					<div v-if="post.files">
						<og-file-viewer :files="post.files" mediaProp="content"></og-file-viewer>
					</div>
				</f7-card-content>
				<f7-card-footer class="no-border">

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

Vue.component('og-boardcast-feed', {
	props: {
		post: Object
	},
	template: `
		<div class="og-boardcast-feed">

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
