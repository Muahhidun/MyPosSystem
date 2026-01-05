/**
 * Гибридная система печати
 * - Windows Desktop: window.print() с HTML чеком
 * - Android Планшет: RawBT (ESC/POS через base64)
 */

class HybridPrinter {
  constructor() {
    this.platform = this.detectPlatform();
  }

  /**
   * Определение платформы
   * @returns {'windows'|'android'|'ios'|'other'}
   */
  detectPlatform() {
    const userAgent = navigator.userAgent.toLowerCase();
    const platform = navigator.platform.toLowerCase();

    // Android
    if (userAgent.includes('android')) {
      return 'android';
    }

    // iOS
    if (/iphone|ipad|ipod/.test(userAgent)) {
      return 'ios';
    }

    // Windows
    if (platform.includes('win') || userAgent.includes('windows')) {
      return 'windows';
    }

    // macOS
    if (platform.includes('mac')) {
      return 'macos';
    }

    return 'other';
  }

  /**
   * Печать чека (гибридная логика)
   * @param {Object} order - Данные заказа
   * @param {Object} settings - Настройки (название заведения и т.д.)
   * @param {string} type - Тип печати: 'receipt' (чек) или 'label' (бегунок)
   */
  async printReceipt(order, settings = {}, type = 'receipt') {
    console.log('🖨️ Hybrid Printer:', {
      platform: this.platform,
      type,
      orderNumber: order.order_number,
    });

    if (this.platform === 'android') {
      // Android: RawBT печать
      return await this.printViaRawBT(order, settings, type);
    } else {
      // Windows/Desktop: ESC/POS через USB Printer Proxy Server
      return await this.printViaNetwork(order, settings, type);
    }
  }

