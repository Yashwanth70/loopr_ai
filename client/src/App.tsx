import React, { useEffect, useState } from 'react';
import './App.css';
import socketIOClient from "socket.io-client";
import { Button, Slider } from '@material-ui/core';

function App() {
  const [images, setImages] = useState<{ data: string}[]>([]);
  const [sliderValue, setSliderValue] = React.useState<number>(30);
  let endpoint = "http://127.0.0.1:8080";
  let captureEndpoint = "http://127.0.0.1:8080/capture";
  const socket = socketIOClient(endpoint, { transports: ['websocket'] });
  socket.on("ImageProcessed", (imageData: { data: string}) => {
    console.log("Event Received");
    let tempImages = images;
    if(tempImages.length  == 5){
      tempImages.shift();
    }
    tempImages.push(imageData);
    setImages(() => [...tempImages]);
  });

  function startProcessing() {
    let captureEndpointWithFrameRate = captureEndpoint + "?frame_rate=" + sliderValue
    fetch(captureEndpointWithFrameRate)
      .then(response => response.json())
      .then(json => console.log(json))
      .catch(error => console.error(error));
  }

  const updateRange  = (event: React.ChangeEvent<{}>, newValue: number | number[]) => {
    setSliderValue(newValue as number);
  }



  return (
    <div className="App">
      <header className="App-header">
        <h1>Loopr AI Assignment</h1>
        <div className='frameRateStyle'>
          <h3 className='frameRateItemStyle'>Frame Rate </h3>
          <Slider
            aria-label="Frame Rate"
            defaultValue={30}
            value={sliderValue}
            onChange={updateRange}
            step={10}
            marks
            valueLabelDisplay="auto"
            min={10}
            max={100}
            className='frameRateItemStyle'
          />
          <Button variant="contained" onClick={startProcessing} className='frameRateItemStyle'>Start</Button>
          </div>
        <div className='imagesList'>
        {
          images.map((image, index) => {
            return (<div key={index} className='imageDivStyle'>
              {image.data ? <img className="imageStyle" src={`data:image/jpeg;base64,${image.data}`}/>: ''}
            </div>);
          }
          )
        }
        </div>
      </header>
    </div>
  );
}

export default App;
