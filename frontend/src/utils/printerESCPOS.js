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

  // Конвертация строки в байты
  textToBytes(text) {
    const encoder = new TextEncoder();
    return Array.from(encoder.encode(text));
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
