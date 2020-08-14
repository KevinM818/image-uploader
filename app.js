require('dotenv').config();
// const crypto = require('crypto');
const Jimp = require('jimp');
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const gridfs = require('gridfs-stream');
const streamifier = require('streamifier');
const dateFormat = require('dateformat');
const uniqid = require('uniqid');
// const fs = require('fs');
// const multer = require('multer');
// const GridFsStorage = require('multer-gridfs-storage');

const Label = require('./models/label');

let gfs;
const connection = mongoose.connection;

mongoose.connect(process.env.MONGODB_URI, {useNewUrlParser: true, useUnifiedTopology: true})
connection.once('open', () => {
  gfs = gridfs(connection.db, mongoose.mongo);
});

const app = express();

app.use(cors());
app.use(express.urlencoded({limit: '50mb', extended: true}));
app.use(express.json({limit: '50mb'}));

app.post('/upload', async (req, res) => {
  const base64Data = req.body.img.replace(/^data:image\/png;base64,/, '');
  const buffer = Buffer.from(base64Data, 'base64');
  try {
    const filename = uniqid() + '.png';
    const image = await Jimp.read(buffer);
    image.resize(1200, 900).quality(100);
    const newBuffer = await image.getBufferAsync(Jimp.MIME_PNG);
    const writeStream = gfs.createWriteStream({filename, content_type: Jimp.MIME_PNG});
    streamifier.createReadStream(newBuffer).pipe(writeStream);
    const label = new Label({
      date: dateFormat(new Date(), "dddd, mmmm dS, yyyy, h:MM:ss TT"),
      image: `https://948a0dfe683c.ngrok.io/image/${filename}`
    });
    await label.save();
    res.json({label});
  } catch(e) {
    console.log('Err', e);
    res.status(400).send(e);
  }
});

app.get('/file', (req, res) => {
  gfs.files.find().toArray((err, files) => {
    return res.json(files);
  })
});

app.get('/image/:filename', (req, res) => {
  gfs.files.findOne({filename: req.params.filename}, (err, file) => {
    const readstream = gfs.createReadStream(file.filename);
    readstream.pipe(res);
  })
})

app.listen(5000, () => console.log('Running'));