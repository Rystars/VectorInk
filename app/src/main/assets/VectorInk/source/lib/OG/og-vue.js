(function () {
	Vue.component('og-file-viewer', {
		props: {
			files: {
				type: [Array, Object],
				default: [],
			},
			mediaProp: {
				type: [String, Object],
				default: null,
			},
		},
		template: `
			<div class="og-file-viewer">
				<div class="og-f-scroll">
					<template v-if="mediaProp">
						<div v-for="file in files" class="og-thumbnail md">
							<img :src="file[mediaProp]" />
						</div>
					</template>
					<template v-else>
						<div v-for="file in files" class="og-thumbnail md">
							<img :src="file" />
						</div>
					</template>
				</div>
			</div>
		`,
		data: function () {
			return {};
		},
		methods: {},
	});
	Vue.component('og-file-input', {
		props: {},
		template: `
			<div class="og-file-input">
				<slot></slot>
				<form action="." method="post" enctype="multipart/form-data">
					<input type="file" @change="capture" multiple />
				</form>
			</div>
		`,
		data: function () {
			return {
				files: [],
			};
		},
		methods: {
			capture: function (event) {
				og.u.array_empty(this.files);
				og.u
					.process(event.target.files, (file, next) => {
						if (file instanceof Blob) {
							og.u.file_to_base64(file).then((dataUrl) => {
								og.u.array_push(this.files, dataUrl);
								next();
							});
						} else {
							next();
						}
					})
					.then(() => {
						this.$emit('change', this.files);
					});
			},
		},
	});
	Vue.component('og-menu', {
		props: {},
		template: `
			<div class="og-menu og-pad-x">
				<slot></slot>
			</div>
		`,
	});
	Vue.component('og-panel', {
		props: {},
		template: `
			<div class="og-panel">
				What up OG
			</div>
		`,

		mounted: function () {},
		beforeDestroy: function () {},
		data: function () {
			return {};
		},
		methods: {},
	});
})();
