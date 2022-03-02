const { Jimp } = require("jimp");
const configure = require("@jimp/custom");
const path = require("path");
const gif = require("./src");

const jimp = configure({ types: [gif] }, Jimp);
const imagesDir = path.join(__dirname, "images");

async function main() {
  // const image = await jimp.read(imagesDir + "/flower.gif");
  // image.getPixelColor(10, 10);

  // const image = await jimp.read(imagesDir + "/animated.gif");
  // image.getPixelColor(10, 10)

  const jgd = await jimp.read(imagesDir + "/flower.gif");
  const buffer = await jgd.getBufferAsync("image/gif");
  buffer.toString().startsWith("GIF")
}

main();
