from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import List
import json
import asyncio

router = APIRouter(prefix="/ws", tags=["websocket"])


class ConnectionManager:
    """Управление WebSocket соединениями для Kitchen Display"""

    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        """Подключить новый WebSocket"""
        await websocket.accept()
        self.active_connections.append(websocket)
        print(f"✅ Kitchen Display подключен. Всего подключений: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        """Отключить WebSocket"""
        self.active_connections.remove(websocket)
        print(f"❌ Kitchen Display отключен. Осталось подключений: {len(self.active_connections)}")

    async def send_personal_message(self, message: dict, websocket: WebSocket):
        """Отправить сообщение конкретному клиенту"""
        await websocket.send_json(message)

    async def broadcast(self, message: dict):
        """Отправить сообщение всем подключенным клиентам"""
        disconnected = []
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception as e:
                print(f"⚠️ Ошибка отправки сообщения: {e}")
                disconnected.append(connection)

        # Удаляем разорванные соединения
        for connection in disconnected:
            if connection in self.active_connections:
                self.active_connections.remove(connection)


# Singleton instance
manager = ConnectionManager()


@router.websocket("/kitchen")
async def kitchen_websocket(websocket: WebSocket):
    """
    WebSocket endpoint для Kitchen Display System

    Получает real-time уведомления о новых заказах
    """
    await manager.connect(websocket)

    try:
        # Отправляем приветственное сообщение
        await websocket.send_json({
            "type": "connected",
            "message": "Kitchen Display подключен к серверу",
            "timestamp": asyncio.get_event_loop().time()
        })

        # Слушаем сообщения от клиента (для ping/pong)
        while True:
            data = await websocket.receive_text()

            # Обработка ping для keep-alive
            if data == "ping":
                await websocket.send_json({"type": "pong"})

    except WebSocketDisconnect:
        manager.disconnect(websocket)
        print("Kitchen Display отключился")
    except Exception as e:
        print(f"WebSocket ошибка: {e}")
        manager.disconnect(websocket)


# Экспортируем manager для использования в других модулях
__all__ = ["router", "manager"]
