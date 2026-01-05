@echo off
REM Скрипт для проверки установленных принтеров в Windows
echo ========================================
echo  Список всех принтеров в системе
echo ========================================
echo.

powershell -Command "Get-Printer | Select-Object Name, PortName, DriverName | Format-Table -AutoSize"

echo.
echo ========================================
echo Скопируй ТОЧНЫЕ названия из столбца Name
echo и отправь мне скриншот этого окна
echo ========================================
echo.
pause
