const express = require('express');


const mongoose = require("mongoose");
const morgan = require("morgan");
const cors = require("cors");
const NodeWebcam = require('node-webcam');
const fs = require('fs');
const cv = require('@u4/opencv4nodejs');
require("dotenv").config();

const Images = require("./models/images")

//app
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);

// specifying parameters for the pictures to be taken
var opts = {
    width: 1280,
    height: 720, 
    quality: 100,
    delay: 5,
    saveShots: true,
    output: "jpeg",
    device: false,
    callbackReturn: "location"
};

//Creates webcam instance
var WebcamWithOpts = NodeWebcam.create( opts );
let socketId = "";

// port
const port = process.env.PORT || 8080;

// mongodb
mongoose.connect(process.env.MONGO_DB_URI, {
    useNewUrlParser: true,
})
.then(() => console.log("database connected successfully."))
.catch((err) => console.log("database connection issue.", err));

// middleware
app.use(morgan("dev"));
app.use(cors())

app.get('/', (req, res) => {
    res.send({ response: "I am alive" }).status(200);
});

let previousPath = "";


//save the images data to mongoDB
async function saveToDB(frame_rate, outputPath){
    try {
        let newImage = new Images({
            frame_rate: frame_rate,
            uploadDate: new Date().getTime(),
            data: fs.readFileSync(outputPath),
            // data: data
        });
        await newImage.save();
    }catch(error) {
        console.log(`DB ERROR: Error saving image to database. Error= ${error.message}`)
    }
}


// capture function that snaps images and saves them
var captureImageShot = (amount, i, name) => {
    // Make sure this returns a real url to an image.
    return new Promise(resolve => {
       var path = `./images/${name}`;
   
       // create folder if and only if it does not exist
       if(!fs.existsSync(path)) {
           fs.mkdirSync(path);
       }

       let currentPath = `./images/${name}/${name}${i}.${opts.output}`;
       let outputPath = `./cv_data/${name}${i}.${opts.output}`;
   
       // capture the image
       WebcamWithOpts.capture(currentPath, async (err, data) => {
           if(!err) {
               console.log('Image created')
           }
           if(i!=1){
            previousPath = `./images/${name}/${name}${i-1}.${opts.output}`;
           }
           if(previousPath != ""){
            let previousImg = await cv.imreadAsync(previousPath);
            let currentImg = await cv.imreadAsync(currentPath);
            let diff = currentImg.absdiff(previousImg);
            // Write out the difference
            await cv.imwriteAsync(outputPath, diff);
            const outputBase64 =  cv.imencode('.jpeg', diff).toString('base64');
            io.to(`${socketId}`).emit("ImageProcessed", {
                "data": outputBase64,
            });
            await saveToDB(amount, outputPath);
           }
           i++;
           if(i <= amount) {
               captureImageShot(amount, i, name);
           }
           resolve('success');
       });
    })
};

app.get('/capture', (req, res) => {
    var frame_rate = req?.query?.frame_rate ? req.query.frame_rate : 30;
    captureImageShot(frame_rate, 1, 'images')
      .then((response) => {
        res.send({ response: "success" }).status(200);
      })
});


io.on('connection', (socket) => {
    console.log(socket.id);
    socketId = socket.id;
    console.log('user connected');
    socket.on('disconnect', function () {
      console.log('user disconnected');
    });
})


server.listen(port, () => {
    console.log(`Now listening on port ${port}`); 
});
    