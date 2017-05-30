$.fn.extend({
  treed: function (o) {

    var openedClass = 'glyphicon-minus-sign';
    var closedClass = 'glyphicon-plus-sign';

    if (typeof o != 'undefined') {
      if (typeof o.openedClass != 'undefined') {
        openedClass = o.openedClass;
      }
      if (typeof o.closedClass != 'undefined') {
        closedClass = o.closedClass;
      }
    };

    //initialize each of the top levels
    var tree = $(this);
    tree.addClass("tree");
    tree.find('li').has("ul").each(function () {
      var branch = $(this); //li with children ul
      branch.prepend("<i class='indicator glyphicon " + closedClass + "'></i>");
      branch.addClass('branch');
      branch.on('click', function (e) {
        if (this == e.target) {
          var icon = $(this).children('i:first');
          icon.toggleClass(openedClass + " " + closedClass);
          $(this).children().children().toggle();
        }
      })
      branch.children().children().toggle();
    });
    //fire event from the dynamically added icon
    tree.find('.branch .indicator').each(function () {
      $(this).on('click', function () {
        $(this).closest('li').click();
      });
    });
    //fire event to open branch if the li contains an anchor instead of text
    tree.find('.branch>a').each(function () {
      $(this).on('click', function (e) {
        $(this).closest('li').click();
        e.preventDefault();
      });
    });
    //fire event to open branch if the li contains a button instead of text
    tree.find('.branch>button').each(function () {
      $(this).on('click', function (e) {
        $(this).closest('li').click();
        e.preventDefault();
      });
    });
  }
});


var fs = require('fs'),
  myftp = require('./ftp'),
  FtpList = require('./ftpconnlist'),
  FtpSyncList = require('./ftpconnlist'),
  ftplist = new FtpList('ftplist'),
  ftpsynclist = new FtpSyncList('ftpsync'),
  FtpSync = require('./ftpsyncprocess'),
  async = require('async');
