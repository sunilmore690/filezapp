var Jsftp = require("jsftp");
// Jsftp = require('jsftp-rmr')(Jsftp);
var helpers = {
  // synchronizes the local and remote clocks
  syncTime: function(ltime, rtime) {
    // get the current date/time
    var now = new Date();
    // calculate the local time offset
    var ltimeOffset = (now.getTimezoneOffset() / 60);
    // round to the nearest hour
    var coeff = 1000 * 60 * 60;
    // greenwich mean time
    var gmtimeMM = new Date((Math.round(ltime / coeff) - ltimeOffset) * coeff);
    // local time
    var ltimeMM = new Date(Math.round(ltime / coeff) * coeff);
    // remote time
    var rtimeMM = new Date(Math.round(rtime / coeff) * coeff);
    // calculate the remote time offset
    var rtimeOffset = (rtimeMM - ltimeMM) / coeff;
  },

  // maps a file lookup table from an array of file objects
  lookupTable: function(array) {
    //if (!array) { return []; }
    var lookup = [];
    for (var i = 0, len = array.length; i < len; i++) {
      lookup[i] = array[i].id;
    }
    return lookup;
  },

  // trims the base dir of from the file path
  trimPathRoot: function(root, path) {
    return  path;
    // var rdirs = root.split('/');
    // var fdirs = path.split('/');
    // return '/' + fdirs.splice((rdirs.length), (fdirs.length-rdirs.length)).join('/');
  },

  // compare local vs remote file sizes
  isDifferent: function(lfile, rfile) {
    return (lfile.size !== rfile.size);
  },

  // compare a local vs remote file for modification
  isModified: function(lfile, rfile) {
    // round to the nearest minute
    var minutes = 1000 * 60;
    var hours = 1000 * 60 * 60;
    var ltime = lfile.time;
    var rtime = rfile.time;
    ltime = new Date((Math.round(ltime.getTime() / minutes) * minutes));
    rtime = new Date((Math.round(rtime.getTime() / minutes) * minutes));
    return (ltime !== rtime);
  },

  isIgnored: function(path) {
    return false;
    // skip if no ignores are defined
    // if (settings.ignore.length === 0) { return false; }
    // // should the path be ignored?
    // for(var i = 0, len = settings.ignore.length; i < len; i++) {
    //   if (minimatch(path, settings.ignore[i], {matchBase: true})) {
    //     return true;
    //   }
    // }
    // return false;
  }
};
var ftps = {}
function quitConn(myFtp) {
  myFtp.raw.quit(function (err, data) {
    if (err) return console.error(err);

    console.log("Bye!");
  });
}
function debugMode(ftp){
  // // console.log('ftp',ftp)
  // // ftp.setDebugMode(true)
  // ftp.debugMode = true;
  // ftp.on('jsftp_debug', function(eventType, data) {
  //  console.log('DEBUG: ', eventType);
  //  console.log(JSON.stringify(data, null, 2));
  // });
}
ftps.connect = function (data, callback) {
  try {
    var ftp = new Jsftp(data);
    debugMode(ftp);

    ftp.auth(data.user, data.pass, function (err, result) {
      quitConn(ftp)
      if (err) return callback(err)
      else if (result && !result.isError) {
        callback(null, data)
      } else return callback({ errors: [result.text] })
    })

  } catch (e) {
    return callback({ errors: [e], status: 500 })

  }
};
ftps.upload = function (data, mainCallback) {
  console.log('req files', data)
  // console.log('req body',req.body)
  // return res.send('successful')
  // async.each

  try {
    var ftp = new Jsftp(data.ftp);
      debugMode(ftp);
  } catch (e) {
    return mainCallback({ errors: [e] })
  }
  async.eachSeries(data.files, function (file, callback) {
    var filePath = file;
    var filename = filePath.substr(filePath.lastIndexOf('/') + 1);
    var fileData = fs.readFileSync(filePath);
    // console.log('uploadfile',req.body.dir + filename)
    ftp.put(fileData, data.dir + filename, function (hadError) {
      if (hadError) callback(hadError)
      else callback();
    });
  }, function (err) {
    quitConn(ftp)
    if (err) return callback(err)
    else mainCallback(null, { message: 'Files Uploaded Successfully' })
  })
}
ftps.list = function (data, callback) {
  console.log('data---------', data)
  try {
    var ftp = new Jsftp(data.ftp);
      debugMode(ftp);
  } catch (e) {
    return callback({ errors: [e], status: 500 })
  }
  ftp.ls(data.dir || '/', function (err, files) {
    quitConn(ftp)
    if (err) return callback(err)
    else {
      files = _.sortBy(files, function (file) {
        return - file.type;
      })
      files = _.map(files, function (file) {
        file.time = new Date(file.time);
        var perm = '';
        ['userPermissions', 'groupPermissions', 'otherPermissions'].forEach(function (permission_type) {
          if (file.hasOwnProperty(permission_type)) {
            ['read', 'write', 'exec'].forEach(function (permission) {
              var keyword;
              if (permission == 'read') keyword = 'r'
              else if (permission == 'write') keyword = 'w'
              else keyword = 'x'
              if (file[permission_type][permission]) perm += keyword
              else perm += '-'
            })
          }
        })
        if (file.type != 0) {
          file.type = 'Directory';
        } else {
          file.type = 'File';
        }
        file.perm = perm;
        return file;
      })
      var currentDir = data.dir || '/';
      currentDir = currentDir.split('/');

      callback(null, { ftpdirlist: files, dirs: currentDir });
    }
  })
}
ftps.download = function (data, callback) {
  console.log('req session', data);
  try {
    var ftp = new Jsftp(data.ftp);
      debugMode(ftp);
  } catch (e) {
    console.log('err', err)
    return callback({ errors: [e], status: 500 })
  }
  //console.log('test',test)
  var uniquekey
  var localFilePath = data.destPath;
  // console.log('localFilePath',localFilePath);
  data.path = (data.path.charAt(data.path.length - 1) == '/') ? data.path : data.path + '/';
  localFilePath = localFilePath.charAt(localFilePath.length - 1) == '/' ? localFilePath : localFilePath + '/';

  ftp.get(data.path + data.name, localFilePath + data.name, function (err) {
    quitConn(ftp)
    console.log('err', err)
    if (err) callback({ errors: [err], status: 500 })
    else {
      console.log('file download')
      callback(null, { message: 'Download Successfully' })
    }
  })
}
ftps.rename = function (data, callback) {
  try {
    var ftp = new Jsftp(data.ftp);
      debugMode(ftp);
  } catch (e) {
    console.log('err', err)
    return callback({ errors: [e], status: 500 })
  }
  var from = data.path + data.source;
  var to = data.path + data.dest
  ftp.rename(from, to, function (err, data) {
    quitConn(ftp)
    if (err) return callback(err)
    else callback(null, { message: 'Rename successful' })
  })
}
ftps.mkdir = function (data, callback) {
  try {
    var ftp = new Jsftp(data.ftp);
      debugMode(ftp);
  } catch (e) {
    console.log('err', err)
    return callback({ errors: [e], status: 500 })
  }
  ftp.raw.mkd(data.dir, function (err, data) {
    if (err) return callback(err)
    else callback(null, { message: 'Directory Created' })
  })
}
ftps.rmdir = function (data, callback) {
  try {
    var ftp = new Jsftp(data.ftp);
      debugMode(ftp);
  } catch (e) {
    console.log('err', err)
    return callback({ errors: [e], status: 500 })
  }
  ftp.raw.xrmd(data.path + data.name, function (err, data) {
    if (err) return callback(err)
    else callback(null, { message: 'Directory Deleted' })
  })
}
ftps.delete = function (data, callback) {
  try {
    var ftp = new Jsftp(data.ftp);
      debugMode(ftp);
  } catch (e) {
    console.log('err', err)
    return callback({ errors: [e], status: 500 })
  }
  ftp.raw.dele(data.path + data.name, function (err, data) {
     quitConn(ftp)
    if (err) return callback(err)
    else callback(null, { message: 'File Deleted' })
  })
}
ftps.move = function () {
  try {
    var ftp = new Jsftp(data.ftp);
      debugMode(ftp);
  } catch (e) {
    console.log('err', err)
    return callback({ errors: [e], status: 500 })
  }
  var from = data.sourcePath + data.sourceFile;
  var to = data.sourcePath + data.destFile
  ftp.rename(from, to, function (err, res) {
    quitConn(ftp)
    if (err) return callback(err)
    else callback(null, { message: 'Rename successful' })
  })
}
ftps.copy = function (data, callback) {
  try {
    var ftp = new Jsftp(data.ftp);
      debugMode(ftp);
  } catch (e) {
    console.log('err', err)
    return callback({ errors: [e], status: 500 })
  }
  if (!data.sourcePath) {
    return callback({ errors: ['source path '] })
  } else if (!data.destPath) {
    return callback({ errors: ['source path '] })
  } else if (data.sourcePath == data.destPath) {
    return callback({ errors: ['Source path & dest path could not be same'] })
  }
  // var uniquekey = getCookie('connect.sid',req.headers.cookie)
  var localFilePath = './temp/' + req.body.name;
  ftp.get(data.sourcePath + data.name, localFilePath, function (err, socket) {
    if (err) {
      quitConn(ftp)
      return callback(err)
    }
    else {
      ftp.put(localFilePath, data.destPath + data.name, function (err) {
        quitConn(ftp)
        if (err) return callback(err)
        else callback(null, { message: 'Copied File Successfully' })
        fs.unlinkSync(localFilePath)
      })
    }
  });
}
ftps.testConnection = function (data, callback) {
  try {
    var ftp = new Jsftp(data.ftp);
      debugMode(ftp);
  } catch (e) {
    return callback({ errors: [e], status: 500 })
  }
  ftp.auth(data.user, data.pass, function (err, result) {
    quitConn(ftp)
    if (err) return callback(err)
    else if (result && !result.isError) {
      // data.ftp = req.body
      callback(null, data);
    } else return callback({ errors: [text] })
  })
};
var walkRemote = function(data, callback) {
    var dirs = [];
    var files = [];
    var dir = data.dir;
    var settings = data;
    var ftp = data.ftp;
    // walk the directory
    ftp.ls(dir, function(err, list) {
      if (err) {
        sync.log.error('ftp.ls failed.');
        return callback(err);
      }
      var i = 0;
      (function next() {
        var file = list[i++];
        // exit if all files are processed
        if (!file) { return callback(null, { 'dirs':dirs, 'files':files }); }
        // get file/dir name/stats
        var path = dir + '/' + file.name;
        // skip ignore files
        console.log('--TEst--TEst',helpers.trimPathRoot(settings.remote, path))
        if (helpers.isIgnored(helpers.trimPathRoot(settings.remote, path))) {
          next();
          return;
        }
        // handle directories
        if (file.type === 1) {
          // add the directory to the results
          dirs.push(helpers.trimPathRoot(settings.remote, path));
          // concat results from recursive calls
          walkRemote({dir:path,ftp:data.ftp,remote:settings.remote}, function(err, res) {
           // recurse & shit
            if(res){
              dirs = dirs.concat(res.dirs);
              files = files.concat(res.files);
            }
           
            next();
          });
          return;
        }
        // handle files
        if (file.type === 0) {
          // add the file to the results
          files.push({
            'id':helpers.trimPathRoot(settings.remote, path),
            'size':+file.size,
            'time':new Date(file.time)
          });
          next();
          return;
        }
        // skip everything else (ex sumlinks)
        else { next(); }
      })();
    });
  }

ftps.walkRemote = function (data, callback) {
  try {
    var ftp = new Jsftp(data.ftp);
    debugMode(ftp)
  } catch (e) {
    return callback({ errors: [e], status: 500 })
  }
  // data.ftp = ftp;
  data.remote = '/'
  walkRemote({dir:'/cloudconvert/',ftp:ftp,remote:''},function(err,res){
    if(err) callback(err)
    else callback(null,res)
  })
};

module.exports = ftps;