
    function NJSFS() {
        this.mkdir = function(dir, fn) {
            var fs = require('fs');
            fs.mkdir(dir, {
                recursive: true
            }, (err) => {
                if (err) fn({
                    error: true
                });
                else fn({
                    error: false
                });
            });
        }

        this.copy = function(from, to, fn) {
            var fs = require('fs');
            fs.copyFile(from, to, (err) => {
                if (err) fn({
                    error: true
                });
                else fn({
                    error: false
                });
            });
        }

        this.read = function(f, fn) {
            var fs = require('fs');
            var fileName = f;
            fs.readFile(fileName, 'utf8', function(err, data) {
                if(err){
                    fn({
                        error: true,
                        detail: err
                    });
                }
                else{
                    fn({
                        data: data,
                        error: false
                    });
                }
            });
        };

        this.readImage = function(f, fn) {
            var fs = require('fs');
            var fileName = f;
            fs.readFile(fileName, function(err, data) {
                fn({
                    data: data,
                    error: false
                });
            });
        };

        this.rename = function(oldPath, newPath, fn) {
            var fs = require('fs');
            fs.rename(oldPath, newPath, function(err) {
                if (err) {
                    fn({
                        error: true
                    });
                } else {
                    fn({
                        error: false
                    });
                }
            });
        };

        this.write = function(f, x, fn) {
            var fs = require('fs');
            var fileName = f;
            var data = x;
            fs.writeFile(fileName, data, function(err) {
                if (err) {
                    fn({
                        error: true
                    });
                } else {
                    fn({
                        error: false
                    });
                }
            });
        };

        this.writeImage = function(f, x, fn) {
            var fs = require('fs');
            var fileName = f;
            var data = x;
            fs.writeFile(fileName, data, function(err) {
                if (err) {
                    fn({
                        error: true
                    });
                } else {
                    fn({
                        error: false
                    });
                }
            });
        };

        this.readdir = function(dir, fn) {
            var fs = require('fs');
            fs.readdir(dir, function(err, files) {
                if (err) {
                    fn({
                        error: true
                    });
                } else {
                    fn({
                        error: false,
                        data: files
                    });
                }
            });
        };

        this.unlink = function(path, fn) {
            var fs = require('fs');
            fs.unlink(path, function(err) {
                if (err) {
                    fn({
                        error: true
                    });
                } else {
                    fn({
                        error: false
                    });
                }
            });
        };
    }
