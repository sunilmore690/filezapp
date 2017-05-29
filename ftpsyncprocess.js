 var CronJob = require('cron').CronJob,
 ftp = require('./ftp');
var electron = require('electron');
const remote = electron.remote;
const mainProcess = remote.require('./main');

function FtpProcess(options){
  console.log('options',options)
  if(options && options.ignore && !_.isArray(options.ignore)){
    options.ignore = options.ignore.split(',')
  }
  options.verbose = true;
  this.options = options;
  // this.start = this.cron;
  
}
FtpProcess.prototype.start = function(callback){
  var that = this;
  ftp.connect(this.options,function(err){
    if(err){
      if(typeof callback == 'function') callback(err);
    }else{
       if(typeof callback == 'function') callback(null,'done');
       mainProcess.startCron(that.options);
       
    }
  })
 
}
module.exports = FtpProcess;
