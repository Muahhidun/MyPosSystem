// Печать чеков на Xprinter XP-T80Q (80mm)

import ESCPOSPrinter from './printerESCPOS.js';

class ReceiptPrinter extends ESCPOSPrinter {
  /**
   * Печать чека для клиента
   * @param {Object} order - Данные заказа
   * @param {Object} settings - Настройки (название заведения, адрес и т.д.)
   */
  async printReceipt(order, settings = {}) {
    const commands = this.buildReceiptCommands(order, settings);
    return await this.print(commands);
  }

  /**
   * Формирование команд для печати чека (для RawBT и сетевой печати)
   * @param {Object} order - Данные заказа
   * @param {Object} settings - Настройки (название заведения, адрес и т.д.)
   * @returns {Array} Массив ESC/POS команд
   */
  buildReceiptCommands(order, settings = {}) {
    const commands = [];

    // Инициализация
    commands.push(ESCPOSPrinter.commands.INIT);

    // Для RawBT используем UTF-8, не нужны команды кодировки
    // Для сетевой печати — CP866
    if (!this.useRawBT) {
      // Установка международного набора символов (Россия)
      commands.push(ESCPOSPrinter.commands.INTL_CHARSET_RUSSIA);
      // Установка кодовой страницы для кириллицы
      commands.push(ESCPOSPrinter.commands.CHARSET_CP866);
    }

    // Заголовок - название заведения
    if (settings.businessName) {
      commands.push(
        ...this.printText(settings.businessName, {
          align: 'center',
          size: 'double',
          bold: true,
        })
      );
    } else {
      commands.push(
        ...this.printText('My POS System', {
          align: 'center',
          size: 'double',
          bold: true,
        })
      );
    }

    commands.push(...this.printEmptyLine());
    commands.push(...this.printSeparator('=', 48));

    // Номер чека
    commands.push(
      ...this.printText(`ЧЕК: ${order.order_number}`, {
        align: 'center',
        bold: true,
      })
    );

    // Дата и время
    const dateTime = new Date(order.created_at).toLocaleString('ru-RU');
    commands.push(...this.printText(`Дата: ${dateTime}`, { align: 'center' }));

    commands.push(...this.printSeparator('-', 48));
    commands.push(...this.printEmptyLine());

    // Товары
    order.items.forEach((item) => {
      // Название товара
      commands.push(
        ...this.printText(item.product_name, {
          align: 'left',
          bold: true,
        })
      );

      // Количество и цена
      const qtyLine = `${item.quantity} x ${item.price} тг`;
      const subtotal = `${item.subtotal.toFixed(0)} тг`;

      // Выравниваем: количество слева, сумма справа
      const spacer = ' '.repeat(48 - qtyLine.length - subtotal.length);
      commands.push(...this.printText(`${qtyLine}${spacer}${subtotal}`));

      commands.push(...this.printEmptyLine());
    });

    commands.push(...this.printSeparator('-', 48));

    // Итого
    const totalLabel = 'ИТОГО:';
    const totalAmount = `${order.total_amount.toFixed(0)} тг`;
    const totalSpacer = ' '.repeat(
      48 - totalLabel.length - totalAmount.length
    );

    commands.push(
      ...this.printText(`${totalLabel}${totalSpacer}${totalAmount}`, {
        bold: true,
        size: 'tall',
      })
    );

    // Способ оплаты
    const paymentMethod =
      order.payment_method === 'cash' ? 'Наличные' : 'Карта';
    commands.push(
      ...this.printText(`Оплата: ${paymentMethod}`, { align: 'center' })
    );

    commands.push(...this.printSeparator('=', 48));
    commands.push(...this.printEmptyLine());

    // Благодарность
    commands.push(
      ...this.printText('Спасибо за покупку!', {
        align: 'center',
        size: 'wide',
      })
    );

    if (settings.phone) {
      commands.push(...this.printText(settings.phone, { align: 'center' }));
    }

    commands.push(...this.printEmptyLine());
    commands.push(...this.printEmptyLine());
    commands.push(...this.printEmptyLine());
    commands.push(...this.printEmptyLine());

    // Обрезка бумаги
    commands.push(ESCPOSPrinter.commands.CUT_PAPER);

    return commands;
  }

  /**
   * Печать бегунков (отдельный билет на каждый напиток с обрезкой)
   * @param {Object} order - Данные заказа
   * @param {Object} settings - Настройки
   */
  async printRunners(order, settings = {}) {
    const allCommands = [];

    // Для каждого товара печатаем отдельный бегунок
    for (const item of order.items) {
      // Количество бегунков = количество единиц товара
      for (let i = 0; i < item.quantity; i++) {
        const runnerCommands = this.buildRunnerCommands(order, item, settings, i + 1, item.quantity);
        allCommands.push(...runnerCommands);
      }
    }

    return await this.print(allCommands);
  }

  /**
   * Формирование команд для одного бегунка
   * @param {Object} order - Данные заказа
   * @param {Object} item - Товар
   * @param {Object} settings - Настройки
   * @param {number} itemNum - Номер единицы (1 из 2)
   * @param {number} itemTotal - Всего единиц
   */
  buildRunnerCommands(order, item, settings = {}, itemNum = 1, itemTotal = 1) {
    const commands = [];

    // Инициализация
    commands.push(ESCPOSPrinter.commands.INIT);

    // Для RawBT используем UTF-8
    if (!this.useRawBT) {
      commands.push(ESCPOSPrinter.commands.INTL_CHARSET_RUSSIA);
      commands.push(ESCPOSPrinter.commands.CHARSET_CP866);
    }

    // Номер заказа крупно
    commands.push(
      ...this.printText(`#${order.order_number}`, {
        align: 'center',
        size: 'double',
        bold: true,
      })
    );

    commands.push(...this.printSeparator('-', 32));

    // Название товара крупно
    commands.push(
      ...this.printText(item.product_name, {
        align: 'center',
        size: 'double',
        bold: true,
      })
    );

    // Модификаторы если есть
    if (item.modifiers && item.modifiers.length > 0) {
      const modText = item.modifiers.map(m => m.name).join(', ');
      commands.push(
        ...this.printText(modText, {
          align: 'center',
        })
      );
    }

    commands.push(...this.printEmptyLine());

    // Номер единицы если несколько
    if (itemTotal > 1) {
      commands.push(
        ...this.printText(`${itemNum} / ${itemTotal}`, {
          align: 'center',
          size: 'tall',
        })
      );
    }

    // Время
    const time = new Date(order.created_at).toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit'
    });
    commands.push(
      ...this.printText(time, {
        align: 'center',
      })
    );

    commands.push(...this.printEmptyLine());
    commands.push(...this.printEmptyLine());
    commands.push(...this.printEmptyLine());

    // Обрезка бумаги
    commands.push(ESCPOSPrinter.commands.CUT_PAPER);

    return commands;
  }

  /**
   * Тестовая печать
   */
  async printTest() {
    const testOrder = {
      order_number: 'TEST-001',
      created_at: new Date().toISOString(),
      total_amount: 1350,
      payment_method: 'cash',
      items: [
        {
          product_name: 'Латте большой',
          quantity: 2,
          price: 450,
          subtotal: 900,
        },
        {
          product_name: 'Круассан с шоколадом',
          quantity: 1,
          price: 450,
          subtotal: 450,
        },
      ],
    };

    const testSettings = {
      businessName: 'ТЕСТОВАЯ ПЕЧАТЬ',
      phone: '+7 (777) 123-45-67',
    };

    return await this.printReceipt(testOrder, testSettings);
  }
}

export default ReceiptPrinter;
