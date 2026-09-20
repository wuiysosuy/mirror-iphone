document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const btnTriggerAirPlay = document.getElementById('btn-trigger-airplay');
  const airplayHiddenVideo = document.getElementById('airplay-hidden-video');

  const btnToggleCamera = document.getElementById('btn-toggle-camera');
  const txtToggleCamera = document.getElementById('txt-toggle-camera');
  const cameraPreviewBox = document.getElementById('camera-preview-box');
  const cameraVideo = document.getElementById('camera-video');
  const btnSwitchCamera = document.getElementById('btn-switch-camera');

  const filePhotoInput = document.getElementById('file-photo-input');

  // WebSocket Connection to PC
  let ws = null;
  function connectWebSocket() {
    const wsUrl = `ws://${location.host}`;
    ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('Đã kết nối tới PC qua WebSocket!');
    };

    ws.onclose = () => {
      console.log('Mất kết nối WebSocket, đang thử lại sau 2s...');
      setTimeout(connectWebSocket, 2000);
    };
  }
  connectWebSocket();

  // 1. AirPlay Picker Trigger
  // Chuẩn bị một video nhỏ để kích hoạt AirPlay Picker của Safari iOS
  airplayHiddenVideo.src = 'data:video/mp4;base64,AAAAHGZ0eXBtcDQyAAAAAW1wNDJpc29tYXZjMQAAADpmcmVlAAAAAG1kYXQAAAFnAAACARAAAAGmAAAAAA==';

  btnTriggerAirPlay.addEventListener('click', () => {
    if (airplayHiddenVideo.webkitShowPlaybackTargetPicker) {
      airplayHiddenVideo.webkitShowPlaybackTargetPicker();
    } else {
      alert('Để phản chiếu toàn màn hình, bạn hãy vuốt mở Trung tâm điều khiển (Control Center) trên iPhone và chọn biểu tượng "Phản chiếu màn hình" nhé!');
    }
  });

  // 2. Camera Streaming
  let cameraStream = null;
  let isStreaming = false;
  let facingMode = 'environment'; // 'user' hoặc 'environment'
  let streamInterval = null;
  const offscreenCanvas = document.createElement('canvas');
  const offscreenCtx = offscreenCanvas.getContext('2d');

  async function startCamera() {
    try {
      if (cameraStream) {
        cameraStream.getTracks().forEach(t => t.stop());
      }

      cameraStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 640 },
          height: { ideal: 480 }
        },
        audio: false
      });

      cameraVideo.srcObject = cameraStream;
      cameraPreviewBox.style.display = 'block';
      txtToggleCamera.textContent = 'Dừng Chiếu Camera';
      btnToggleCamera.style.background = '#475569';
      isStreaming = true;

      // Chu kỳ gửi khung hình lên PC qua WebSocket
      offscreenCanvas.width = 480;
      offscreenCanvas.height = 360;

      streamInterval = setInterval(() => {
        if (!isStreaming || !ws || ws.readyState !== WebSocket.OPEN) return;

        offscreenCtx.drawImage(cameraVideo, 0, 0, offscreenCanvas.width, offscreenCanvas.height);
        const frameData = offscreenCanvas.toDataURL('image/jpeg', 0.6);
        ws.send(JSON.stringify({
          type: 'camera_frame',
          image: frameData
        }));
      }, 70); // ~15 FPS mượt mà và nhẹ mạng

    } catch (err) {
      alert('Không thể mở Camera: ' + err.message);
      stopCamera();
    }
  }

  function stopCamera() {
    isStreaming = false;
    if (streamInterval) {
      clearInterval(streamInterval);
      streamInterval = null;
    }
    if (cameraStream) {
      cameraStream.getTracks().forEach(t => t.stop());
      cameraStream = null;
    }
    cameraPreviewBox.style.display = 'none';
    txtToggleCamera.textContent = 'Bật Chiếu Camera Lên PC';
    btnToggleCamera.style.background = 'linear-gradient(135deg, #e11d48, #be123c)';
  }

  btnToggleCamera.addEventListener('click', () => {
    if (isStreaming) {
      stopCamera();
    } else {
      startCamera();
    }
  });

  btnSwitchCamera.addEventListener('click', (e) => {
    e.stopPropagation();
    facingMode = facingMode === 'environment' ? 'user' : 'environment';
    startCamera();
  });

  // 3. Photo Cast
  filePhotoInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64Data = event.target.result;
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'photo_cast',
          image: base64Data
        }));
        alert('Đã gửi ảnh lên màn hình máy tính!');
      } else {
        alert('Chưa kết nối được với máy tính.');
      }
    };
    reader.readAsDataURL(file);
  });
});
