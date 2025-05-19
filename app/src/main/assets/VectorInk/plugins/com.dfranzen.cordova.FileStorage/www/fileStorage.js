cordova.define("com.dfranzen.cordova.FileStorage.FileStorage", function(require, exports, module) { 
module.exports = {
    open: function (success, failure, type) {
        window.cordova.exec(success, failure, "FileStorage", "open", [type]);
    },
    readFromUri: function (success, failure, uri) {
        window.cordova.exec(success, failure, "FileStorage", "read_from_uri", [uri]);
    },
    writeToUri: function (success, failure, uri, data) {
        window.cordova.exec(success, failure, "FileStorage", "write_to_uri", [uri, data]);
    },
    appendToUri: function (success, failure, uri, data) {
        window.cordova.exec(success, failure, "FileStorage", "append_to_uri", [uri, data]);
    }
};
});