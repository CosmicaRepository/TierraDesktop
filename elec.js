var packager = require('electron-packager');
var options = {
    'arch': 'ia32',
    'platform': 'win32',
    'dir': './',
    'app-copyright': 'Paulo Galdo',
    'app-version': '2.1.0',
    'asar': true,
    'icon': './app.ico',
    'name': 'TierraDesktop',
    'ignore': ['./releases', './.git', './Installer','./nbproject','./.imdone'],
    'out': './releases',
    'overwrite': true,
    'prune': true,
    'version': '1.3.3',
    'version-string':{
      'CompanyName': 'Paulo Galdo',
      'FileDescription': 'Tierra de colores', /*This is what display windows on task manager, shortcut and process*/
      'OriginalFilename': 'TierraDesktop',
      'ProductName': 'Tierra de colores',
      'InternalName': 'TierraDesktop'
    }
};
packager(options, function done_callback(err, appPaths) {
    console.log("Error: ",err);
    console.log("appPaths: ",appPaths);
});
