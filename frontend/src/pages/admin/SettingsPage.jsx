import React, { useState, useEffect } from 'react';
import apiClient from '../../api/client.js';
import ReceiptPrinter from '../../utils/receiptPrinter.js';
import LabelPrinter from '../../utils/labelPrinter.js';

function SettingsPage() {
  const [settings, setSettings] = useState({
    business_name: '',
    phone: '',
    receipt_printer_ip: '',
    label_printer_ip: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [testingReceipt, setTestingReceipt] = useState(false);
  const [testingLabel, setTestingLabel] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const data = await apiClient.getSettings();
      setSettings({
        business_name: data.business_name || '',
        phone: data.phone || '',
        receipt_printer_ip: data.receipt_printer_ip || '',
        label_printer_ip: data.label_printer_ip || '',
      });
      setLoading(false);
    } catch (error) {
      console.error('Ошибка загрузки настроек:', error);
      setMessage('Ошибка загрузки настроек');
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSettings((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');

    try {
      await apiClient.updateSettings(settings);
      setMessage('Настройки сохранены успешно!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Ошибка сохранения:', error);
      setMessage('Ошибка сохранения настроек');
    } finally {
      setSaving(false);
    }
  };

  const handleTestReceipt = async () => {
    if (!settings.receipt_printer_ip) {
      alert('Укажите IP адрес принтера чеков');
      return;
    }

    setTestingReceipt(true);
    try {
      const printer = new ReceiptPrinter(settings.receipt_printer_ip);
      const result = await printer.printTest();
      if (result.success) {
        alert('Тестовый чек отправлен на печать!');
      } else {
        alert('Ошибка печати: ' + result.error);
      }
    } catch (error) {
      alert('Ошибка печати: ' + error.message);
    } finally {
      setTestingReceipt(false);
    }
  };

  const handleTestLabel = async () => {
    if (!settings.label_printer_ip) {
      alert('Укажите IP адрес принтера бегунков');
      return;
    }

    setTestingLabel(true);
    try {
      const printer = new LabelPrinter(settings.label_printer_ip);
      const result = await printer.printTest();
      if (result.success) {
        alert('Тестовый бегунок отправлен на печать!');
      } else {
        alert('Ошибка печати: ' + result.error);
      }
    } catch (error) {
      alert('Ошибка печати: ' + error.message);
    } finally {
      setTestingLabel(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-600">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Настройки системы</h1>

      {message && (
        <div
          className={`mb-4 p-4 rounded ${
            message.includes('Ошибка')
              ? 'bg-red-100 text-red-700'
              : 'bg-green-100 text-green-700'
          }`}
        >
          {message}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Информация о бизнесе */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Информация о заведении</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Название заведения
              </label>
              <input
                type="text"
                name="business_name"
                value={settings.business_name}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="My POS System"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Телефон (для чеков)
              </label>
              <input
                type="text"
                name="phone"
                value={settings.phone}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="+7 (777) 123-45-67"
              />
            </div>
          </div>
        </div>

        {/* Настройки принтеров */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Принтеры</h2>

          <div className="space-y-6">
            {/* Принтер чеков */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Принтер чеков (Xprinter XP-T80Q)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  name="receipt_printer_ip"
                  value={settings.receipt_printer_ip}
                  onChange={handleChange}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="192.168.1.100"
                />
                <button
                  type="button"
                  onClick={handleTestReceipt}
                  disabled={testingReceipt || !settings.receipt_printer_ip}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {testingReceipt ? 'Печать...' : 'Тест'}
                </button>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                IP адрес принтера для чеков (80мм, WiFi)
              </p>
            </div>

            {/* Принтер бегунков */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Принтер бегунков (Xprinter XP-365B)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  name="label_printer_ip"
                  value={settings.label_printer_ip}
                  onChange={handleChange}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="192.168.1.101"
                />
                <button
                  type="button"
                  onClick={handleTestLabel}
                  disabled={testingLabel || !settings.label_printer_ip}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {testingLabel ? 'Печать...' : 'Тест'}
                </button>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                IP адрес принтера для кухонных бегунков (58мм, этикетки)
              </p>
            </div>
          </div>
        </div>

        {/* Кнопка сохранения */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold"
          >
            {saving ? 'Сохранение...' : 'Сохранить настройки'}
          </button>
        </div>
      </form>

      {/* Подсказки */}
      <div className="mt-8 bg-blue-50 p-6 rounded-lg">
        <h3 className="font-semibold text-blue-900 mb-2">
          Как узнать IP адрес принтера?
        </h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>
            • Xprinter XP-T80Q (WiFi): Напечатайте тестовую страницу, удерживая
            кнопку FEED при включении
          </li>
          <li>
            • Xprinter XP-365B (USB): Подключите через USB-Ethernet адаптер или
            принт-сервер
          </li>
          <li>
            • Проверьте настройки роутера в разделе подключенных устройств
          </li>
        </ul>
      </div>
    </div>
  );
}

export default SettingsPage;
