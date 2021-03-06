import { app } from 'electron';
import * as fs from 'fs';
import * as unzipper from 'unzipper';
import * as path from 'path';
import * as http from 'http';
import * as  rimraf from 'rimraf';

class Store {
  userDataPath: string;
  configPath: string;
  data: any;
  log: any;
  constructor(opts) {
    // Renderer process has to get `app` module via `remote.app`, whereas the main process can get it directly
    // app.getPath('userData') will return a string of the user's app data directory path.
    this.log = opts.logMsg;
    this.userDataPath = app.getPath('userData');
    // We'll use the `configName` property to set the file name and path.join to bring it all together as a string
    this.configPath = path.join(this.userDataPath, opts.configName + '.json');

    this.data = this.parseDataFile(this.configPath, opts.defaults);
    this.log(`Saved Data is loaded... ${JSON.stringify(this.data)}`);
  }

  // This will just return the property on the `data` object
  get(key) {
    return this.data[key];
  }

  // ...and this will set it
  set(key, val) {
    this.data[key] = val;
    // Wait, I thought using the node.js' synchronous APIs was bad form?
    // We're not writing a server so there's not nearly the same IO demand on the process
    // Also if we used an async API and our app was quit before the asynchronous write had a chance to complete,
    // we might lose that data. Note that in a real app, we would try/catch this.
    try {
      fs.writeFileSync(this.configPath, JSON.stringify(this.data));
    } catch (err) {
      console.log(err);
    }
  }

  getAllKeys() {
    return Object.keys(this.data);
  }

  getAllValues() {
    return Object.values(this.data);
  }

  resetDefaults(defaults) {
    this.data = defaults;
    try {
      fs.writeFileSync(this.configPath, JSON.stringify(this.data));
    } catch (err) {
      console.log(err);
    }
  }

  writeUserFile(filePath, data) {
    const userFilePath = path.join(this.userDataPath, filePath);
    fs.writeFileSync(userFilePath, JSON.stringify(data));
  }

  getFullUserFilePath(filePath) {
    return path.join(this.userDataPath, filePath);
  }

  download(url, dest, options: any = {}, ext = 'zip') {
    let destPath = path.join(this.userDataPath, (dest + '.' + ext));
    try {
      this.ensureDirExist(destPath);
      this.log(`Try Downloading... ${destPath}`, 'info');
      const file = fs.createWriteStream(destPath, { mode: 0o777 });
      // You shouldn't call write on your tempFile write stream until you've received the 'open' event from the stream.
      // The file won't exist until you see that event.
      file.on('open', (fd) => {
        const request = http.get(url, (response) => {
          response.pipe(file);
          if (options.responseCB) { options.responseCB(response, options.cbOptions); }

          file.on('finish', () => {
            this.log(`Downloading Done... ${destPath}`, 'info');
            file.on('close', () => {
              if (options.cb) { options.cb(destPath, options.cbOptions); }
            });
            file.close();  // close() is async, call cb after close completes.
          });
        }).on('error', (err) => { // Handle errors
          destPath = null;
          this.log(`Downloading request Error... ${JSON.stringify(err)}`, 'error');
          this.removeFile(dest); // Delete the file async. (But we don't check the result)
          if (options.cb) { options.cb(false, options.cbOptions); }
        }).on('end', (en) => {
          console.log('req end...', en);
        }).on('abort', (en) => {
          console.log('req abort...', en);
        }).on('timeout', (en) => {
          console.log('req timeout...', en);
        });
      });
      return destPath;
    } catch (err) {
      destPath = null;
      this.log(`Downloading Error... ${JSON.stringify(err)}`);
      if (options.cb) { options.cb(false, options.cbOptions); }
    }
  }

  unzipFile(targetFile, options: any = {}) {
    const dist = options.dist || path.dirname(targetFile);
    fs.createReadStream(targetFile)
      .pipe(unzipper.Extract({ path: dist }))
      .on('close', () => {
        if (options.cb) { options.cb(dist, options.cbOptions); }
      }).on('error', () => {
        if (options.cb) { options.cb(false, options.cbOptions); }
      });
  }

  ensureDirExist(filePath) {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
  }

  removeDir(dirName) {
    const dirPath = path.join(this.userDataPath, dirName);
    rimraf.sync(dirPath);
  }

  moveDir(oldPath, newPath) {
    fs.renameSync(oldPath, newPath);
  }

  removeFile(filePath) {
    fs.unlink(filePath, this.log); // Delete the file async. (But we don't check the result)
  }

  parseDataFile(filePath, defaults) {
    // We'll try/catch it in case the file doesn't exist yet, which will be the case on the first application run.
    // `fs.readFileSync` will return a JSON string which we then parse into a Javascript object
    this.log(`Will try to load Data... ${filePath}`);
    try {
      const content: any = fs.readFileSync(filePath);
      return JSON.parse(content);
    } catch (error) {
      // if there was some kind of error, return the passed in defaults instead.
      this.log(`File not found... ${filePath}`, 'debug');
      return defaults;
    }
  }
}


// expose the class
module.exports.Store = Store;
