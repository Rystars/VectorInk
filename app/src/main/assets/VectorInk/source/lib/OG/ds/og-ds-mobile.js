
    function MOBILEFS() {
        this.write = function(path, data, callback) {
            var fs = new FileStorage();
            fs.write(path, data).then(function() {
                    callback({
                        error: false
                    });
                },
                function(error) {
                    callback({
                        error: true
                    });
                });
        }

        this.read = function(path, callback) {
            var fs = new FileStorage();
            fs.read(path).then(function(data) {
                    callback({
                        data: data,
                        error: false
                    });
                },
                function(error) {
                    callback({
                        error: true
                    });
                });
        }

        this.readDir = function(path, callback) {
            var fs = new FileStorage();
            fs.list(path).then(function(data) {
                    callback({
                        data: data,
                        error: false
                    });
                },
                function(error) {
                    callback({
                        error: true
                    });
                });
        }

        this.writeImage = function(name, image, callback) {
            var fs = new FileStorage();
            fs.write(name, image).then(function() {
                callback({
                    error: false
                });
            }, function(error) {
                callback({
                    error: true
                });
            });
        }

        this.readImage = function(name, callback) {
            var fs = new FileStorage();
            fs.read(name).then(function(blob) {
                $util.blobToBase64(blob, (base64) => {
                    callback({
                        data: base64,
                        error: false
                    });
                });
            }, function(error) {
                callback({
                    error: true
                });
            });
        }

        this.unlink = function(src, callback) {
            var fs = new FileStorage();
            fs.removeFile(src).then(function() {
                callback({
                    error: false
                });
            }, function(error) {
                callback({
                    error: true
                });
            });
        }
    }

/* modified from https://codingwithspike.wordpress.com/2014/12/29/using-deferreds-with-the-cordova-file-api/ */
/* requires rsvp.js */
/* tested and working in iOS and Android on latest Cordova (5.2.0) and File plugin (4.0.0) */
/* uses dataDirectory which is not synced to iCloud on iOS. You can replace each reference to syncedDataDirectory, but then you will need to set cordova.file.syncedDataDirectory = cordova.file.dataDirectory on Android to maintain compatibility */

window.fs_mobile = Class({
    write: function (name, data) {

      var name_arr = name.split('/');
      var name_index = 0;

      var promise = new RSVP.Promise(function(resolve, reject) {

        var fail = function(msg, error) {
          reject("Write failed on "+msg+", code: "+error.code);
        };

        var gotFileSystem = function(fileSystem) {

          if(name_arr.length > 1) {
            fileSystem.getDirectory(name_arr[name_index], {create:true}, gotDirectory, fail.bind(null, 'gotFileSystem - getDirectory'));
          }
          else {
            fileSystem.getFile(name, { create: true, exclusive: false }, gotFileEntry, fail.bind(null, 'gotFileSystem - getFile'));
          }
        };

        var gotDirectory = function(directory) {
          name_index++;
          if(name_index == (name_arr.length - 1)) {
            directory.getFile(name_arr[name_index], {create:true, exclusive:false}, gotFileEntry, fail.bind(null, 'gotDirectory - getDirectory'));
          }
          else {
            directory.getDirectory(name_arr[name_index], {create:true}, gotDirectory, fail.bind(null, 'gotDirectory - getFile'));
          }
        };

        var gotFileEntry = function(fileEntry) {
          fileEntry.createWriter(gotFileWriter, fail.bind(null, 'createWriter'));
        };

        var gotFileWriter = function(writer) {
          writer.onwrite = function() {
            resolve();
          };
          writer.onerror = fail.bind(null, 'gotFileWriter');
          writer.write(data);
        };

        window.resolveLocalFileSystemURL(cordova.file.dataDirectory, gotFileSystem, fail.bind(null, 'requestFileSystem'));
      });
      return promise;
    },

    read: function (name) {

      var promise = new RSVP.Promise(function(resolve, reject) {
        var fail = function (msg, error) {
          reject("Read failed on "+msg+", code: "+error.code);
        };

        var gotFileEntry = function (fileEntry) {
          fileEntry.file(gotFile, fail.bind(null, 'gotFileEntry'));
        };

        var gotFile = function(file) {
          var reader = new FileReader();
          reader.onloadend = function(evt) {
            var data = evt.target.result;
            resolve(data);
          };
          reader.onerror = fail.bind(null, 'gotFile');
          reader.readAsText(file);
        };
        //console.log('reading file...');
        //console.log(cordova.file.dataDirectory + name);
        //console.log('...');
        window.resolveLocalFileSystemURL(cordova.file.dataDirectory + name, gotFileEntry, fail.bind(null, 'resolveLocalFileSystemURL'));
      });
      return promise;
    },

    list: function(dir, fn){
      window.resolveLocalFileSystemURL(cordova.file.dataDirectory+dir,
        function (fileSystem) {
          var reader = fileSystem.createReader();
          reader.readEntries(
            function (entries) {
              console.log(entries);
              if(fn) fn(entries);
            },
            function (err) {
              console.log(err);
            }
          );
        }, function (err) {
          console.log(err);
        }
      );
    },

    removeFile: function (name) {

      var promise = new RSVP.Promise(function(resolve, reject) {

        var fail = function (msg, error) {
          reject("Remove file failed on "+msg+", code: "+error.code);
        };
        var gotFileEntry = function (fileEntry) {
          fileEntry.remove(function() {
            resolve();
          }, fail.bind(null, 'remove'));
        };
        window.resolveLocalFileSystemURL(cordova.file.dataDirectory + name, gotFileEntry, fail.bind(null, 'resolveLocalFileSystemURL'));
      });
      return promise;
    },

    removeDirectory: function(name) {

      var promise = new RSVP.Promise(function(resolve, reject) {

        var fail = function(msg, error) {
          reject("Remove directory failed on "+msg+", code: "+error.code);
        };

        var gotDirectory = function(directory) {
          directory.removeRecursively(function() {
            resolve();
          }, fail.bind(null, 'removeRecursively'));
        };
        window.resolveLocalFileSystemURL(cordova.file.dataDirectory + name, gotDirectory, fail.bind(null, 'resolveLocalFileSystemURL'));

      });
      return promise;

    }
  });
