var fs = require('fs');
var path = require('path');

var pug = require('pug');
var sass = require('node-sass');

var getStuff = require('./src/getStuff.js');

getStuff(function(err, stuff) {
  if (err) {
    console.log('ERR!', err);
    return;
  }

  var html = pug.compileFile('src/index.pug', {pretty: true})(stuff);

  fs.writeFile('index.html', html, function (err) {
    if (err) return console.error(err)
    console.log('CREATE FILE: INDEX.HTML')
  });

  var sassSrc = 'src/main.sass'
  sass.render({
    file: sassSrc,
    outFile: "main.css",
  }, function(error, result) { // node-style callback from v3.0.0 onwards
    if(!error){
      // No errors during the compilation, write this result on the disk
      fs.writeFile("main.css", result.css, function(err){
        if(!err){
          console.log('CREATE FILE: MAIN.CSS')
        }
      });
    }
  });
});
