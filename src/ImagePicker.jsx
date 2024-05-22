// src/ImagePicker.jsx
import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';

function ImagePicker() {
  const [images, setImages] = useState([]);
  const [websocket, setWebSocket] = useState(null);

  const onDrop = useCallback((acceptedFiles) => {
    // Create an array of image URLs for preview
    const imagePreviews = acceptedFiles.map((file) =>
      Object.assign(file, {
        preview: URL.createObjectURL(file),
      })
    );

    // Update the state with the new images
    setImages((prevImages) => [...prevImages, ...imagePreviews]);
  }, []);

  const { getRootProps, getInputProps } = useDropzone({ onDrop, accept: 'image/*' });

  const handleRunClick = () => {
    if (images.length === 0) {
      alert('Please select some images first.');
      return;
    }

    try {
      if (!websocket) {
        const ws = new WebSocket('wss://73.223.189.120:8000/ws');

        ws.onopen = () => {
          console.log('WebSocket connection opened.');
          setWebSocket(ws);

          // Send the initial JSON message with the number of photos
          const initialMessage = JSON.stringify({ num_photos: images.length });
          ws.send(initialMessage);

          // Send each image as binary data
          images.forEach((image) => {
            const reader = new FileReader();
            reader.onload = (event) => {
              const binaryData = event.target.result;
              ws.send(binaryData);
            };
            reader.readAsArrayBuffer(image);
          });
        };

        ws.onmessage = (message) => {
          console.log('Received:', message.data);
        };

        ws.onclose = () => {
          console.log('WebSocket connection closed.');
          setWebSocket(null);
        };

        ws.onerror = (error) => {
          console.error('WebSocket error:', error);
        };
      } else {
        // Send the initial JSON message with the number of photos
        const initialMessage = JSON.stringify({ num_photos: images.length });
        websocket.send(initialMessage);

        // Send each image as binary data
        images.forEach((image) => {
          const reader = new FileReader();
          reader.onload = (event) => {
            const binaryData = event.target.result;
            websocket.send(binaryData);
          };
          reader.readAsArrayBuffer(image);
        });
      }
    } catch (error) {
      console.error('Failed to establish WebSocket connection:', error);
    }
  };

  return (
    <div>
      <div {...getRootProps()} style={dropzoneStyles}>
        <input {...getInputProps()} />
        <p>Drag & drop images here, or click to select files</p>
      </div>
      <div style={previewContainerStyles}>
        {images.map((image, index) => (
          <div key={index} style={previewStyles}>
            <img src={image.preview} alt={`preview ${index}`} style={imageStyles} />
          </div>
        ))}
      </div>
      <button onClick={handleRunClick} style={buttonStyles}>
        RUN
      </button>
    </div>
  );
}

const dropzoneStyles = {
  border: '2px dashed #eeeeee',
  borderRadius: '4px',
  padding: '20px',
  textAlign: 'center',
  cursor: 'pointer',
  marginBottom: '20px',
};

const previewContainerStyles = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '10px',
};

const previewStyles = {
  width: '100px',
  height: '100px',
  overflow: 'hidden',
};

const imageStyles = {
  width: '100%',
  height: '100%',
  objectFit: 'cover',
};

const buttonStyles = {
  padding: '10px 20px',
  fontSize: '16px',
  cursor: 'pointer',
};

export default ImagePicker;
