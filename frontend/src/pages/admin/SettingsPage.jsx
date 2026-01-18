import React, { useState, useEffect } from 'react';
import apiClient from '../../api/client.js';
import ReceiptPrinter from '../../utils/receiptPrinter.js';
import LabelPrinter from '../../utils/labelPrinter.js';
import AdminLayout from '../../components/AdminLayout';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Printer, Building2, Phone, HelpCircle, CheckCircle, AlertCircle } from 'lucide-react';

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
      setMessage('success:Настройки сохранены успешно!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Ошибка сохранения:', error);
      setMessage('error:Ошибка сохранения настроек');
    } finally {
      setSaving(false);
    }
  };

  const handleTestReceipt = async () => {
    if (!settings.receipt_printer_ip) {
      setMessage('error:Укажите IP адрес принтера чеков');
      return;
    }

    setTestingReceipt(true);
    try {
      const printer = new ReceiptPrinter(settings.receipt_printer_ip);
      const result = await printer.printTest();
      if (result.success) {
        setMessage('success:Тестовый чек отправлен на печать!');
      } else {
        setMessage('error:Ошибка печати: ' + result.error);
      }
    } catch (error) {
      setMessage('error:Ошибка печати: ' + error.message);
    } finally {
      setTestingReceipt(false);
    }
  };

  const handleTestLabel = async () => {
    if (!settings.label_printer_ip) {
      setMessage('error:Укажите IP адрес принтера бегунков');
      return;
    }

    setTestingLabel(true);
    try {
      const printer = new LabelPrinter(settings.label_printer_ip);
      const result = await printer.printTest();
      if (result.success) {
        setMessage('success:Тестовый бегунок отправлен на печать!');
      } else {
        setMessage('error:Ошибка печати: ' + result.error);
      }
    } catch (error) {
      setMessage('error:Ошибка печати: ' + error.message);
    } finally {
      setTestingLabel(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout title="Настройки">
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-600">Загрузка...</div>
        </div>
      </AdminLayout>
    );
  }

  const [messageType, messageText] = message.split(':');

  return (
    <AdminLayout title="Настройки">
      <div className="max-w-4xl">

        {message && (
          <div
            className={`mb-6 p-4 rounded-lg border flex items-start gap-3 ${
              messageType === 'error'
                ? 'bg-red-50 border-red-200 text-red-700'
                : 'bg-green-50 border-green-200 text-green-700'
            }`}
          >
            {messageType === 'error' ? (
              <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
            ) : (
              <CheckCircle size={20} className="flex-shrink-0 mt-0.5" />
            )}
            <span className="text-sm font-medium">{messageText}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          {/* Информация о заведении */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                <Building2 size={20} className="text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Информация о заведении</h2>
                <p className="text-xs text-gray-500">Отображается в чеках и на кассе</p>
              </div>
            </div>

            <div className="grid gap-5">
              <Input
                label="Название заведения"
                type="text"
                name="business_name"
                value={settings.business_name}
                onChange={handleChange}
                placeholder="My POS System"
              />

              <Input
                label="Телефон"
                type="text"
                name="phone"
                value={settings.phone}
                onChange={handleChange}
                placeholder="+7 (777) 123-45-67"
              />
            </div>
          </div>

          {/* Настройки принтеров */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
                <Printer size={20} className="text-purple-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Принтеры</h2>
                <p className="text-xs text-gray-500">Настройка принтеров для печати чеков и бегунков</p>
              </div>
            </div>

            <div className="space-y-6">
              {/* Принтер чеков */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Принтер чеков (Xprinter XP-T80Q)
                </label>
                <div className="flex gap-2">
                  <Input
                    type="text"
                    name="receipt_printer_ip"
                    value={settings.receipt_printer_ip}
                    onChange={handleChange}
                    placeholder="192.168.1.100"
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleTestReceipt}
                    disabled={testingReceipt || !settings.receipt_printer_ip}
                    className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                  >
                    {testingReceipt ? 'Печать...' : 'Тест'}
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-1.5">
                  IP адрес или <span className="font-mono bg-gray-100 px-1 rounded">rawbt</span> для Android + USB
                </p>
              </div>

              {/* Принтер бегунков */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Принтер бегунков (Xprinter XP-365B)
                </label>
                <div className="flex gap-2">
                  <Input
                    type="text"
                    name="label_printer_ip"
                    value={settings.label_printer_ip}
                    onChange={handleChange}
                    placeholder="192.168.1.101"
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleTestLabel}
                    disabled={testingLabel || !settings.label_printer_ip}
                    className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                  >
                    {testingLabel ? 'Печать...' : 'Тест'}
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-1.5">
                  IP адрес или <span className="font-mono bg-gray-100 px-1 rounded">rawbt</span> для Android + USB
                </p>
              </div>
            </div>
          </div>

          {/* Кнопка сохранения */}
          <div className="flex justify-end gap-3">
            <Button
              type="submit"
              disabled={saving}
              className="w-full sm:w-auto"
            >
              {saving ? 'Сохранение...' : 'Сохранить настройки'}
            </Button>
          </div>
        </form>

        {/* Подсказки */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <HelpCircle size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-900 mb-2">
                Как узнать IP адрес принтера?
              </h3>
              <ul className="text-sm text-blue-800 space-y-2">
                <li className="flex gap-2">
                  <span className="text-blue-400">•</span>
                  <span><strong>Xprinter XP-T80Q (WiFi):</strong> Напечатайте тестовую страницу, удерживая кнопку FEED при включении</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-blue-400">•</span>
                  <span><strong>Xprinter XP-365B (USB):</strong> Подключите через USB-Ethernet адаптер или принт-сервер</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-blue-400">•</span>
                  <span>Проверьте настройки роутера в разделе подключенных устройств</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

export default SettingsPage;
