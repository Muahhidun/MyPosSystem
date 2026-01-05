#!/usr/bin/env python3
"""
USB Printer Proxy Server для Windows
Слушает на localhost:9100/9101 и пересылает ESC/POS команды на USB принтеры
"""

from http.server import HTTPServer, BaseHTTPRequestHandler
import tempfile
import os
import sys
import subprocess

# ==================== НАСТРОЙКИ ====================
# Точные имена принтеров из Windows (проверено со скриншотов)
RECEIPT_PRINTER = 'Касса'     # Принтер чеков (PrinterPOS-80, порт USB001)
LABEL_PRINTER = 'XP-365B'     # Принтер этикеток (XprinterXP-365B, порт USB002)

# Порты для прокси-сервера (разные порты для разных принтеров)
RECEIPT_PORT = 9100  # Для чеков → localhost:9100
LABEL_PORT = 9101    # Для этикеток → localhost:9101
# ===================================================


def convert_utf8_to_cp866(data):
    """
    Конвертирует UTF-8 текст в CP866 (DOS кириллица)
    Ищет текстовые последовательности и перекодирует их
    """
    try:
        result = bytearray()
        i = 0
        while i < len(data):
            # ESC/POS команды обычно начинаются с 0x1B (ESC) или 0x1D (GS)
            if data[i] in (0x1B, 0x1D) or data[i] < 0x20:
                # Это команда, оставляем как есть
                result.append(data[i])
                i += 1
            else:
                # Это может быть текст
                text_bytes = bytearray()
                while i < len(data) and data[i] >= 0x20 and data[i] not in (0x1B, 0x1D):
                    text_bytes.append(data[i])
                    i += 1

                if text_bytes:
                    try:
                        # Пытаемся декодировать как UTF-8
                        text = text_bytes.decode('utf-8')
                        # Перекодируем в CP866
                        converted = text.encode('cp866', errors='replace')
                        result.extend(converted)
                    except:
                        # Если не получилось, оставляем как есть
                        result.extend(text_bytes)

        return bytes(result)
    except Exception as e:
        print(f"⚠️  Conversion error: {e}, sending original data")
        return data


def print_data_windows(data, printer_name):
    """
    Отправка данных на принтер в Windows
    Использует команду COPY для отправки raw данных
    """
    try:
        # Конвертируем UTF-8 в CP866 для кириллицы
        converted_data = convert_utf8_to_cp866(data)

        # Создаём временный файл
        with tempfile.NamedTemporaryFile(mode='wb', delete=False, suffix='.prn') as f:
            f.write(converted_data)
            temp_file = f.name

        # Отправляем на принтер через COPY /B (binary mode)
        # COPY /B file.prn \\localhost\PrinterName
        printer_path = f"\\\\localhost\\{printer_name}"

        result = subprocess.run(
            ['cmd', '/c', 'copy', '/B', temp_file, printer_path],
            capture_output=True,
            text=True,
            shell=False
        )

        # Удаляем временный файл
        try:
            os.unlink(temp_file)
        except:
            pass

        if result.returncode == 0:
            print(f"✓ Printed {len(data)} bytes to {printer_name}")
            return True
        else:
            print(f"✗ Print error: {result.stderr}")
            print(f"   Command: copy /B {temp_file} {printer_path}")
            return False

    except Exception as e:
        print(f"✗ Error: {e}")
        return False


class ReceiptPrinterHandler(BaseHTTPRequestHandler):
    """Обработчик для принтера чеков (порт 9100)"""

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_POST(self):
        content_length = int(self.headers.get('Content-Length', 0))
        data = self.rfile.read(content_length)

        print(f"📥 [RECEIPT] POST request from {self.client_address}")
        print(f"📄 [RECEIPT] Received {len(data)} bytes")

        success = print_data_windows(data, RECEIPT_PRINTER)

        if success:
            self.send_response(200)
        else:
            self.send_response(500)

        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Content-Type', 'application/json')
        self.end_headers()

        response = b'{"success": true}' if success else b'{"success": false}'
        self.wfile.write(response)

    def log_message(self, format, *args):
        pass


class LabelPrinterHandler(BaseHTTPRequestHandler):
    """Обработчик для принтера этикеток (порт 9101)"""

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_POST(self):
        content_length = int(self.headers.get('Content-Length', 0))
        data = self.rfile.read(content_length)

        print(f"📥 [LABEL] POST request from {self.client_address}")
        print(f"📄 [LABEL] Received {len(data)} bytes")

        success = print_data_windows(data, LABEL_PRINTER)

        if success:
            self.send_response(200)
        else:
            self.send_response(500)

        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Content-Type', 'application/json')
        self.end_headers()

        response = b'{"success": true}' if success else b'{"success": false}'
        self.wfile.write(response)

    def log_message(self, format, *args):
        pass


def start_servers():
    """Запускает два сервера (для чеков и этикеток)"""
    import threading

    print(f"🖨️  USB Printer Proxy Server для Windows")
    print(f"=" * 60)
    print(f"📍 Receipt Printer: http://127.0.0.1:{RECEIPT_PORT}")
    print(f"   → {RECEIPT_PRINTER}")
    print(f"📍 Label Printer: http://127.0.0.1:{LABEL_PORT}")
    print(f"   → {LABEL_PRINTER}")
    print(f"=" * 60)
    print(f"✓ Ready to accept connections...\n")

    # Сервер для чеков
    receipt_server = HTTPServer(('127.0.0.1', RECEIPT_PORT), ReceiptPrinterHandler)
    receipt_thread = threading.Thread(target=receipt_server.serve_forever, daemon=True)
    receipt_thread.start()

    # Сервер для этикеток
    label_server = HTTPServer(('127.0.0.1', LABEL_PORT), LabelPrinterHandler)
    label_thread = threading.Thread(target=label_server.serve_forever, daemon=True)
    label_thread.start()

    print("✓ Серверы запущены! Нажми Ctrl+C для остановки.\n")

    # Держим главный поток живым
    try:
        receipt_thread.join()
        label_thread.join()
    except KeyboardInterrupt:
        print("\n\n👋 Серверы остановлены")


if __name__ == '__main__':
    if sys.platform != 'win32':
        print("❌ Этот скрипт работает только на Windows!")
        print("   Для Mac/Linux используй usb-printer-proxy.py")
        sys.exit(1)

    try:
        start_servers()
    except Exception as e:
        print(f"\n❌ Ошибка: {e}")
        input("\nНажми Enter для выхода...")
