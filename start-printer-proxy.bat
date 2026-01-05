@echo off
REM Запуск USB Printer Proxy для MyPOS
REM Этот скрипт запускает прокси-сервер для печати на USB принтерах

echo ========================================
echo  MyPOS USB Printer Proxy
echo ========================================
echo.

REM Проверка наличия Python
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python не установлен!
    echo.
    echo Скачай и установи Python с https://www.python.org/downloads/
    echo При установке поставь галочку "Add Python to PATH"
    echo.
    pause
    exit /b 1
)

echo [OK] Python найден
echo.

REM Запуск прокси-сервера
echo Запускаю прокси-сервер...
echo.
python usb-printer-proxy-windows.py

pause
