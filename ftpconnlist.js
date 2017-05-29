var jsonfile = require('jsonfile'),
	_ = require('underscore');
var uid = require('uid');

var FtpList = function (type) {
	if (type == 'ftpsync') {
		this.file = './ftpsync.json'
	} else {
		this.file = './ftplist.json'
	}
}
FtpList.prototype.add = function (obj, callback) {
	console.log('obj',obj)
	var file = this.file;
	jsonfile.readFile(file, function (err, ftplists) {
		if (err) callback(err)
		obj.id = uid(12);
		ftplists.push(obj);
		jsonfile.writeFile(file, ftplists, function (err) {
			if (err) callback(err)
			callback(null, obj);
		})

	})
}
FtpList.prototype.update = function (id, obj, callback) {
	var file = this.file;
	jsonfile.readFile(file, function (err, ftplists) {
		if (err) callback(err)

		var data = _.findWhere(ftplists, { id: id });
		ftplists = _.without(ftplists,data)
		ftplists.push(obj);
		jsonfile.writeFile(file, ftplists, function (err) {
			if (err) callback(err)
			callback(null, obj);
		})

	})
}
FtpList.prototype.get = function (id, callback) {
	var file = this.file;
	jsonfile.readFile(file, function (err, obj) {
		if (err) callback(err)
		else {
			var ftp = _.findWhere(obj, { "id": id })
			callback(null, ftp)
		}
	})
}
FtpList.prototype.getAll = function (callback) {
	var file = this.file;
	console.log("Calling to getAll");
	jsonfile.readFile(file, function (err, obj) {
		if (err) callback(err)
		else {
			callback(null, obj || []);
		}
	})
}
FtpList.prototype.remove = function (id, callback) {
	var file = this.file;
	jsonfile.readFile(file, function (err, ftplists) {
		if (err) callback(err)
		else {
			var obj = _.findWhere(ftplists, { id: id });
			console.log('obj', obj)
			ftplists = _.without(ftplists, obj)
			console.log('ftplist', ftplists);
			jsonfile.writeFile(file, ftplists, function (err) {
				if (err) callback(err)
				else callback(null, obj);
			})
		}
	})
}


module.exports = FtpList;