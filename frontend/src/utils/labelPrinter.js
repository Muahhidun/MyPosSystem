// Печать бегунков (этикеток) на Xprinter XP-365B
// Размер: 58mm x 40mm (стандартная этикетка для стаканов)

import ESCPOSPrinter from './printerESCPOS.js';

class LabelPrinter extends ESCPOSPrinter {
  /**
   * Печать бегунка для кухни
   * @param {Object} order - Данные заказа
   */
  async printKitchenLabel(order) {
    const commands = this.buildKitchenLabelCommands(order);
    return await this.print(commands);
  }

  /**
   * Формирование команд для печати бегунка (для RawBT и сетевой печати)
   * @param {Object} order - Данные заказа
   * @returns {Array} Массив ESC/POS команд
   */
  buildKitchenLabelCommands(order) {
    const commands = [];

    // Инициализация
    commands.push(ESCPOSPrinter.commands.INIT);

    // Установка международного набора символов (Россия)
    commands.push(ESCPOSPrinter.commands.INTL_CHARSET_RUSSIA);

    // Установка кодовой страницы для кириллицы
    // CP866 с международным набором
    commands.push(ESCPOSPrinter.commands.CHARSET_CP866);

    // Верхняя рамка
    commands.push(...this.printSeparator('=', 32));

    // Номер заказа (крупно)
    const orderNum = order.order_number.split('-').pop(); // Берем последнюю часть
    commands.push(
      ...this.printText(`ЗАКАЗ #${orderNum}`, {
        align: 'center',
        size: 'double',
        bold: true,
      })
    );

    commands.push(...this.printSeparator('=', 32));
    commands.push(...this.printEmptyLine());

    // Товары (крупным шрифтом для кухни)
    order.items.forEach((item) => {
      // Название товара
      commands.push(
        ...this.printText(item.product_name, {
          align: 'center',
          size: 'wide',
          bold: true,
        })
      );

      // Количество
      if (item.quantity > 1) {
        commands.push(
          ...this.printText(`x ${item.quantity}`, {
            align: 'center',
            size: 'tall',
            bold: true,
          })
        );
      }

      commands.push(...this.printEmptyLine());
    });

    commands.push(...this.printSeparator('-', 32));

    // Время заказа
    const time = new Date(order.created_at).toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
    });
    commands.push(
      ...this.printText(time, {
        align: 'center',
        size: 'wide',
      })
    );

    commands.push(...this.printSeparator('=', 32));
    commands.push(...this.printEmptyLine());

    // Обрезка этикетки
    commands.push(ESCPOSPrinter.commands.CUT_PAPER);

    return commands;
  }

  /**
   * Компактная этикетка для стакана (для напитков)
   * @param {Object} order - Данные заказа
   */
  async printDrinkLabel(order) {
    const commands = [];

    // Инициализация
    commands.push(ESCPOSPrinter.commands.INIT);

    // Номер заказа
    const orderNum = order.order_number.split('-').pop();
    commands.push(
      ...this.printText(`#${orderNum}`, {
        align: 'center',
        size: 'double',
        bold: true,
      })
    );

    commands.push(...this.printSeparator('-', 32));

    // Только напитки
    const drinks = order.items.filter((item) =>
      item.product_name.toLowerCase().includes('чай' || 'кофе' || 'латте')
    );

    drinks.forEach((item) => {
      commands.push(
        ...this.printText(item.product_name, {
          align: 'center',
          size: 'wide',
          bold: true,
        })
      );

      if (item.quantity > 1) {
        commands.push(
          ...this.printText(`x${item.quantity}`, {
            align: 'center',
            bold: true,
          })
        );
      }
    });

    // Время
    const time = new Date(order.created_at).toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
    });
    commands.push(...this.printSeparator('-', 32));
    commands.push(
      ...this.printText(time, {
        align: 'center',
        size: 'tall',
      })
    );

    commands.push(...this.printEmptyLine());

    // Обрезка
    commands.push(ESCPOSPrinter.commands.CUT_PAPER);

    return await this.print(commands);
  }

  /**
   * Тестовая печать
   */
  async printTest() {
    const testOrder = {
      order_number: 'ORD-TEST-A8B2',
      created_at: new Date().toISOString(),
      items: [
        {
          product_name: 'Молочный чай',
          quantity: 1,
        },
        {
          product_name: 'Мороженое рожок',
          quantity: 2,
        },
      ],
    };

    return await this.printKitchenLabel(testOrder);
  }
}

export default LabelPrinter;
