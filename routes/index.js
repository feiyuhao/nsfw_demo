var express = require('express');
var router = express.Router();
const axios = require('axios');
const tf = require('@tensorflow/tfjs-node');
const nsfw = require('nsfwjs');
/* GET home page. */
router.get('/', async function (req, res, next) {
  if (req.query.file === undefined) {
    res.json({ code: 201, msg: '请上传网络图片' });
  } else if (
    req.query.file.slice(0, 4) == 'http' ||
    req.query.file.slice(0, 5) == 'https'
  ) {
    let pic = await axios
      .get(req.query.file, {
        responseType: 'arraybuffer'
      })
      .catch(err => {
        return res.json({ code: 202, data: req.query.file, msg: '判断失败' });
      });



    const model = await nsfw.load("http://"+req.headers.host+"/model/", { size: 299 }); // To load a local model, nsfw.load('file://./path/to/model/')
    // 图像必须tf.tensor3d格式
    // 您可以将图像转换为tf.tensor3d带 tf.node.decodeImage(Uint8Array,channels)
    let image = '';
    try {
      image = tf.node.decodeImage(pic.data, 3);
    } catch (err) {
      // 在这里处理错误。
      return res.json({ code: 202, data: req.query.file, msg: '判断失败' });
    }

   
    const predictions = await model.classify(image).catch(err => {
      return res.json({ code: 202, data: req.query.file, msg: '判断失败' });
    });
    image.dispose(); // 必须显式地管理张量内存(让tf.tentor超出范围才能释放其内存是不够的)。
  
    let balk = [];
    let x = {};
    predictions.forEach(item => {
      switch (item.className) {
        case 'Drawing':
          balk.push({
            className: '绘画',
            probability: (item.probability * 100).toFixed(2) + '%',
            explain: '无害的艺术，或艺术绘画'
          });
          if (x.probability === undefined || item.probability > x.probability) {
            x = {
              className: '绘画',
              probability: (item.probability * 100).toFixed(2) + '%',
              explain: '无害的艺术，或艺术绘画'
            };
          }
          break;
        case 'Hentai':
          balk.push({
            className: '变态',
            probability: (item.probability * 100).toFixed(2) + '%',
            explain: '色情艺术，不适合大多数工作环境'
          });
          if (x.probability === undefined || item.probability > x.probability) {
            x = {
              className: '变态',
              probability: (item.probability * 100).toFixed(2) + '%',
              explain: '色情艺术，不适合大多数工作环境'
            };
          }
          break;
        case 'Neutral':
          balk.push({
            className: '中立',
            probability: (item.probability * 100).toFixed(2) + '%',
            explain: '一般，无害的内容'
          });
          if (x.probability === undefined || item.probability > x.probability) {
            x = {
              className: '中立',
              probability: (item.probability * 100).toFixed(2) + '%',
              explain: '一般，无害的内容'
            };
          }
          break;
        case 'Porn':
          balk.push({
            className: '色情',
            probability: (item.probability * 100).toFixed(2) + '%',
            explain: '不雅的内容和行为，通常涉及生殖器'
          });
          if (x.probability === undefined || item.probability > x.probability) {
            x = {
              className: '色情',
              probability: (item.probability * 100).toFixed(2) + '%',
              explain: '不雅的内容和行为，通常涉及生殖器'
            };
          }
          break;
        case 'Sexy':
          balk.push({
            className: '性感',
            probability: (item.probability * 100).toFixed(2) + '%',
            explain: '不合时宜的挑衅内容'
          });
          if (x.probability === undefined || item.probability > x.probability) {
            x = {
              className: '性感',
              probability: (item.probability * 100).toFixed(2) + '%',
              explain: '不合时宜的挑衅内容'
            };
          }
          break;
      }
    });

    res.json({ code: 200, data: x, msg: balk });
  } else {
    res.json({ code: 201, msg: '请上传网络图片' });
  }
});

module.exports = router;