  /**
   * Печать через сеть (USB Printer Proxy Server)
   * Для Windows Desktop с USB принтерами через localhost
   */
  async printViaNetwork(order, settings, type) {
    try {
      // Импортируем ESC/POS принтеры
      const { default: ReceiptPrinter } = await import('./receiptPrinter.js');
      const { default: LabelPrinter } = await import('./labelPrinter.js');

      // Определяем IP (localhost для USB Printer Proxy Server)
      const printerIP = '127.0.0.1';

      let printer;
      let result;

      if (type === 'label') {
        // Печать бегунка на XP-365B (localhost:9101)
        printer = new LabelPrinter(printerIP);
        printer.port = 9101; // Переопределяем порт для бегунков
        result = await printer.printKitchenLabel(order);
      } else {
        // Печать чека на XP-T80Q (localhost:9100)
        printer = new ReceiptPrinter(printerIP);
        printer.port = 9100; // Порт для чеков
        result = await printer.printReceipt(order, settings);
      }

      return result;
    } catch (error) {
      console.error('❌ Ошибка печати через сеть:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Печать через браузер (window.print) - НЕ ИСПОЛЬЗУЕТСЯ
   * Для Windows Desktop с USB принтерами
   */
  async printViaBrowser(order, settings, type) {
    try {
      // Создаём скрытый контейнер для печати
      const printContainer = document.getElementById('print-container');
      if (!printContainer) {
        console.error('❌ Print container не найден');
        return { success: false, error: 'Print container не найден' };
      }

      // Формируем HTML чека
      const receiptHTML = this.generateReceiptHTML(order, settings, type);

      // Вставляем в контейнер
      printContainer.innerHTML = receiptHTML;

      // Небольшая задержка для рендеринга
      await new Promise(resolve => setTimeout(resolve, 100));

      // Открываем диалог печати
      window.print();

      // Очищаем контейнер после печати
      setTimeout(() => {
        printContainer.innerHTML = '';
      }, 1000);

      return { success: true };
    } catch (error) {
      console.error('❌ Ошибка печати через браузер:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Генерация HTML для чека (80мм термопринтер)
   */
  generateReceiptHTML(order, settings, type) {
    if (type === 'label') {
      return this.generateLabelHTML(order);
    }

    const businessName = settings?.businessName || 'My POS System';
    const phone = settings?.phone || '';
    const dateTime = new Date(order.created_at).toLocaleString('ru-RU');
    const paymentMethod = order.payment_method === 'cash' ? 'Наличные' : 'Карта';

    return `
      <div class="receipt">
        <div class="receipt-header">
          <h1>${businessName}</h1>
        </div>

        <div class="receipt-divider">========================================</div>

        <div class="receipt-order-number">
          <strong>ЧЕК: ${order.order_number}</strong>
        </div>

        <div class="receipt-datetime">
          Дата: ${dateTime}
        </div>

        <div class="receipt-divider-thin">----------------------------------------</div>

        <div class="receipt-items">
          ${order.items.map(item => `
            <div class="receipt-item">
              <div class="item-name"><strong>${item.product_name}</strong></div>
              <div class="item-details">
                <span class="item-qty">${item.quantity} x ${item.price} тг</span>
                <span class="item-total">${item.subtotal.toFixed(0)} тг</span>
              </div>
            </div>
          `).join('')}
        </div>

        <div class="receipt-divider-thin">----------------------------------------</div>

        <div class="receipt-total">
          <span class="total-label">ИТОГО:</span>
          <span class="total-amount">${order.total_amount.toFixed(0)} тг</span>
        </div>

        <div class="receipt-payment">
          Оплата: ${paymentMethod}
        </div>

        <div class="receipt-divider">========================================</div>

        <div class="receipt-footer">
          <div class="receipt-thanks">Спасибо за покупку!</div>
          ${phone ? `<div class="receipt-phone">${phone}</div>` : ''}
        </div>
      </div>
    `;
  }

  /**
   * Генерация HTML для бегунка (этикетки)
   */
  generateLabelHTML(order) {
    const orderNum = order.order_number.split('-').pop();
    const time = new Date(order.created_at).toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
    });

    return `
      <div class="label">
        <div class="label-divider">================================</div>

        <div class="label-order-number">
          ЗАКАЗ #${orderNum}
        </div>

        <div class="label-divider">================================</div>

        <div class="label-items">
          ${order.items.map(item => `
            <div class="label-item">
              <div class="label-item-name">${item.product_name}</div>
              ${item.quantity > 1 ? `<div class="label-item-qty">x ${item.quantity}</div>` : ''}
            </div>
          `).join('')}
        </div>

        <div class="label-divider-thin">--------------------------------</div>

        <div class="label-time">${time}</div>

        <div class="label-divider">================================</div>
      </div>
    `;
  }

  /**
   * Печать через RawBT (для Android планшета)
   * Формируем ESC/POS команды и перенаправляем в приложение RawBT
   */
  async printViaRawBT(order, settings, type) {
    try {
      // Импортируем ESC/POS принтеры
      const { default: ReceiptPrinter } = await import('./receiptPrinter.js');
      const { default: LabelPrinter } = await import('./labelPrinter.js');

      let escposCommands;

      if (type === 'label') {
        // Печать бегунка
        const labelPrinter = new LabelPrinter('dummy'); // IP не нужен для RawBT
        escposCommands = await labelPrinter.buildKitchenLabelCommands(order);
      } else {
        // Печать чека
        const receiptPrinter = new ReceiptPrinter('dummy');
        escposCommands = await receiptPrinter.buildReceiptCommands(order, settings);
      }

      // Конвертируем в base64
      const base64 = this.commandsToBase64(escposCommands);

      // Формируем RawBT ссылку
      const rawbtUrl = `rawbt:base64,${base64}`;

      // Перенаправляем в RawBT приложение
      window.location.href = rawbtUrl;

      return { success: true };
    } catch (error) {
      console.error('❌ Ошибка печати через RawBT:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Конвертация ESC/POS команд в base64
   */
  commandsToBase64(commands) {
    const bytes = new Uint8Array(commands.flat());
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  /**
   * Проверка доступности печати
   */
  isPrintAvailable() {
    if (this.platform === 'android') {
      // Проверяем, установлен ли RawBT
      return true; // Всегда возвращаем true, пользователь увидит ошибку при попытке печати
    } else {
      // Проверяем, поддерживает ли браузер печать
      return typeof window.print === 'function';
    }
  }
}

export default HybridPrinter;
