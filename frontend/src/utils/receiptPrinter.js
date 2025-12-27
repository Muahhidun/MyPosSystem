// Печать чеков на Xprinter XP-T80Q (80mm)

import ESCPOSPrinter from './printerESCPOS.js';

class ReceiptPrinter extends ESCPOSPrinter {
  /**
   * Печать чека для клиента
   * @param {Object} order - Данные заказа
   * @param {Object} settings - Настройки (название заведения, адрес и т.д.)
   */
  async printReceipt(order, settings = {}) {
    const commands = [];

    // Инициализация
    commands.push(ESCPOSPrinter.commands.INIT);

    // Установка кодовой страницы для кириллицы
    // Попробуем CP866 (DOS кириллица) - обычно поддерживается принтерами
    commands.push(ESCPOSPrinter.commands.CHARSET_CP866);

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
      const qtyLine = `${item.quantity} x ${item.price}₸`;
      const subtotal = `${item.subtotal.toFixed(0)}₸`;

      // Выравниваем: количество слева, сумма справа
      const spacer = ' '.repeat(48 - qtyLine.length - subtotal.length);
      commands.push(...this.printText(`${qtyLine}${spacer}${subtotal}`));

      commands.push(...this.printEmptyLine());
    });

    commands.push(...this.printSeparator('-', 48));

    // Итого
    const totalLabel = 'ИТОГО:';
    const totalAmount = `${order.total_amount.toFixed(0)}₸`;
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

    // Обрезка бумаги
    commands.push(ESCPOSPrinter.commands.CUT_PAPER);

    // Отправка на печать
    return await this.print(commands);
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
