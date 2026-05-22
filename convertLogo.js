const svg2img = require('svg2img');
const fs = require('fs');
const path = require('path');

const svgPath = path.join(__dirname, '../tiket-FE/public/brand.svg');
const pngPath = path.join(__dirname, 'assets/brand.png');

if (!fs.existsSync(path.join(__dirname, 'assets'))) {
  fs.mkdirSync(path.join(__dirname, 'assets'));
}

fs.readFile(svgPath, 'utf8', (err, data) => {
  if (err) throw err;
  svg2img(data, { width: 150, height: 150 }, (error, buffer) => {
    if (error) throw error;
    fs.writeFileSync(pngPath, buffer);
    console.log('Successfully converted brand.svg to brand.png');
  });
});
