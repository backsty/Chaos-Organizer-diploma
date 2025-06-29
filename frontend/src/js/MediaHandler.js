import Geolocation from "./Geolocation";
import Timer from "./Timer";

export default class MediaHandler {
  constructor(container, options) {
    this.container = container;
    this.ws = options.ws;
    this.activeChatID = options.dialogID;
    this.userID = options.user;
    this.baseURL = options.url;
    this.mediaBtnsBox = this.container.querySelector('.footer-controls__media');
    this.mediaRecordBox = this.container.querySelector('.footer-controls__media.record');
    this.popup = this.container.querySelector('.app__popup');
    this.cancellation = false;
    this.timer = new Timer(document.querySelector('.record-timer'));
    this.groupList = this.container.querySelector('.chats__group-list');
    this.previewRecord = this.container.querySelector('.messages__preview-record');
    this.previewModal = this.previewRecord.querySelector('.preview-record__modal');
    this.previewVideo = this.previewRecord.querySelector('.preview-record__video');
    this.sendBtn = this.previewRecord.querySelector('.preview-record__btn--send');
    this.closeBtn = this.previewRecord.querySelector('.preview-record__btn--close');
    this.timerInterval = null;

    this.onMediaBtnsClick = this.onMediaBtnsClick.bind(this);
    this.onMediaRecordClick = this.onMediaRecordClick.bind(this);
    this.startRecord = this.startRecord.bind(this);
    this.dataavailable = this.dataavailable.bind(this);
    this.stopRecord = this.stopRecord.bind(this);
    this.onSendVideo = this.onSendVideo.bind(this);
    this.onClosePreview = this.onClosePreview.bind(this);

    this.mediaBtnsBox.addEventListener('click', this.onMediaBtnsClick);
    this.mediaRecordBox.addEventListener('click', this.onMediaRecordClick);

    if (this.sendBtn) this.sendBtn.addEventListener('click', this.onSendVideo);
    if (this.closeBtn) this.closeBtn.addEventListener('click', this.onClosePreview);
  }

  checkDialog() {
    let dialog;
    if (this.groupList.querySelector('.chat.active')) {
      dialog = 'group'
    } else {
      dialog = 'personal'
    }
    return dialog;
  }

  showPopup(text) {
    this.popup.classList.remove('d_none');
    this.popup.querySelector('.app-popup__text').textContent = text;
  }

  dataavailable(evt) {
    if (!this.cancellation) {
      this.chunks.push(evt.data);
    }
  }

  stopRecord() {
    const type = this.recorder.mimeType;
    if (!this.cancellation) {
      let ext = 'webm';
      if (type === 'audio/webm;codecs=opus' || type === 'audio/webm') ext = 'webm';
      else if (type === 'audio/ogg' || type === 'audio/ogg;codecs=opus') ext = 'ogg';
      else if (type === 'audio/mpeg') ext = 'mp3';

      this.file = new File(this.chunks, `record.${ext}`, { type });
      this.mediaRecordBox.classList.add('d_none');
      this.mediaBtnsBox.classList.remove('d_none');
      this.timer.resetTimer();
      this.attachFile();
    }
  }

  async attachFile() {
    const result = await this.sendingFile();
    if (result.success) {
      const data = {
        type: 'messages',
        data: {
          dialog: this.checkDialog(),
          dialogID: this.activeChatID,
        }
      }
      this.ws.send(JSON.stringify(data));
    }
  }

  async sendingFile() {
    const formData = new FormData();
    const dataEncrypt = {
      encrypt: false,
    }
    formData.append('user', this.userID);
    formData.append('dialog', this.checkDialog());
    formData.append('dialogID', this.activeChatID);
    formData.append('file', this.file);
    formData.append('description', '');
    formData.append('encryption', JSON.stringify(dataEncrypt));
    formData.append('password', null)
    const request = await fetch(`${this.baseURL}/files`, {
      method: 'POST',
      body: formData,
    });
    const result = await request.json();
    return result;
  }

  startRecord() {
    this.mediaBtnsBox.classList.add('d_none');
    this.mediaRecordBox.classList.remove('d_none');
    this.timer.startTimer();
  }

  onMediaRecordClick(evt) {
    if (evt.target.closest('.btn-wrap')?.querySelector('.button.close')) {
      this.cancellation = true;
      this.mediaRecordBox.classList.add('d_none');
      this.mediaBtnsBox.classList.remove('d_none');
      this.recorder.stop();
      this.stream.getTracks().forEach((track) => track.stop());
      this.timer.resetTimer();
      if (this.contentType === 'video') {
        this.closePreview();
      }
    }
    if (evt.target.closest('.btn-wrap')?.querySelector('.button.confirm')) {
      this.recorder.stop();
      this.stream.getTracks().forEach((track) => track.stop());
      if (this.contentType === 'video') {
        this.closePreview();
      }
    }
  }

