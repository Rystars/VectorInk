(function(){
	class JSQL_RESOURCE_ITEM{
		constructor(props){
            var _ = require('underscore')
			props = _.defaults(props, {
				id: Math.random().toString(36).substr(2, 9),
				dir: '',
				name: '',
				filename: '',
				ext: '',
				classname: '',
				category: '',
				path: '',
			});

			this.id = props.id
			this.name = props.name
			this.filename = props.filename
			this.ext = props.ext
			this.classname = props.classname
			this.category = props.category
			this.dir = props.dir
			this.path = props.path
			this.sequence = 0
			this.title = ''


			this.content = ''
			this.blob = null
			this.remove = false

			this.rename = {
				active: false,
				filename: '',
			}


			if(this.filename.length && !this.ext.length){
				this.ext = this.filename.split('.').pop().toLowerCase()
			}
            
            this.title = this.filename.split('.').slice(0, -1).join('.')
            this.classname = this.title.toLowerCase().split(' ').join('-')
            this.name = this.classname + '.' + this.ext
            this.path = this.dir + '/' + this.name
		}

		rename(n){
			this.rename.filename = n + '.' + this.ext
			this.rename.active = true
		}

		get json(){
			var filename = this.filename
			if(this.rename.active){
				filename = this.rename.filename
			}
			return {
				id: this.id,
				title: this.title,
				name: this.name,
				ext: this.ext,
				filename: filename,
				classname: this.classname,
				category: this.category,
				path: this.path,
				newPath: this.newPath,
				sequence: this.sequence,
			}
		}
	}

	class JSQL_RESOURCE{
		constructor(){

		}
        
        load(jsql, dir, props){
            this._ = require('underscore')
			this.jsql = jsql
			this.util = this.jsql.util
			this.fs = this.jsql.util.fs
            
            
            props = this._.defaults(props, {path: dir})
            this.loadResource(dir, props).then((resources) => {
                resources.forEach((resource) => {
                    console.log(resource)
                })
                this.storeResource(dir, resources, props)
            })
        }
        
        storeResource(dir, resources, props){
            return new Promise((resolve, reject) => {
                this.util.each(resources, (resource, next) => {
                    console.log('rename', dir + '/' + resource.filename, ' > ', dir + '/' + resource.name)
                    next()
                    this.fs.read(dir + '/' + resource.filename).then((contents) => {
                        this.fs.rename(dir + '/' + resource.filename, dir + '/' + resource.name).then(() => {
                            this.jsql.table.resource.findAll({where: {name: resource.name}}).then((data) => {
                                if(data.length){
                                    next()
                                }
                                else{
                                    this.jsql.table.resource.create({
                                        name: resource.name,
                                        title: resource.title,
                                        ext: resource.ext,
                                        path: resource.path,
                                        file_name: resource.name,
                                        content: props.contents ? contents : '',
                                        type: props.type,
                                    }).then((model) => {
                                        next()
                                    }).catch((error) => {
                                        console.log('save error', error)
                                        reject()
                                    })
                                }
                            })
                        }).catch((error) => {
                            console.log('rename error', error)
                            reject()                        
                        })
                    }).catch((error) => {
                        console.log('rename error', error)
                        reject()                        
                    })
                    
                }).then(() => {
                    resolve()
                })
            })
        }

		loadResource(dir, props){
            return new Promise((resolve, reject) => {
                var resources = []
                this.fs.readdir(dir).then((files) => {
                    files.forEach((file) => {
                        if(file.match(/ds_store/ig)){
                            return
                        }
                        var resource = new JSQL_RESOURCE_ITEM({dir: props.path, filename: file})
                        resources.push(resource)
                    })
                    resolve(resources)
                })
            })
		}
	}
	if (typeof module != 'undefined' && module.exports) {
		module.exports = new JSQL_RESOURCE()
	} else {
		window.JSQL_RESOURCE = JSQL_RESOURCE
	}
})()