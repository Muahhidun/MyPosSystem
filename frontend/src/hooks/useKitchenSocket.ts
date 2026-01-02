import { useEffect, useState, useRef, useCallback } from 'react';
import type { Order } from '../types';

interface KitchenSocketMessage {
  type: 'connected' | 'new_order' | 'pong';
  message?: string;
  order?: Order;
  timestamp?: number;
}

interface UseKitchenSocketReturn {
  orders: Order[];
  connected: boolean;
  error: string | null;
  clearOrders: () => void;
}

// Получение WebSocket URL
const getWebSocketURL = (): string => {
  const apiUrl = import.meta.env.VITE_API_URL || window.location.origin;

  // Преобразуем HTTP в WS
  const wsUrl = apiUrl
    .replace('http://', 'ws://')
    .replace('https://', 'wss://');

  return `${wsUrl}/api/ws/kitchen`;
};

/**
 * Hook для подключения к Kitchen Display WebSocket
 *
 * Особенности:
 * - Автоматическое переподключение при обрыве связи
 * - Экспоненциальная задержка между попытками (1s, 2s, 4s, 8s, max 30s)
 * - Ping/pong для keep-alive соединения
 * - Звуковое уведомление при новом заказе
 */
export function useKitchenSocket(): UseKitchenSocketReturn {
  const [orders, setOrders] = useState<Order[]>([]);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectDelayRef = useRef(1000); // Начальная задержка 1 секунда
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Звук уведомления (можно заменить на реальный .mp3 файл)
  const playNotificationSound = useCallback(() => {
    try {
      // Создаем простой beep звук
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 800; // Частота звука
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(
        0.01,
        audioContext.currentTime + 0.5
      );

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (err) {
      console.warn('Не удалось воспроизвести звук:', err);
    }
  }, []);

  const clearOrders = useCallback(() => {
    setOrders([]);
  }, []);

  const connect = useCallback(() => {
    try {
      const wsUrl = getWebSocketURL();
      console.log('🔌 Подключение к Kitchen Display WebSocket:', wsUrl);

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('✅ WebSocket подключен');
        setConnected(true);
        setError(null);
        reconnectDelayRef.current = 1000; // Сбрасываем задержку при успешном подключении

        // Настраиваем ping для keep-alive
        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current);
        }

        pingIntervalRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send('ping');
          }
        }, 30000); // Ping каждые 30 секунд
      };

      ws.onmessage = (event) => {
        try {
          const data: KitchenSocketMessage = JSON.parse(event.data);

          switch (data.type) {
            case 'connected':
              console.log('📡 Сервер подтвердил подключение:', data.message);
              break;

            case 'new_order':
              console.log('🆕 Новый заказ:', data.order);
              if (data.order) {
                setOrders((prev) => [data.order!, ...prev]);
                playNotificationSound();

                // Вибрация на мобильных устройствах
                if ('vibrate' in navigator) {
                  navigator.vibrate([200, 100, 200]);
                }
              }
              break;

            case 'pong':
              // Ответ на ping - соединение живое
              break;

            default:
              console.log('Неизвестное сообщение:', data);
          }
        } catch (err) {
          console.error('Ошибка парсинга сообщения:', err);
        }
      };

      ws.onerror = (event) => {
        console.error('❌ WebSocket ошибка:', event);
        setError('Ошибка подключения к серверу');
      };

      ws.onclose = (event) => {
        console.warn('🔌 WebSocket отключен:', event.code, event.reason);
        setConnected(false);

        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current);
          pingIntervalRef.current = null;
        }

        // Автоматическое переподключение с экспоненциальной задержкой
        if (!event.wasClean) {
          const delay = Math.min(reconnectDelayRef.current, 30000); // Максимум 30 секунд

          console.log(`🔄 Переподключение через ${delay / 1000}s...`);
          setError(`Переподключение через ${delay / 1000}s...`);

          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectDelayRef.current *= 2; // Экспоненциальное увеличение
            connect();
          }, delay);
        }
      };
    } catch (err) {
      console.error('Ошибка создания WebSocket:', err);
      setError('Не удалось создать WebSocket соединение');
    }
  }, [playNotificationSound]);

  useEffect(() => {
    connect();

    return () => {
      // Cleanup при размонтировании компонента
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }

      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }

      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
        pingIntervalRef.current = null;
      }
    };
  }, [connect]);

  return {
    orders,
    connected,
    error,
    clearOrders
  };
}
