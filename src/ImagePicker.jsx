// src/ImagePicker.jsx
import React, { useCallback, useEffect, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import backgroundImage from './images/background.png'; // Adjust the path to your background image

function ImagePicker() {
  const [images, setImages] = useState([]);
  const [websocket, setWebSocket] = useState(null);

  const onDrop = useCallback((acceptedFiles) => {
    const imagePreviews = acceptedFiles.map((file) =>
      Object.assign(file, {
        preview: URL.createObjectURL(file),
      })
    );
    setImages((prevImages) => [...prevImages, ...imagePreviews]);
  }, []);

  useEffect(() => {
    // Clean up the object URLs when component unmounts
    return () => {
      images.forEach((image) => URL.revokeObjectURL(image.preview));
    };
  }, [images]);

  const { getRootProps, getInputProps } = useDropzone({ onDrop, accept: 'image/*' });

  const handleRunClick = () => {
    if (images.length === 0) {
      alert('Please select some images first.');
      return;
    }

    try {
      const ws = websocket || new WebSocket('wss://73.223.189.120:8000/ws');

      ws.onopen = () => {
        console.log('WebSocket connection opened.');
        setWebSocket(ws);

        const initialMessage = JSON.stringify({ num_photos: images.length });
        ws.send(initialMessage);

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
        alert('WebSocket error occurred. Please try again.');
      };

      if (!websocket) {
        setWebSocket(ws);
      }
    } catch (error) {
      console.error('Failed to establish WebSocket connection:', error);
      alert('Failed to establish WebSocket connection. Please try again.');
    }
  };

  return (
    <div style={containerStyles}>
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

const containerStyles = {
  backgroundImage: `url(${backgroundImage})`,
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  backgroundRepeat: 'no-repeat',
  width: '100vw',
  height: '100vh',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
};

const dropzoneStyles = {
  border: '2px dashed #eeeeee',
  borderRadius: '4px',
  padding: '20px',
  textAlign: 'center',
  cursor: 'pointer',
  marginBottom: '20px',
  backgroundColor: 'rgba(255, 255, 255, 0.8)',
};

const previewContainerStyles = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '10px',
  justifyContent: 'center',
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
  backgroundColor: '#007BFF',
  color: '#FFF',
  border: 'none',
  borderRadius: '4px',
};

export default ImagePicker;
