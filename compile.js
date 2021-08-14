const fs = require('fs');
const path = require('path');

const pug = require('pug');
const sass = require('sass');

const getStuff = require(path.join( __dirname, './src/getStuff.js'));

getStuff(function(err, stuff) {
  if (err) {
    console.log('ERR!', err);
    return;
  }

  var html = pug.compileFile(path.join( __dirname, 'src/index.pug'), {pretty: true})(stuff);

  fs.writeFile(path.join( __dirname, './dist/index.html'), html, function (err) {
    if (err) return console.error(err)
    console.log('CREATE FILE: INDEX.HTML')
  });


  var sassSrc = path.join( __dirname, 'src/styles/main.sass')
  sass.render({
    file: sassSrc,
    outFile: 'main.css',
  }, function(error, result) { // node-style callback from v3.0.0 onwards
    if (error) return console.error(error)

    // No errors during the compilation, write this result on the disk
    fs.writeFile(path.join( __dirname, './dist/main.css'), result.css, function(err){
      if (err) return console.error(err)
      console.log('CREATE FILE: MAIN.CSS')
    });
  });
});
