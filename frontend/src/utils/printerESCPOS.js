// ESC/POS команды для термопринтеров Xprinter
// Поддержка: XP-T80Q (чеки) и XP-365B (этикетки)

class ESCPOSPrinter {
  constructor(printerIP) {
    this.printerIP = printerIP;
    this.port = 9100; // Стандартный порт для принтеров ESC/POS
  }

  // ESC/POS команды
  static commands = {
    INIT: [0x1B, 0x40], // Инициализация
    LINE_FEED: [0x0A], // Перевод строки
    CUT_PAPER: [0x1D, 0x56, 0x00], // Обрезка бумаги

    // Кодовые страницы для кириллицы
    CHARSET_CP866: [0x1B, 0x74, 0x11], // ESC t 17 - CP866 (кириллица DOS)
    CHARSET_CP1251: [0x1B, 0x74, 0x12], // ESC t 18 - CP1251 (кириллица Windows)
    CHARSET_UTF8: [0x1B, 0x74, 0xFF], // Попытка UTF-8

    // Выравнивание
    ALIGN_LEFT: [0x1B, 0x61, 0x00],
    ALIGN_CENTER: [0x1B, 0x61, 0x01],
    ALIGN_RIGHT: [0x1B, 0x61, 0x02],

    // Размер текста
    NORMAL: [0x1B, 0x21, 0x00],
    DOUBLE_HEIGHT: [0x1B, 0x21, 0x10],
    DOUBLE_WIDTH: [0x1B, 0x21, 0x20],
    DOUBLE_SIZE: [0x1B, 0x21, 0x30],

    // Стиль
    BOLD_ON: [0x1B, 0x45, 0x01],
    BOLD_OFF: [0x1B, 0x45, 0x00],
    UNDERLINE_ON: [0x1B, 0x2D, 0x01],
    UNDERLINE_OFF: [0x1B, 0x2D, 0x00],

    // Штрих-код
    BARCODE_HEIGHT: [0x1D, 0x68, 0x50], // Высота 80 пикселей
    BARCODE_WIDTH: [0x1D, 0x77, 0x02], // Ширина средняя
    BARCODE_TEXT_BELOW: [0x1D, 0x48, 0x02], // Текст под штрих-кодом
    BARCODE_CODE39: [0x1D, 0x6B, 0x04], // CODE39
  };

  // Конвертация строки в байты (CP1251 для кириллицы)
  textToBytes(text) {
    // Таблица перекодировки кириллицы UTF-8 → CP1251 (Windows-1251)
    const cp1251Map = {
      // Заглавные буквы А-Я (0xC0-0xDF)
      'А': 0xC0, 'Б': 0xC1, 'В': 0xC2, 'Г': 0xC3, 'Д': 0xC4, 'Е': 0xC5, 'Ж': 0xC6, 'З': 0xC7,
      'И': 0xC8, 'Й': 0xC9, 'К': 0xCA, 'Л': 0xCB, 'М': 0xCC, 'Н': 0xCD, 'О': 0xCE, 'П': 0xCF,
      'Р': 0xD0, 'С': 0xD1, 'Т': 0xD2, 'У': 0xD3, 'Ф': 0xD4, 'Х': 0xD5, 'Ц': 0xD6, 'Ч': 0xD7,
      'Ш': 0xD8, 'Щ': 0xD9, 'Ъ': 0xDA, 'Ы': 0xDB, 'Ь': 0xDC, 'Э': 0xDD, 'Ю': 0xDE, 'Я': 0xDF,
      // Строчные буквы а-я (0xE0-0xFF)
      'а': 0xE0, 'б': 0xE1, 'в': 0xE2, 'г': 0xE3, 'д': 0xE4, 'е': 0xE5, 'ж': 0xE6, 'з': 0xE7,
      'и': 0xE8, 'й': 0xE9, 'к': 0xEA, 'л': 0xEB, 'м': 0xEC, 'н': 0xED, 'о': 0xEE, 'п': 0xEF,
      'р': 0xF0, 'с': 0xF1, 'т': 0xF2, 'у': 0xF3, 'ф': 0xF4, 'х': 0xF5, 'ц': 0xF6, 'ч': 0xF7,
      'ш': 0xF8, 'щ': 0xF9, 'ъ': 0xFA, 'ы': 0xFB, 'ь': 0xFC, 'э': 0xFD, 'ю': 0xFE, 'я': 0xFF,
      // Ё и ё
      'Ё': 0xA8, 'ё': 0xB8
    };

    const bytes = [];
    for (let i = 0; i < text.length; i++) {
      const char = text[i];

      // Если кириллица - используем CP1251
      if (cp1251Map[char]) {
        bytes.push(cp1251Map[char]);
      }
      // Иначе - стандартный ASCII (латиница, цифры, символы)
      else {
        bytes.push(char.charCodeAt(0));
      }
    }

    return bytes;
  }

