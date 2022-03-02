const GIF = require("omggif");
const { GifUtil, GifFrame, BitmapImage, GifCodec } = require("gifwrap");

const MIME_TYPE = "image/gif";

const gif = () => ({
  mime: { [MIME_TYPE]: ["gif"] },

  constants: {
    MIME_GIF: MIME_TYPE,
  },

  decoders: {
    [MIME_TYPE]: (data) => {
      console.log(data);

      const gifObj = new GIF.GifReader(data);
      const gifData = Buffer.alloc(gifObj.width * gifObj.height * 4);

      gifObj.decodeAndBlitFrameRGBA(0, gifData);

      return {
        data: gifData,
        width: gifObj.width,
        height: gifObj.height,
      };
    },
  },

  encoders: {
    [MIME_TYPE]: (data) => {
      console.log(data);

      const bitmap = new BitmapImage(data.bitmap);
      GifUtil.quantizeDekker(bitmap, 256);
      const newFrame = new GifFrame(bitmap);
      const gifCodec = new GifCodec();
      return gifCodec.encodeGif([newFrame], {}).then((newGif) => {
        return newGif.buffer;
      });
    },
  },
});

module.exports = gif;
