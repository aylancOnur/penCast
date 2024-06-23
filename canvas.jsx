import { useEffect, useRef, useState } from "react";
import { fabric } from "fabric";
import RecordRTC from "recordrtc";
import question2 from "../../assets/questions/question2.jpeg";

const FabricCanvas = () => {
  const canvasRef = useRef(null);
  const recorderRef = useRef(null);

  const [canvasDimensions, setCanvasDimensions] = useState({
    width: 1920,
    height: 1080,
  });

  useEffect(() => {
    const resizeCanvas = () => {
      const containerWidth = Math.min(1920, window.innerWidth); // Maksimum 1920px genişlikte
      const containerHeight = Math.min(1080, window.innerHeight); // Maksimum 1080px yükseklikte
      const width = containerWidth;
      const height = containerHeight;
      setCanvasDimensions({ width, height });
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    return () => {
      window.removeEventListener("resize", resizeCanvas);
    };
  }, []);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Set canvas size
    const canvasElement = canvasRef.current;
    canvasElement.width = canvasDimensions.width;
    canvasElement.height = canvasDimensions.height;

    const canvas = new fabric.Canvas(canvasRef.current, {
      width: canvasDimensions.width,
      height: canvasDimensions.height,
      backgroundColor: "#ffffff",
    });

    const imageUrl = question2;
    fabric.Image.fromURL(
      imageUrl,
      (img) => {
        if (!img) {
          console.error("Image could not be loaded");
          return;
        }

        const maxWidth = canvas.width * 0.4;
        const maxHeight = canvas.height * 0.9;

        if (img.width > maxWidth || img.height > maxHeight) {
          const scale = Math.min(maxWidth / img.width, maxHeight / img.height);
          img.scale(scale);
        }

        const top = (canvas.height - img.height * img.scaleY) / 2;

        img.set({
          left: (canvas.width - img.width * img.scaleX) / 2,
          top: top,
        });

        canvas.add(img);
        canvas.renderAll();
      },
      {
        crossOrigin: "Anonymous", // Use this if you're loading images from another domain
      }
    );

    const brush = new fabric.PencilBrush(canvas);
    brush.color = "blue";
    brush.width = 5;

    canvas.freeDrawingBrush = brush;
    canvas.isDrawingMode = true;

    return () => {
      canvas.dispose();
    };
  }, [canvasDimensions]);

  const startRecording = async () => {
    try {
      const canvasStream = canvasRef.current.captureStream(30); // 30 FPS

      const audioStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });

      // Combine the canvas and audio streams
      const combinedStream = new MediaStream([
        ...canvasStream.getVideoTracks(),
        ...audioStream.getAudioTracks(),
      ]);

      const recorder = new RecordRTC(combinedStream, {
        type: "video",
        mimeType: "video/webm;codecs=vp9",
        bitsPerSecond: 15000000, // 15 Mbps video bitrate
      });
      recorderRef.current = recorder;
      recorder.startRecording();
      console.log("Recording started");

      // Stop recording when the canvas stream ends (e.g., if the canvas is removed)
      canvasStream.getVideoTracks()[0].addEventListener("ended", () => {
        stopRecording();
      });
    } catch (error) {
      console.error("Ekran veya ses kaydı başlatılamadı: ", error);
    }
  };

  const stopRecording = () => {
    if (recorderRef.current) {
      recorderRef.current.stopRecording(() => {
        const blob = recorderRef.current.getBlob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.style.display = "none";
        a.href = url;
        a.download = "canvas-recording.webm";
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
      });
    } else {
      console.error("Recorder is not initialized");
    }
  };

  return (
    <div>
      <canvas
        ref={canvasRef}
        style={{
          width: canvasDimensions.width,
          height: canvasDimensions.height,
        }}
      />
      <button onClick={startRecording}>Start Recording</button>
      <button onClick={stopRecording}>Stop Recording</button>
    </div>
  );
};

export default FabricCanvas;