  // Создание команды печати
  buildCommand(commands) {
    return new Uint8Array(commands.flat());
  }

  // Отправка команды на принтер
  async print(commandArray) {
    try {
      const url = `http://${this.printerIP}:${this.port}/`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/octet-stream',
        },
        body: this.buildCommand(commandArray),
        mode: 'no-cors', // Для локальных принтеров
      });

      return { success: true };
    } catch (error) {
      console.error('Ошибка печати:', error);
      return { success: false, error: error.message };
    }
  }

  // Печать текста
  printText(text, options = {}) {
    const commands = [];

    // Выравнивание
    if (options.align === 'center') {
      commands.push(ESCPOSPrinter.commands.ALIGN_CENTER);
    } else if (options.align === 'right') {
      commands.push(ESCPOSPrinter.commands.ALIGN_RIGHT);
    } else {
      commands.push(ESCPOSPrinter.commands.ALIGN_LEFT);
    }

    // Размер
    if (options.size === 'double') {
      commands.push(ESCPOSPrinter.commands.DOUBLE_SIZE);
    } else if (options.size === 'wide') {
      commands.push(ESCPOSPrinter.commands.DOUBLE_WIDTH);
    } else if (options.size === 'tall') {
      commands.push(ESCPOSPrinter.commands.DOUBLE_HEIGHT);
    } else {
      commands.push(ESCPOSPrinter.commands.NORMAL);
    }

    // Стиль
    if (options.bold) {
      commands.push(ESCPOSPrinter.commands.BOLD_ON);
    }
    if (options.underline) {
      commands.push(ESCPOSPrinter.commands.UNDERLINE_ON);
    }

    // Текст
    commands.push(this.textToBytes(text));
    commands.push(ESCPOSPrinter.commands.LINE_FEED);

    // Сброс стилей
    if (options.bold) {
      commands.push(ESCPOSPrinter.commands.BOLD_OFF);
    }
    if (options.underline) {
      commands.push(ESCPOSPrinter.commands.UNDERLINE_OFF);
    }

    return commands;
  }

  // Печать разделителя
  printSeparator(char = '-', length = 32) {
    return this.printText(char.repeat(length), { align: 'center' });
  }

  // Печать пустой строки
  printEmptyLine() {
    return [ESCPOSPrinter.commands.LINE_FEED];
  }

  // Печать штрих-кода
  printBarcode(code) {
    const commands = [];
    commands.push(ESCPOSPrinter.commands.BARCODE_HEIGHT);
    commands.push(ESCPOSPrinter.commands.BARCODE_WIDTH);
    commands.push(ESCPOSPrinter.commands.BARCODE_TEXT_BELOW);
    commands.push(ESCPOSPrinter.commands.BARCODE_CODE39);
    commands.push(this.textToBytes(code));
    commands.push([0x00]); // Терминатор
    return commands;
  }
}

export default ESCPOSPrinter;
