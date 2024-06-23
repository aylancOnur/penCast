import { useEffect, useRef, useState } from "react";
import { fabric } from "fabric";
import RecordRTC from "recordrtc";
import question2 from "../../assets/questions/question2.jpeg";

const FabricCanvas = () => {
  const canvasRef = useRef(null);
  const offscreenCanvasRef = useRef(null);
  const recorderRef = useRef(null);

  const [canvasDimensions, setCanvasDimensions] = useState({
    width: 1920,
    height: 1080,
  });

  useEffect(() => {
    const resizeCanvas = () => {
      const containerWidth = Math.min(1920, window.innerWidth);
      const containerHeight = Math.min(1080, window.innerHeight);
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

    const canvasElement = canvasRef.current;
    canvasElement.width = canvasDimensions.width;
    canvasElement.height = canvasDimensions.height;
    canvasElement.style.width = `${canvasDimensions.width}px`;
    canvasElement.style.height = `${canvasDimensions.height}px`;

    const offscreenCanvas = document.createElement("canvas");
    offscreenCanvas.width = canvasDimensions.width * 2;
    offscreenCanvas.height = canvasDimensions.height * 2;
    offscreenCanvasRef.current = offscreenCanvas;

    const canvas = new fabric.Canvas(canvasElement, {
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
        canvas.renderAll(); // ?
      },
      { crossOrigin: "Anonymous" }
    );

    const brush = new fabric.PencilBrush(canvas);
    brush.color = "blue";
    brush.width = 5;

    canvas.freeDrawingBrush = brush;
    canvas.isDrawingMode = true;

    const updateOffscreenCanvas = () => {
      console.log("updateOffscreenCanvas");
      const ctx = offscreenCanvas.getContext("2d");
      ctx.clearRect(0, 0, offscreenCanvas.width, offscreenCanvas.height);
      ctx.drawImage(canvasElement, 0, 0);
      ctx.drawImage(canvas.upperCanvasEl, 0, 0);
    };

    canvas.on("mouse:move", updateOffscreenCanvas);

    return () => {
      canvas.dispose();
    };
  }, [canvasDimensions]);

  const startRecording = async () => {
    try {
      const canvasStream = offscreenCanvasRef.current.captureStream(30);

      const audioStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });

      const combinedStream = new MediaStream([
        ...canvasStream.getVideoTracks(),
        ...audioStream.getAudioTracks(),
      ]);

      const recorder = new RecordRTC(combinedStream, {
        type: "video",
        mimeType: "video/webm;codecs=vp9",
        bitsPerSecond: 15000000,
      });
      recorderRef.current = recorder;
      recorder.startRecording();
      console.log("Recording started");

      canvasStream.getVideoTracks()[0].addEventListener("ended", stopRecording);
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
