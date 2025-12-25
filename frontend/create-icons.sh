#!/bin/bash

# Скрипт для создания иконок PWA
# Требует: ImageMagick (brew install imagemagick)

echo "Creating PWA icons..."

cd public

# Проверка наличия ImageMagick
if ! command -v convert &> /dev/null; then
    echo "❌ ImageMagick не установлен!"
    echo "Установите: brew install imagemagick"
    echo ""
    echo "Или создайте иконки вручную:"
    echo "1. Откройте icon.svg в графическом редакторе"
    echo "2. Экспортируйте как PNG:"
    echo "   - icon-192.png (192x192)"
    echo "   - icon-512.png (512x512)"
    echo ""
    echo "Или используйте онлайн: https://realfavicongenerator.net/"
    exit 1
fi

# Создание иконок из SVG
convert -background none icon.svg -resize 192x192 icon-192.png
convert -background none icon.svg -resize 512x512 icon-512.png

echo "✅ Иконки созданы!"
echo "   icon-192.png"
echo "   icon-512.png"
