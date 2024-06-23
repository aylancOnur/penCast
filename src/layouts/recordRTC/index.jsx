import { useRef } from "react";
import RecordRTC from "recordrtc";

const RecordRTCComponent = () => {
  const videoRef = useRef(null);
  let recorder = null;

  // Kayıt başlatma
  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });
    recorder = new RecordRTC(stream, {
      type: "video",
    });
    recorder.startRecording();
  };

  // Kayıt durdurma
  const stopRecording = async () => {
    if (recorder) {
      recorder.stopRecording(() => {
        const blob = recorder.getBlob();
        const url = URL.createObjectURL(blob);
        videoRef.current.src = url;
      });
    }
  };

  return (
    <div>
      <video ref={videoRef} controls style={{ width: "100%" }}></video>
      <div>
        <button onClick={startRecording}>Kaydı Başlat</button>
        <button onClick={stopRecording}>Kaydı Durdur</button>
      </div>
    </div>
  );
};

export default RecordRTCComponent;
