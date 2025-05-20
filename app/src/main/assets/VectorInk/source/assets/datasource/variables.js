(function() {
	var ds = new DataSource();
	if (typeof window.cordova != 'undefined') {
		/****/
		ds.$('app_dir', '');
		ds.$('datasource_url', 'local/');
		ds.$('resource_dir', 'source/assets/content/resource');
		ds.$('font_dir', ds.$('resource_dir') + '/fonts');
		ds.$('asset_data_url', 'source/assets/datasource');
		ds.$('external_data_url', 'https://vlmdata.sfo3.digitaloceanspaces.com');
		ds.$('icon_remote_url', ds.$('external_data_url') + '/icons/resource.json');
		/****/
	} else {
		/****/
		ds.$('app_dir', 'app');
		ds.$('datasource_url', 'datasource/local/');
		ds.$('resource_dir', 'source/assets/content/resource');
		ds.$('font_dir', ds.$('resource_dir') + '/fonts');
		ds.$('asset_data_url', 'source/assets/datasource');
		ds.$('external_data_url', 'source/assets/datasource');
		ds.$('icon_remote_url', ds.$('external_data_url') + '/remote_icons/resource.json');
		// ds.$('external_data_url', 'http://vlmdata.sfo3.digitaloceanspaces.com');
		// ds.$('external_data_url', 'https://vlmdata.sfo3.digitaloceanspaces.com');
		/****/
	}
	ds.$('color_resource_url', 'source/assets/content/colors.json');
	ds.$('icon_resource_url', ds.$('asset_data_url') + '/icons/resource.json');
	ds.$('icon_datasource_url', ds.$('asset_data_url') + '/icons/data');
	ds.$('font_resource_url', ds.$('asset_data_url') + '/fonts/resource.json');
	ds.$('background_resource_url', ds.$('asset_data_url') + '/backgrounds/resource.json');
	ds.$('nonVectorFonts', {});
	ds.$('event_vector_maker_zoomstart', 'event_vector_maker_zoomstart');
	ds.$('event_vector_maker_zoom', 'event_vector_maker_zoom');
	ds.$('event_vector_maker_zoomend', 'event_vector_maker_zoomend');

	ds.$('settings', {
		data_url: ds.$('datasource_url') + 'settings',
	});
	ds.$('projects', {
		data_url: ds.$('datasource_url'),// + 'projects/data',
		image_url: ds.$('datasource_url'),// + 'projects/images', //saved-images for mobile
		local_image_url: ds.$('datasource_url'),// + 'projects/images',
	});
	ds.$('templates', {
		resource_url: ds.$('asset_data_url') + '/templates/resource.json',
		data_url: ds.$('asset_data_url') + '/templates/data',
		image_url: ds.$('asset_data_url') + '/templates/images', //saved-images for mobile
		local_image_url: '/' + ds.$('asset_data_url') + '/templates/images',
	});
	ds.$('premium_templates', {
		resource_url: ds.$('external_data_url') + '/premium-templates/resource.json',
		data_url: ds.$('external_data_url') + '/premium-templates/data',
		image_url: ds.$('external_data_url') + '/premium-templates/images', //saved-images for mobile
		local_image_url: ds.$('external_data_url') + '/premium-templates/images',
	});
	ds.$('backgrounds', {
		resource_url: ds.$('asset_data_url') + '/backgrounds/resource.json',
		image_url: ds.$('asset_data_url') + '/backgrounds/images', //saved-images for mobile
		local_image_url: '/' + ds.$('asset_data_url') + '/backgrounds/images',
	});
})();
