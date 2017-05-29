const { app, BrowserWindow, dialog } = require('electron');
let mainWindow;
var _ = require('underscore');
global.ftpsyncron = {};
global.ftpprocess = [];
 var CronJob = require('cron').CronJob
var fs = require('fs');
// const dialog = electron.dialog;

if (!fs.existsSync('ftpsync.json')) {
    // Do something
    fs.writeFile('ftpsync.json',JSON.stringify([]))
}
if (!fs.existsSync('ftplist.json')) {
    // Do something
    fs.writeFile('ftplist.json',JSON.stringify([]))
}
var FtpSyncList = require('./ftpconnlist');
var ftpsynclist = new FtpSyncList('ftpsync');
// Quit when all windows are closed.
app.on('window-all-closed', function () {
  if (process.platform != 'darwin')
    app.quit();
});
ftpsynclist.getAll(function(err,list){
  if(list && list.length){
    list.forEach(function(obj){
      if(obj && !_.isArray(obj.ignore)) obj.ignore = obj.ignore.split(',')
      if(obj.start){
        startCron(obj);
      }
      
    })
  }
})
// This method will be called when Electron has done everything
// initialization and ready for creating browser windows.
app.on('ready', function () {
  // Create the browser window.

  mainWindow = new BrowserWindow({ width: 1920, height: 1080 });
  global.mainWindow = mainWindow;
  // and load the index.html of the app.
  mainWindow.loadURL('file://' + __dirname + '/index.html');

  // Emitted when the window is closed.
  mainWindow.on('closed', function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null;
  });

  mainWindow.webContents.openDevTools()
});
const openFileDirSelectionModal = function (type) {
  var properties = ['openFile', 'multiSelections'];
  if (type == 'folder') {
    properties = ['openDirectory'];
  }
  var data = dialog.showOpenDialog(mainWindow, {
    properties: properties
  });
  return data;
  // var content = fs.readFileSync(file).toString();

  // console.log(content);
};

var startCron = function(options){
  this.ftpSync = require('ftpsync');
  this.ftpSync.settings = options;
  this.ftpSync.isRunning = false;
  var that = this;
  that.isRunning = false;
  global.ftpsyncron[options.id] = new CronJob({
    cronTime: '*/5 * * * * *',
    onTick: function() {
      console.log("isRunning",that.isRunning)
      if(!that.isRunning){
        that.isRunning = true;
        var ftpsync = require('ftpsync');
        ftpsync.settings = options;
        ftpsync.run(function(){
          that.isRunning = false;
        })
      } 
    },
    timeZone: "America/Los_Angeles"
  })
  global.ftpsyncron[options.id].start();
}
var stopCron = function(id,callback){
  if(global.ftpsyncron[id]){
    global.ftpsyncron[id].stop();
  }
  if(typeof callback == 'function'){
    callback(null)
  }
}
function startCronById(id,callback){
    if(!callback) callback = function(){};
    ftpsynclist.get(id,function(err,obj){
      if(!err){
        if( err) callback(err)
        else{
          startCron(obj);
          console.log('obj',obj)
          _.extend(obj,{start:true})
          ftpsynclist.update(id,obj,function(err){
            if(err) callback(err)
            callback(null,obj)
          })
        }
      }else callback(err);
    })
}
exports.openFileDirSelectionModal = openFileDirSelectionModal;
exports.startCron = startCron;
exports.stopCron = stopCron;
exports.startCronById = startCronById;
