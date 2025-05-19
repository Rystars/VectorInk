(function () {
	var __ = function (og) {
		class OG_POUCH_DB {
			constructor(name) {
				this._db = new PouchDB(name);
			}
			create(props) {
				return og.u.promise((promise) => {
					var docid = props._id || og.u.uniqueId();
					props._id = docid;
					this._db.put(props).then(() => {
						this._db.get(docid).then((doc) => {
							promise.resolve(doc);
						});
					});
				});
			}
			all() {
				return this._db.allDocs({
					include_docs: true,
				});
			}
			doc(name) {
				this._db
					.get(name)
					.then((doc) => {
						promise.resolve(doc);
					})
					.catch(() => {
						promise.resolve(null);
					});
			}
			delete(doc) {
				return this._db.remove(doc);
			}
			put(doc) {
				return og.u.promise((promise) => {
					doc._rev = doc._rev;
					this._db.put(doc).then(() => {
						this._db.get(doc._id).then((doc) => {
							promise.resolve(doc);
						});
					});
				});
			}
		}
		class OG_POUCH {
			constructor() {
				this._collections = {};
			}
			create(name) {
				this._collections[name] = new OG_POUCH_DB(name);
				return this._collections[name];
			}
			get modules() {
				return this._collections;
			}
		}
		og.use(OG_POUCH, { as: 'pouch', singleton: true });
	};

	if (typeof module != 'undefined' && module.exports) {
		module.exports = function (og) {
			__(og);
			return {};
		};
	} else {
		__(og);
	}
})();