global.ftpview = {};
var electron = require('electron');
const remote = electron.remote;
const mainProcess = remote.require('./main');
var hierarchy = function (array) {
  return array.reduce(function (hier, path) {
    var x = hier;
    path.split('/').forEach(function (item) {
      if (!x[item]) {
        x[item] = {};
      }
      x = x[item];
    });
    x.path = path;
    return hier;
  }, {});
}
var TemplateManager = {
  templates: {}, // holds the templates cache
  get: function (id, callback) {
    var template = this.templates[id];
    if (template) { // return the cached version if it exists
      callback(template);
    } else {
      var that = this;
      var template = fs.readFileSync('public/templates/' + id + '.hbs', 'utf-8');
      console.log('---template', template)
      that.templates[id] = template;
      callback(that.templates[id]);

    }
  }
}
function getCurrentFtp() {
  if (global.ftp) {
    return global.ftp;
  }
  return false;

}
function setCurrentFtp(ftp) {
  global.ftp = ftp;
}
function parseQueryString(variable) {
  var query = window.location.search.substring(1);
  var vars = query.split('&');
  for (var i = 0; i < vars.length; i++) {
    var pair = vars[i].split('=');
    if (decodeURIComponent(pair[0]) == variable) {
      return decodeURIComponent(pair[1]);
    }
  }

}
Handlebars.registerHelper("when", function (operand_1, operator, operand_2, options) {
  var operators = {
    'eq': function (l, r) {
      return l == r;
    },
    'noteq': function (l, r) {
      return l != r;
    },
    'gt': function (l, r) {
      return Number(l) > Number(r);
    },
    'or': function (l, r) {
      return l || r;
    },
    'and': function (l, r) {
      return l && r;
    },
    '%': function (l, r) {
      return (l % r) === 0;
    }
  },
    result = operators[operator](operand_1, operand_2);

  if (result) return options.fn(this);
  else return options.inverse(this);
});
Handlebars.registerHelper("formattedDate", function (date) {
  console.log('date', date)
  return new Date(date).toLocaleString()
  // return moment(date).format('MMMM Do YYYY, h:mm:ss a');
})
Handlebars.registerHelper('fileIcon', function (target) {
  var allowedExtensions = ["txt", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "bmp", "pdf", "gif", "jpeg", "jpg", "png", "bz2", "dmg", "gz", "gzip", "iso", "rar", "tar", "tgz", "zip"];
  var targetNameParts = target.split(".");
  var extensionPart = targetNameParts.length;
  var extension =
    ($.inArray(targetNameParts[extensionPart - 1], allowedExtensions) > -1) ?
      targetNameParts[extensionPart - 1] : "txt";

  return 'fa-file-' + extension + '-o';
})
Handlebars.registerHelper('humanFileSize', function (bytes) {
  var si = true;
  var thresh = si ? 1000 : 1024;
  if (Math.abs(bytes) < thresh) {
    return bytes + ' B';
  }
  var units = si
    ? ['kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
    : ['KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB'];
  var u = -1;
  do {
    bytes /= thresh;
    ++u;
  } while (Math.abs(bytes) >= thresh && u < units.length - 1);
  return bytes.toFixed(1) + ' ' + units[u];
})
var makeul = function (hierarchydata, classname) {
  console.log('hierarchydata',hierarchydata)
  var ul = '<ul id="tree1"';
  if (classname) {
    ul += ' class="' + classname + '"';
  }
  ul += '>\n';
 _.each(hierarchydata,function (value, key) {
    if (Object.keys(hierarchydata[key]).length == 1 && hierarchydata[key].path) {
      ul += '<li class="folder">' + key + '\n';
      ul += '</li>\n';
    } else {
      ul += '<li class="folder">' + key + '\n';
      ul += makeul(hierarchydata[key]);
      ul += '</li>\n';
    }
  })
  ul += '</ul>\n';
  return ul;
};
Handlebars.registerHelper('tree', function (array, classname) {
  return new Handlebars.SafeString(makeul(hierarchy(array), classname)); // mark as already escaped
});
var BaseModel = Backbone.Model.extend({

});

var FtpConnect = BaseModel.extend({

  defaults: {
    port: '21'
  }
});
var FtpListModel = BaseModel.extend({

});
var renameModel = BaseModel.extend({

});
var deleteModel = BaseModel.extend({
  urlRoot: '/api/ftp/delete',
});


var FtpView = Backbone.View.extend({
  // el: '.pa',
  className: 'tab-pane fade ',
  events: {
    'dblclick .ftpinfo': 'listDirFile',
    'click .path': 'goToPath',
    'click .action': 'Action',
    'click .mkdir': 'makeDir',
    'click .delete': 'deleteFileFolder',
    'click .makedir': 'crateDir',
    'click .upload': 'uploadFiles',
    'click .download': 'downloadFile',
    'click .rename': 'rename',
    'click .ftpinfo': 'selectCurrent',
    'click .refresh': 'refresh'
  },
  refresh: function () {
    this.render();
    window.App.setLoading(false);
  },
  selectCurrent: function (event) {
    var that = this;
    var data = $(event.currentTarget).data();
    console.log('data', data);
    that.$el.find('.ftpinfo').removeClass('active');
    $(event.currentTarget).addClass('active');
    this.currentSelection = { name: data.name, type: data.type };
    if (data.type == 'Directory') {
      that.$el.find('.action').removeClass('disabled');
      that.$el.find('.delete').removeClass('disabled');
      that.$el.find('.download').addClass('disabled');

    } else {
      that.$el.find('.action').removeClass('disabled');
      that.$el.find('.delete').removeClass('disabled');
      that.$el.find('.download').removeClass('disabled');

    }
  },
  downloadFile: function (event) {
    var data = $(event.currentTarget).data();
    var path = this.model.get('dir');
    var name = this.currentSelection.name;
    var destPath = mainProcess.openFileDirSelectionModal('folder');
    if (_.isArray(destPath)) destPath = destPath[0];
    var ftp = this.model.get('ftp');
    window.App.setLoading(true)
    myftp.download({ path: path, name: name, destPath: destPath, ftp: ftp }, function (err) {
      if (err) {
        window.App.flash(err.errors, 'error')
      } else {
        window.App.flash('File Download Successfull', 'success');
      }
      window.App.setLoading(false)
    })
    return false;

  },
  uploadFiles: function () {
    var that = this;
    console.log('Calling upload file');
    var files = mainProcess.openFileDirSelectionModal();
    if (files && files.length) {
      myftp.upload({ files: files, dir: this.model.get('dir'), ftp: this.model.get("ftp") }, function (err) {
        if (err) window.App.flash('Something went wrong', 'error')
        else window.App.flash('Files uploaded Successfully', 'success');
        that.render();
      })
    }
    //  console.log('files', mainProcess.openFile());
    // global.showDialog();
    return false;
  },
  Action: function (event) {
    var data = $(event.currentTarget).data();
    if (data.action == 'download') {
      this.download(this.currentSelection.name)
    } else if (data.action == 'rename') {
      console.log('Calling rename');
      this.renameModal(this.currentSelection.name);
    }
  },
  crateDir: function (event) {
    var that = this;
    var newdir = this.$el.find('.newdirname').val()
    console.log("newdir", newdir)
    if (newdir) {
      var dir = this.model.get('dir') + '/' + newdir
      window.App.setLoading(true)
      myftp.mkdir({ dir: dir, ftp: this.model.get('ftp') }, function (err) {
        that.$el.find(".dir-modal").modal('hide');
        if (err) {
          window.App.flash('Something went wrong', 'error')

        } else {
          window.App.flash('Directory Created', 'success')
          that.render();
        }
        window.App.setLoading(false)

      })
    } else {
      this.$el.find(".dir-modal").modal('hide');
    }
    return false;
  },
  makeDir: function (event) {
    this.$el.find(".dir-modal").modal('show');
    return false;
  },
  download: function (name) {
    var currentDir = this.model.get('dir') || '/';

  },
  renameModal: function (name) {
    var that = this;
    var currentDir = this.model.get('dir') || '/';
    that.$el.find('.rename-modal .dirname').val(name);
    that.$el.find('.rename-modal .prevdirname').val(name);
    that.$el.find(".rename-modal").modal('show');
    return false;
    // var newfile = prompt("Rename ", name);

    // if (newfile && newfile != name) {
    //   var data = { path: currentDir, source: name, dest: newfile };
    //   _.extend(data, { ftp: this.model.get('ftp') || {} })
    //   myftp.rename(data, function (err) {
    //     if (err) {
    //       window.App.flash('Something went wrong', 'error')
    //     } else {
    //       window.App.flash("Rename successfull", 'success');
    //       that.render();
    //     }
    //   })
    // }
  },
  rename: function () {
    var that = this;
    var newfile = that.$el.find('.rename-modal .dirname').val();
    var name = that.$el.find('.rename-modal .prevdirname').val();
    console.log('newfile', newfile);
    console.log('name', name)
    if (newfile && newfile != name) {
      var data = { path: this.model.get('dir'), source: name, dest: newfile };
      _.extend(data, { ftp: this.model.get('ftp') || {} })
      window.App.setLoading(true)
      myftp.rename(data, function (err) {
        if (err) {
          window.App.flash('Something went wrong', 'error')
        } else {
          window.App.flash("Rename successfull", 'success');
          that.render();
        }
        window.App.setLoading(false)
        that.$el.find(".rename-modal").modal('hide');
      })
    } else {
      that.$el.find(".rename-modal").modal('hide');
    }
  },
  deleteFileFolder: function (event) {
    var data = this.currentSelection;
    if (confirm("Are you sure,do you want to delete this " + data.type + " ? " + data.name) != true) {
      return false;
    }
    var that = this;
    var mydata = { path: this.model.get('dir') || '/', name: data.name };
    _.extend(mydata, { ftp: this.model.get('ftp') || {} })
    window.App.setLoading(true)
    if (data.type == 'File') {
      myftp.delete(mydata, function (err) {
        if (err) {
          window.App.flash('Something went wrong', 'error');
        } else {
          window.App.flash("File Deleted", 'success');
          that.render();
        }
        window.App.setLoading(false)
      })
    } else {
      myftp.rmdir(mydata, function (err) {
        if (err) {
          window.App.flash('Something went wrong', 'error');
        } else {
          window.App.flash("Directory Deleted", 'success');
          that.render();
        }
        window.App.setLoading(false)
      })
    }
    return false;

  },
  postRender: function () {
    var that = this;
    App.view.navbar.render();
  },
  initialize: function () {
    var that = this;
    console.log("model", this.model.attributes)
    this.ftp = this.model.get('ftp');
    // this.model = new FtpListModel({ dir: sessionStorage.getItem('currentDir') || '/' });
    this.model.on('change:dir', function () {
      window.sessionStorage.setItem('currentDir', that.model.get('dir'));
    })

  },
  goToPath: function (event) {
    var data = $(event.currentTarget).data();
    console.log('data', data, this.model.get('dirs'))
    var dirs = this.model.get('dirs') || [];
    dirs = JSON.parse(JSON.stringify(dirs));
    dirs.pop();
    if (dirs.indexOf(data.name) >= 0) {
      var dir = '';
      for (var i = 0; i <= dirs.indexOf(data.name); i++) {
        dir += dirs[i] + '/'
      }
      console.log('dir', dir);
      this.model.set('dir', dir);
      this.render();
    } else {
      return false;
    }
  },
  listDirFile: function (event) {
    var data = $(event.currentTarget).data();
    console.log('data', data);
    if (data.type == 'Directory') {
      var dir = this.model.get('dirs') || [];
      dir = dir.join('/')
      console.log('dir', dir + data.name + "/")
      this.model.set('dir', dir + data.name + "/");
      this.render();
    } else {

    }
  },
  render: function (callback) {
    var that = this;
    console.log('data111', this.model.attributes)
    window.App.setLoading(true)
    myftp.list(this.model.attributes, function (err, data) {
      if (err) {
        window.App.flash('Something went wrong', 'error');
        console.error(err)
      } else {
        console.log('@@@@@@@@@@@@@data', data)
        that.model.set(JSON.parse(JSON.stringify(data)));
        TemplateManager.get('ftp', function (template) {
          window.App.setLoading(false)
          var template = Handlebars.compile(template);
          data.dirs.pop();
          if (data.ftpdirlist) {
            var total = data.ftpdirlist.length;
            var directories = _.filter(data.ftpdirlist, { type: 'Directory' });
            var dirtotal = directories.length;
            var filetotal = total - dirtotal;
            console.log('-------', that.model.attributes)
            _.extend(data, { size_info: { total: total, dir: dirtotal, file: filetotal } }, { isMobile: App.isMobile, ftp: that.model.get("ftp") })
          }
          var html = template(data);
          that.$el.html(html);
          that.postRender();
          if (typeof callback == 'function') callback();
        })
      }
    })
    return this;
  }
});
var FtpListView = Backbone.View.extend({

  el: '.page',

  events: {
    'click .closeTab': 'closeTab'
  },
  initialize: function () {

  },
  closeTab: function (event) {
    var that = this;
    if (window.confirm('Are you sure, do you want close this connection?')) {
      var data = $(event.currentTarget).data();
      ftplist.remove(data.id, function (err) {
        ftplist.getAll(function (err, list) {
          if (err) window.App.flash('Something went wrong', 'error')
          else if (list && list.length == 0) {
            that.render();
          } else {

            var length = list.length;
            var obj = list[length - 1];
            console.log('obj', obj.id);
            that.$el.find('.tabrole' + obj.id).tab('show');
            that.$el.find('#' + obj.id).addClass('in active');
          }
          that.$el.find('.mytab' + data.id).remove();
          $('#' + data.id).remove();
        })
      })
    }
  },
  render: function (id) {
    var that = this;
    ftplist.getAll(function (err, list) {
      TemplateManager.get('ftp_list', function (template) {
        console.log('data template', template)
        console.log('template', template, list)
        var template = Handlebars.compile(template);
        var html = template({ ftplist: list });
        that.$el.html(html);
        that.postRender(list,id);
      })
    })

  },
  postRender: function (list,id) {
    console.log('id',id)
    var that = this;
    var index = 1;
    async.eachSeries(list, function (ftp, callback) {
      global.ftpview[ftp.id] = new FtpView({ model: new FtpListModel({ dir: '/', ftp: ftp }), id: ftp.id })
      // that.$el.find('.nav-tabls').append()
      that.$el.find('.tab-content').append(global.ftpview[ftp.id].render(function () {
        console.log('render callback');
        callback();
      }).el);
      if(id){
         $('#' + id).addClass("in active");
         $('.tabrole'+id).tab('show');
      }else if (index == 1) {
        $('#' + ftp.id).addClass("in active");
        $('.tabrole'+ftp.id).tab('show');
      }
      index += 1;

    }, function (err) {
      console.log("All rendering done")
    })
  },
  onAddTab: function (e) {
    var tabView = new TabView({ model: this.model });
    that.$el.find('.tab-content').append(ftpview.render().el);
  },
});
var NavBarView = Backbone.View.extend({

  el: 'nav',
  events: {
    'click .signout': 'Logout',
    'click .pageaction': 'pageAction'
  },
  pageAction: function (event) {
    var that = this;
    var data = $(event.currentTarget).data();
    // if (data.action == 'ftpclient') {
    //   // window.App.view.ftplist.render();

    //   $('.connection').removeClass('hide');
    // } else {
    //   // window.App.view.ftpsync.render();
    //   $('.connection').addClass('hide');
    // }
    $('.ftplistpage').toggleClass('hide');
    $('.ftpsyncpage').toggleClass('hide');
    that.$el.find('.pageaction').removeClass('active');
    $(event.currentTarget).addClass('active');
    return false
  },
  initialize: function () {

  },
  Logout: function () {
    var request = $.post('/api/ftp/logout', {});

    request.success(function (result) {
      window.sessionStorage.removeItem('currentDir');
      window.App.flash('Logout Successfully', 'success')
      window.location = '/';
    });

    request.error(function (jqXHR, textStatus, errorThrown) {
      window.App.error('Something went wrong')
      // Etc
    });
    return false;
  },
  render: function () {
    TemplateManager.get('navbar', function (source) {
      var template = Handlebars.compile(source);
      console.log('ftp', window.App.User)
      var html = template({ ftp: window.App.User });
      this.$el.html(html);
    }.bind(this))
  }
})
var DirViewModal = Backbone.View.extend({
  tagName: 'div',
  className: 'modal fade',
  initialize: function () {

  },
  render: function (data) {
    console.log('data', data)
    var that = this;
    TemplateManager.get('dirview', function (source) {
      myftp.walkRemote(data, function (err, synclist) {
        // var dirs = ['//Catalog_Feeds_HW_Development','//Catalog_Feeds_HW_Development/Retailer','//Catalog_Feeds_HW_Development-wq','//Catalog_Feeds_HW_Development-wq/Retailer','//Catalog_Feeds_HW_Development/enqueued','//Catalog_Feeds_HW_Staging/Verification']
        // var synclist = {dirs:dirs}
        console.log('---synclist----', synclist.dirs);
        var template = Handlebars.compile(source);
        var dirs = synclist.dirs;
        dirs = _.filter(dirs, function (dir) {
          return (dir.match(new RegExp("/", "g")) || []).length > 1
        })
        dirs = dirs.map(function (path) {
          return path.substr(1)
        })
        // var hierarchydirs = hierarchy(dirs)
        // console.log('hierarchydirs', hierarchydirs)
        var html = template({ isMobile: App.isMobile, dirs: dirs });
        that.$el.html(html);
        that.$el.find('#tree1').treed({ openedClass: 'fa fa-folder', closedClass: 'fa fa-folder-open' });
        that.$el.modal('show');
      })
    }.bind(this))
  }
})
var FtpSyncView = Backbone.View.extend({

  el: '.ftpsyncpage',
  events: {
    'click .syncftp': 'SyncFtp',
    'click .localdirselect': 'folderSelection',
    'click .remotedirselect': 'remoteDirSelect',
    'click .stopftpcron': 'stopFtpCron',
    'click .startftpcron': 'startFtpCron'
  },
  startFtpCron: function (event) {
    console.log('calling start cron')
    var that = this;
    var data = $(event.currentTarget).data();
    if (data.id) {
      mainProcess.startCronById(data.id, function (err) {
        console.log('err', err)
        if (err) window.App.flash('Something went wrong', 'error')
        else {
          window.App.flash('Sync Started', 'success');
          that.render();
        }

      })
    }
    return false;
  },
  stopFtpCron: function (event) {
    var that = this;
    var data = $(event.currentTarget).data();

    if (data.id) {
      var id = data.id;
      mainProcess.stopCron(id, function () {
        ftpsynclist.update(id, _.extend(that.model.attributes, { start: false }), function () {
          console.log('synclist updated')
          that.render();
        })
      })
    }
    return false;
  },
  postRender: function () {
    var that = this;
    that.$el.on('shown.bs.tab', 'a[data-toggle="tab"]', function (e) {
      var data = $(e.currentTarget).data();
      console.log('data', data);
      that.currentTab = data.tab;
    })
  },
  remoteDirSelect: function () {
    var dirtreeview = new DirViewModal();
    dirtreeview.render({ ftp: this.model.attributes, dir: '/' });
    return false;
  },
  folderSelection: function () {
    var localPath = mainProcess.openFileDirSelectionModal('folder');
    if (_.isArray(localPath)) localPath = localPath[0];
    this.model.set('local', localPath)
    return false;
  },
  SyncFtp: function (event) {
    var that = this;
    ftpsynclist.add(_.extend(that.model.attributes, { start: true }), function (err, obj) {
      if (err) {
        window.App.flash('Something went wrong', 'error');
      } else {
        var ftpsync = new FtpSync(obj);
        ftpsync.start(function (err) {
          if (err) {
            window.App.flash('Something went wrong', 'error');
          } else {
            console.log('succcess')
            window.App.flash('Added');
            that.render();

          }
        });
      }
    });

    return false;
  },
  initialize: function () {
    var that = this;
    this._modelBinder = new Backbone.ModelBinder();
    this.model = new FtpConnect();
    this.model.on('change', function () {
      console.log('attributes', that.model.attributes)
      if (that.model.get('user') && that.model.get('host') && that.model.get('pass') && that.model.get('port')) {
        that.$el.find('[name="remote"]').prop("disabled", false)
      }
    })
    this.currentTab = 'add';
  },
  render: function () {
    // $('.connection').addClass('hide');
    var that = this;
    TemplateManager.get('ftpsync', function (source) {
      ftpsynclist.getAll(function (err, synclist) {
        var template = Handlebars.compile(source);
        var html = template({ synclist: synclist, isMobile: App.isMobile, currentTab: that.currentTab });
        that.$el.html(html);
        that.bindModel();
        that.postRender();
      })

    }.bind(this))
  },
  bindModel: function () {
    var bindings = {
      host: '[name=host]',
      user: '[name=user]',
      pass: '[name=pass]',
      port: '[name=port]',
      local: '[name=local]',
      remote: '[name=remote]',
      ignore: '[name=ignore]',
    };
    this._modelBinder.bind(this.model, this.el, bindings);
  }
})


var HomeView = Backbone.View.extend({
  el: '.connection',
  initialize: function () {
    this._modelBinder = new Backbone.ModelBinder();
    this.model = new FtpConnect()
  },
  events: {
    'click .login': "Login"
  },
  render: function (id) {
    var that = this;
    TemplateManager.get('home', function (template) {
      var template = Handlebars.compile(template);
      var html = template(that.model.attributes || {});
      that.$el.html(html);
      that.bindModel()
      return false;
    })
  },
  addSettingModal: function (event) {
    window.App.settingmodalview.render(this.model);
    return false;
  },
  bindModel: function () {
    var bindings = {
      host: '[name=host]',
      user: '[name=user]',
      pass: '[name=pass]',
      port: '[name=port]',
    };
    this._modelBinder.bind(this.model, this.el, bindings);
  },
  Login: function (e) {
    var that = this;
    myftp.connect(this.model.attributes, function (err, ftp) {
      console.log('err', err)
      if (err) {
        window.App.flash('Something went wrong', 'error')
      } else {
        ftplist.add(ftp, function (err,data1) {
          // console.log('data',data1)
          data = JSON.parse(JSON.stringify(data1))
          // App.router.currentView.render(data.id);
          that.model.clear();
          // return false;
          global.ftpview[data.id] = new FtpView({ model: new FtpListModel({ dir: '/', ftp: data }), id: data.id })
          var liel = '<li role="presentation" class="mytab{{id}}"> <a href="#{{id}}" aria-controls="profile" role="tab" data-toggle="tab" class="tabrole{{id}}">{{user}}@{{host}} <button class="close closeTab" type="button" data-id="{{id}}">×</button>&nbsp;&nbsp;</a> </li>';
          var template = Handlebars.compile(liel);
          template = template(data);
          App.router.currentView.$el.find('.nav-tabs').append(template);
          $('.tabrole'+data.id).tab('show');
          App.router.currentView.$el.find('.tab-content').append(global.ftpview[data.id].render(function () {
            console.log('render callback');
            // callback();
          }).el);
        })

      }
    })
    return false;
  }
});

var Router = Backbone.Router.extend({
  routes: {
    '': 'index'
  },
  index: function () {
    router.currentView = window.App.view.ftplist;
    router.currentView.render();
    window.App.view.navbar.render();
    var ftpsyncpage = new FtpSyncView();
    ftpsyncpage.render();
    // $('.connection').addClass('hide');
    window.App.view.home.render();
    var homeview = new HomeView();
    homeview.render();
    // window.App.view.navbar

  },
  execute: function (callback, args) {
    console.log('Calling execute')
    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
      App.isMobile = true;
    }
    var that = this;
    args.push(parseQueryString(args.pop()));
    if (callback) callback.apply(that, args);
  }
});
var router = new Router();
window.App = window.App || {};
window.App.router = router;
window.App.view = {};
window.App.view.ftplist = new FtpListView();
window.App.view.home = new HomeView();
window.App.view.navbar = new NavBarView();
window.App.view.ftpsync = new FtpSyncView();
window.App.setLoading = function (loading) {
  $('body').toggleClass('loading', loading);

  if (!loading) {
    $('body').css('overflow-y', 'auto');
  } else {
    $('body').css('overflow-y', 'hidden');
  }
}
window.App.flash = function (message, type) {
  if (type == 'error') {
    $.growl.error({
      message: message,
      duration: 1000,
      type: 'danger'
    });
  } else {
    $.growl.notice({
      message: message,
      title: '',
      duration: 1000
    });
  }
}
//window.App.setLoading(true)
Backbone.history.start();