  async onMicroBtnClick() {
    this.contentType = 'audio';
    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: false,
    });
  }

  onGeoBtnClick() {
    const promise = Geolocation.getLocation(this.showPopup)
    promise.then((data) => {
      if (data) {
        const msg = {
          type: 'text_message',
          data: {
            user: this.userID,
            dialog: this.checkDialog(),
            dialogID: this.activeChatID,
            message: data,
          },
        }
        this.ws.send(JSON.stringify(msg));
      }
    })
  }

  async onVideoBtnClick() {
    this.contentType = 'video';
    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: true,
    });
    this.previewRecord.classList.remove('d_none');
    this.previewVideo.srcObject = this.stream;
    this.previewVideo.play();

    // Используем отдельный таймер для видео
    this.videoTimerSeconds = 0;
    this.previewRecord.querySelector('.preview-record__timer').textContent = '00:00';
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.timerInterval = setInterval(() => {
      this.videoTimerSeconds++;
      const min = String(Math.floor(this.videoTimerSeconds / 60)).padStart(2, '0');
      const sec = String(this.videoTimerSeconds % 60).padStart(2, '0');
      this.previewRecord.querySelector('.preview-record__timer').textContent = `${min}:${sec}`;
    }, 1000);

    this.chunks = [];
    this.recorder = new MediaRecorder(this.stream);
    this.recorder.addEventListener('dataavailable', (e) => this.chunks.push(e.data));
    this.recorder.addEventListener('stop', () => this.onVideoRecordStop());
    this.recorder.start();
  }

  async onSendVideo(evt) {
    if (evt) evt.preventDefault();
    // Флаг, чтобы не отправлять при закрытии
    this._sendVideo = true;
    if (this.recorder && this.recorder.state !== 'inactive') {
      this.recorder.stop();
    }
  }

  async onVideoRecordStop() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
    }
    // --- Остановить таймер видео ---
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    this.videoTimerSeconds = 0;
    this.previewRecord.querySelector('.preview-record__timer').textContent = '00:00';

    if (this._sendVideo) {
      const videoBlob = new Blob(this.chunks, { type: 'video/webm' });
      const file = new File([videoBlob], `video_${Date.now()}.webm`, { type: 'video/webm' });

      // Отправка файла на сервер
      const formData = new FormData();
      formData.append('user', this.userID);
      formData.append('dialog', this.checkDialog());
      formData.append('dialogID', this.activeChatID);
      formData.append('file', file);
      formData.append('description', '');
      formData.append('encryption', JSON.stringify({ encrypt: false }));
      formData.append('password', null);

      await fetch(`${this.baseURL}/files`, {
        method: 'POST',
        body: formData,
      });

      // Обновить сообщения
      this.ws.send(JSON.stringify({
        type: 'messages',
        data: {
          dialog: this.checkDialog(),
          dialogID: this.activeChatID,
        }
      }));
    }
    this._sendVideo = false;
    this.closePreview();
  }

  onClosePreview(evt) {
    if (evt) evt.preventDefault();
    this._sendVideo = false;
    if (this.recorder && this.recorder.state !== 'inactive') {
      this.recorder.stop();
    }
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
    }
    // --- Остановить таймер видео ---
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    this.videoTimerSeconds = 0;
    this.previewRecord.querySelector('.preview-record__timer').textContent = '00:00';
    this.previewRecord.classList.add('d_none');
    if (this.previewVideo) this.previewVideo.srcObject = null;
    this.chunks = [];
  }

  closePreview() {
    this.previewRecord.classList.add('d_none');
    if (this.previewVideo) this.previewVideo.srcObject = null;
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    this.timer.resetTimer();
    this.chunks = [];
  }

  async onMediaBtnsClick(evt) {
    if (!navigator.mediaDevices) {
      this.showPopup('Ваш браузер не поддерживает API MediaDevices');
      return;
    }
    try {
      if (this.cancellation) {
        this.cancellation = false;
      }
      if (evt.target.closest('.btn-wrap')?.querySelector('.button.micro')) {
        await this.onMicroBtnClick();
      }
      if (evt.target.closest('.btn-wrap')?.querySelector('.button.video')) {
        await this.onVideoBtnClick();
        return; // чтобы не запускать аудиозапись для видео
      }
      if (evt.target.closest('.btn-wrap')?.querySelector('.button.geo')) {
        this.onGeoBtnClick();
        return;
      }
      if (!window.MediaRecorder) {
        this.showPopup('Ваш браузер не поддерживает API MediaRecorder');
        return;
      }
      this.recorder = new MediaRecorder(this.stream);
      this.chunks = [];
      this.recorder.addEventListener('start', this.startRecord);
      this.recorder.addEventListener('dataavailable', this.dataavailable);
      this.recorder.addEventListener('stop', this.stopRecord);
      this.recorder.start();
    } catch (err) {
      this.showPopup('Настройки вашего браузера запрещают доступ к микрофону или видеокамере');
      console.error(err);
    }
  }
}