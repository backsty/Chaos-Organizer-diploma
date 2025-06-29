import Templates from "./Templates";

export default class EmojiHandler {
  constructor(container, url) {
    this.container = container;
    this.baseURL = url;
    this.savedRange = null;
    this.emojiPopup = this.container.querySelector('.messages__emoji');
    this.emojiList = this.container.querySelector('.emoji-list');
    this.emojiBtn = this.container.querySelector('.button.smile').closest('.btn-wrap');
    this.mainInput = this.container.querySelector('.footer-controls__input');
    this.messagesContent = this.container.querySelector('.messages__content');

    this.onEmojiListClick = this.onEmojiListClick.bind(this);
    this.onEmojiBtnClick = this.onEmojiBtnClick.bind(this);
    this.onDocumentClick = this.onDocumentClick.bind(this);

    this.emojiList.addEventListener('click', this.onEmojiListClick);
    this.emojiBtn.addEventListener('click', this.onEmojiBtnClick);

    this.mainInput.addEventListener('keyup', this.saveRange.bind(this));
    this.mainInput.addEventListener('mouseup', this.saveRange.bind(this));
    this.mainInput.addEventListener('blur', this.saveRange.bind(this));
  }

  saveRange() {
    const sel = window.getSelection();
    if (sel.rangeCount > 0 && this.mainInput.contains(sel.anchorNode)) {
      this.savedRange = sel.getRangeAt(0).cloneRange();
    }
  }

  onEmojiListClick(evt) {
    if (evt.target.classList.contains('messages-emoji__item')) {
      const emoji = evt.target.textContent;
      this.insertAtCursor(emoji);
    }
  }

  async onEmojiBtnClick() {
    if (this.emojiList.innerHTML === '') {
      try {
        const request = await fetch(`${this.baseURL}/emoji`);
        this.emojiResult = await request.json();
      } catch (e) {
        this.emojiResult = null;
      }
    }
    if (this.emojiResult && this.emojiResult.success) {
      this.drawEmoji(this.emojiResult.data);
    }
    // Показываем/скрываем popup
    const isOpen = this.emojiPopup.classList.toggle('d_none');
    this.messagesContent.classList.toggle('emoji');
    this.scrollToBottom();

    // Добавляем/удаляем обработчик клика по документу
    if (!isOpen) {
      document.addEventListener('mousedown', this.onDocumentClick);
    } else {
      document.removeEventListener('mousedown', this.onDocumentClick);
    }
  }

  onDocumentClick(evt) {
    // Если клик вне области эмодзи и не по кнопке смайлика
    if (
      !this.emojiPopup.contains(evt.target) &&
      !this.emojiBtn.contains(evt.target)
    ) {
      this.emojiPopup.classList.add('d_none');
      this.messagesContent.classList.remove('emoji');
      document.removeEventListener('mousedown', this.onDocumentClick);
    }
  }

  insertAtCursor(emoji) {
    this.mainInput.focus();
    const sel = window.getSelection();

    // Восстанавливаем сохранённый range, если он есть
    if (this.savedRange) {
      sel.removeAllRanges();
      sel.addRange(this.savedRange);
    }

    // Проверяем, что курсор внутри mainInput
    let isInInput = false;
    if (sel.rangeCount) {
      let node = sel.anchorNode;
      while (node) {
        if (node === this.mainInput) {
          isInInput = true;
          break;
        }
        node = node.parentNode;
      }
    }

    // Если курсор не в mainInput — ставим в конец
    if (!isInInput) {
      const range = document.createRange();
      range.selectNodeContents(this.mainInput);
      range.collapse(false);
      sel.removeAllRanges();
      sel.addRange(range);
    }

    // Вставляем эмодзи
    if (sel.rangeCount) {
      const range = sel.getRangeAt(0);
      range.deleteContents();
      const textNode = document.createTextNode(emoji);
      range.insertNode(textNode);
      // Перемещаем курсор после эмодзи
      range.setStartAfter(textNode);
      range.collapse(true);
      sel.removeAllRanges();
      sel.addRange(range);
      // Сохраняем новую позицию курсора
      this.savedRange = range.cloneRange();
    }
  }

  drawEmoji(data) {
    this.emojiList.innerHTML = '';
    data.forEach((emoji) => {
      this.emojiList.insertAdjacentHTML('beforeend', Templates.emojiMarkup(emoji));
    })
  }

  scrollToBottom() {
    this.messagesContent.scrollTop = this.messagesContent.scrollHeight;
  }
}