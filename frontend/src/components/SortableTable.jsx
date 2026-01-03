import { useState } from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';

/**
 * Компонент для сортируемого заголовка таблицы
 *
 * @param {string} column - Имя колонки для сортировки
 * @param {string} label - Отображаемый текст заголовка
 * @param {object} sortState - { column: string, direction: 'asc' | 'desc' | null }
 * @param {function} onSort - Функция обработки клика на заголовок
 */
export function SortableHeader({ column, label, sortState, onSort, className = "" }) {
  const isActive = sortState.column === column;
  const direction = isActive ? sortState.direction : null;

  const handleClick = () => {
    onSort(column);
  };

  return (
    <th
      onClick={handleClick}
      className={`cursor-pointer select-none hover:bg-gray-100 transition-colors ${className}`}
    >
      <div className="flex items-center gap-1 justify-between">
        <span>{label}</span>
        <div className="w-4 h-4 flex items-center justify-center">
          {direction === 'asc' && <ChevronUp size={16} className="text-blue-600" />}
          {direction === 'desc' && <ChevronDown size={16} className="text-blue-600" />}
          {direction === null && <ChevronsUpDown size={16} className="text-gray-400" />}
        </div>
      </div>
    </th>
  );
}

/**
 * Хук для управления сортировкой
 *
 * Логика:
 * 1-й клик: asc (возрастание)
 * 2-й клик: desc (убывание)
 * 3-й клик: null (исходный порядок)
 *
 * @param {Array} data - Исходные данные
 * @param {string} initialColumn - Начальная колонка для сортировки (опционально)
 */
export function useSortableData(data, initialColumn = null) {
  const [sortState, setSortState] = useState({
    column: initialColumn,
    direction: initialColumn ? 'asc' : null
  });

  const handleSort = (column) => {
    setSortState(prev => {
      // Если кликнули на ту же колонку
      if (prev.column === column) {
        if (prev.direction === 'asc') {
          return { column, direction: 'desc' };
        } else if (prev.direction === 'desc') {
          return { column: null, direction: null }; // Сброс
        }
      }
      // Новая колонка - начинаем с asc
      return { column, direction: 'asc' };
    });
  };

  const sortedData = [...data].sort((a, b) => {
    if (!sortState.column || !sortState.direction) {
      return 0; // Исходный порядок
    }

    const column = sortState.column;
    let aValue = a[column];
    let bValue = b[column];

    // Обработка вложенных значений (например, category_rel.name)
    if (column.includes('.')) {
      const keys = column.split('.');
      aValue = keys.reduce((obj, key) => obj?.[key], a);
      bValue = keys.reduce((obj, key) => obj?.[key], b);
    }

    // Обработка null/undefined
    if (aValue == null && bValue == null) return 0;
    if (aValue == null) return sortState.direction === 'asc' ? 1 : -1;
    if (bValue == null) return sortState.direction === 'asc' ? -1 : 1;

    // Числовая сортировка
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortState.direction === 'asc'
        ? aValue - bValue
        : bValue - aValue;
    }

    // Строковая сортировка (алфавит)
    const aStr = String(aValue).toLowerCase();
    const bStr = String(bValue).toLowerCase();

    if (sortState.direction === 'asc') {
      return aStr.localeCompare(bStr, 'ru');
    } else {
      return bStr.localeCompare(aStr, 'ru');
    }
  });

  return {
    sortedData,
    sortState,
    handleSort
  };
}
