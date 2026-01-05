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

    // Международный набор символов
    INTL_CHARSET_RUSSIA: [0x1B, 0x52, 0x07], // ESC R 7 - Россия

    // Кодовые страницы для кириллицы
    CHARSET_CP866: [0x1B, 0x74, 0x11], // ESC t 17 - CP866 (кириллица DOS)
    CHARSET_CP1251: [0x1B, 0x74, 0x12], // ESC t 18 - CP1251 (кириллица Windows)
    CHARSET_CP1252: [0x1B, 0x74, 0x10], // ESC t 16 - CP1252 (попытка)
    CHARSET_PAGE17: [0x1B, 0x74, 0x11], // ESC t 17 - альтернатива
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

  // Конвертация строки в байты (CP866 для кириллицы)
  textToBytes(text) {
    // Таблица перекодировки кириллицы UTF-8 → CP866 (DOS кириллица)
    // Это стандартная кодировка для термопринтеров в России
    const cp866Map = {
      // Заглавные буквы А-П (0x80-0x8F)
      'А': 0x80, 'Б': 0x81, 'В': 0x82, 'Г': 0x83, 'Д': 0x84, 'Е': 0x85, 'Ж': 0x86, 'З': 0x87,
      'И': 0x88, 'Й': 0x89, 'К': 0x8A, 'Л': 0x8B, 'М': 0x8C, 'Н': 0x8D, 'О': 0x8E, 'П': 0x8F,
      // Заглавные буквы Р-Я (0x90-0x9F)
      'Р': 0x90, 'С': 0x91, 'Т': 0x92, 'У': 0x93, 'Ф': 0x94, 'Х': 0x95, 'Ц': 0x96, 'Ч': 0x97,
      'Ш': 0x98, 'Щ': 0x99, 'Ъ': 0x9A, 'Ы': 0x9B, 'Ь': 0x9C, 'Э': 0x9D, 'Ю': 0x9E, 'Я': 0x9F,
      // Строчные буквы а-п (0xA0-0xAF)
      'а': 0xA0, 'б': 0xA1, 'в': 0xA2, 'г': 0xA3, 'д': 0xA4, 'е': 0xA5, 'ж': 0xA6, 'з': 0xA7,
      'и': 0xA8, 'й': 0xA9, 'к': 0xAA, 'л': 0xAB, 'м': 0xAC, 'н': 0xAD, 'о': 0xAE, 'п': 0xAF,
      // Строчные буквы р-я (0xE0-0xEF)
      'р': 0xE0, 'с': 0xE1, 'т': 0xE2, 'у': 0xE3, 'ф': 0xE4, 'х': 0xE5, 'ц': 0xE6, 'ч': 0xE7,
      'ш': 0xE8, 'щ': 0xE9, 'ъ': 0xEA, 'ы': 0xEB, 'ь': 0xEC, 'э': 0xED, 'ю': 0xEE, 'я': 0xEF,
      // Ё и ё
      'Ё': 0xF0, 'ё': 0xF1
    };

    const bytes = [];
    for (let i = 0; i < text.length; i++) {
      const char = text[i];

      // Если кириллица - используем CP866
      if (cp866Map[char]) {
        bytes.push(cp866Map[char]);
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
