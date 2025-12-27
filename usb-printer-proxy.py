#!/usr/bin/env python3
"""
USB Printer Proxy Server (HTTP with CORS)
Listens on localhost:9100 and forwards ESC/POS commands to USB printer
"""

from http.server import HTTPServer, BaseHTTPRequestHandler
import subprocess
import tempfile
import os

HOST = '127.0.0.1'
PORT = 9100
PRINTER_NAME = 'Xprinter_USB_Printer_P'

def convert_utf8_to_cp866(data):
    """
    Конвертирует UTF-8 текст в CP866 (DOS кириллица)
    Ищет текстовые последовательности и перекодирует их
    """
    try:
        # Пытаемся декодировать как UTF-8 и перекодировать в CP866
        # Работает только для чистого текста, но для смешанных данных (команды + текст)
        # делаем простую эвристику

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
                # Собираем последовательность текстовых байтов
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


def print_data(data):
    """Send raw data to printer using lpr"""
    try:
        # Конвертируем UTF-8 в CP866 для кириллицы
        converted_data = convert_utf8_to_cp866(data)

        # Create temporary file with converted data
        with tempfile.NamedTemporaryFile(mode='wb', delete=False) as f:
            f.write(converted_data)
            temp_file = f.name

        # Send to printer using lpr
        result = subprocess.run(
            ['lpr', '-P', PRINTER_NAME, '-o', 'raw', temp_file],
            capture_output=True,
            text=True
        )

        # Clean up temp file
        os.unlink(temp_file)

        if result.returncode == 0:
            print(f"✓ Printed {len(data)} bytes (converted from UTF-8 to CP866)")
            return True
        else:
            print(f"✗ Print error: {result.stderr}")
            return False

    except Exception as e:
        print(f"✗ Error: {e}")
        return False


class PrinterHTTPHandler(BaseHTTPRequestHandler):
    """HTTP handler with CORS support"""

    def do_OPTIONS(self):
        """Handle preflight CORS requests"""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_POST(self):
        """Handle POST requests with print data"""
        content_length = int(self.headers.get('Content-Length', 0))
        data = self.rfile.read(content_length)

        print(f"📥 POST request from {self.client_address}")
        print(f"📄 Received {len(data)} bytes")

        success = print_data(data)

        # Send response with CORS headers
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
        """Suppress default logging"""
        pass


def start_server():
    """Start HTTP server on port 9100"""
    print(f"🖨️  USB Printer Proxy Server (HTTP + CORS)")
    print(f"📍 Listening on http://{HOST}:{PORT}")
    print(f"🔌 Forwarding to: {PRINTER_NAME}")
    print(f"✓ Ready to accept connections...\n")

    server = HTTPServer((HOST, PORT), PrinterHTTPHandler)
    server.serve_forever()


if __name__ == '__main__':
    try:
        start_server()
    except KeyboardInterrupt:
        print("\n\n👋 Server stopped")
    except Exception as e:
        print(f"\n❌ Error: {e}")
