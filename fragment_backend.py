#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Fragment API Backend
Бэкенд для работы с Fragment API с использованием библиотеки ton-fragments
"""

import os
import json
import logging
from datetime import datetime
from flask import Flask, jsonify, request
from flask_cors import CORS
from dotenv import load_dotenv
import ton_fragment as fragment

# Настройка логирования
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("fragment_backend.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Загрузка переменных окружения
load_dotenv()

# Инициализация Flask приложения
app = Flask(__name__)
CORS(app)  # Разрешаем CORS для всех маршрутов

# Инициализация Fragment API
fragment_client = fragment.Client(
    api_key=os.getenv("FRAGMENT_API_KEY", ""),
    api_secret=os.getenv("FRAGMENT_API_SECRET", "")
)

# Путь к файлу с данными подарков
GIFTS_DATA_PATH = os.path.join(os.path.dirname(__file__), 'public', 'fragment_gifts.json')

# Функция для сохранения данных подарков в JSON файл
def save_gifts_data(gifts_data):
    try:
        with open(GIFTS_DATA_PATH, 'w', encoding='utf-8') as f:
            json.dump(gifts_data, f, ensure_ascii=False, indent=2)
        logger.info(f"Данные подарков сохранены в {GIFTS_DATA_PATH}")
        return True
    except Exception as e:
        logger.error(f"Ошибка при сохранении данных подарков: {e}")
        return False

# Функция для загрузки данных подарков из JSON файла
def load_gifts_data():
    try:
        if os.path.exists(GIFTS_DATA_PATH):
            with open(GIFTS_DATA_PATH, 'r', encoding='utf-8') as f:
                return json.load(f)
        return {"gifts": [], "lastUpdated": None}
    except Exception as e:
        logger.error(f"Ошибка при загрузке данных подарков: {e}")
        return {"gifts": [], "lastUpdated": None}

# Функция для создания тестовых данных
def create_test_data():
    logger.info("Создание тестовых данных подарков")
    
    test_gifts = []
    gift_names = ['AstralShard', 'CrystalGem', 'MysticOrb', 'EtherealPrism', 'CosmicFragment']
    owners = ['LZ77', 'CryptoWhale', 'TGCollector', 'FragmentFan', 'StarGazer']
    models = ['Moonstone', 'Obsidian', 'Ruby', 'Sapphire', 'Emerald']
    backgrounds = ['Fandango', 'Nebula', 'Aurora', 'Cosmos', 'Galaxy']
    symbols = ['Owl', 'Dragon', 'Phoenix', 'Lion', 'Eagle']
    collections = ['Astral', 'Gems', 'Cosmic', 'Ethereal', 'Mystic']
    statuses = ['for_sale', 'on_auction', 'for_sale', 'on_auction', 'for_sale']
    
    # Анимированные GIF для тестовых подарков
    animated_images = [
        'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExcDdtY2JlNGt1a2JlbXd1NXd5NnBxbWR0ZnJ5Y2Nxb2JlcWFxaWppZiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/l0HlQXlUKw6ljvHGg/giphy.gif',
        'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExcDdtY2JlNGt1a2JlbXd1NXd5NnBxbWR0ZnJ5Y2Nxb2JlcWFxaWppZiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/l0HlQXlUKw6ljvHGg/giphy.gif',
        'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExcDdtY2JlNGt1a2JlbXd1NXd5NnBxbWR0ZnJ5Y2Nxb2JlcWFxaWppZiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/l0HlQXlUKw6ljvHGg/giphy.gif',
        'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExcDdtY2JlNGt1a2JlbXd1NXd5NnBxbWR0ZnJ5Y2Nxb2JlcWFxaWppZiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/l0HlQXlUKw6ljvHGg/giphy.gif',
        'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExcDdtY2JlNGt1a2JlbXd1NXd5NnBxbWR0ZnJ5Y2Nxb2JlcWFxaWppZiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/l0HlQXlUKw6ljvHGg/giphy.gif'
    ]
    
    import random
    
    for i in range(5):
        # Генерируем случайную цену
        price = random.randint(100, 10000)
        
        test_gifts.append({
            "id": f"{i + 1}",
            "name": gift_names[i],
            "owner": owners[i],
            "collection": collections[i],
            "status": statuses[i],
            "price": {
                "amount": str(price),
                "currency": "TON"
            },
            "model": {
                "name": models[i],
                "rarity": f"{random.uniform(0.1, 5.0):.1f}%"
            },
            "background": {
                "name": backgrounds[i],
                "rarity": f"{random.uniform(0.1, 5.0):.1f}%"
            },
            "symbol": {
                "name": symbols[i],
                "rarity": f"{random.uniform(0.1, 5.0):.1f}%"
            },
            "supply": f"{random.randint(1000, 5000)}/{random.randint(6000, 10000)}",
            "image": f"https://via.placeholder.com/300x300?text={gift_names[i]}",
            "animatedImage": animated_images[i],
            "url": f"https://fragment.com/gift/test{i + 1}"
        })
    
    gifts_data = {
        "gifts": test_gifts,
        "lastUpdated": datetime.now().isoformat()
    }
    
    save_gifts_data(gifts_data)
    logger.info(f"Создано {len(test_gifts)} тестовых подарков")
    
    return gifts_data

# Преобразование объекта Gift в словарь для JSON
def gift_to_dict(gift):
    return {
        "id": str(gift.get('id', '0')),
        "name": gift.get('name', 'Unknown'),
        "owner": gift.get('owner', 'unknown'),
        "collection": gift.get('collection', 'Unknown'),
        "status": gift.get('status', 'not_for_sale'),
        "price": {
            "amount": str(gift.get('price', 0)),
            "currency": "TON"
        },
        "model": {
            "name": gift.get('model', {}).get('name', 'Unknown'),
            "rarity": f"{gift.get('model', {}).get('rarity', 0):.1f}%"
        },
        "background": {
            "name": gift.get('background', {}).get('name', 'Unknown'),
            "rarity": f"{gift.get('background', {}).get('rarity', 0):.1f}%"
        },
        "symbol": {
            "name": gift.get('symbol', {}).get('name', 'Unknown'),
            "rarity": f"{gift.get('symbol', {}).get('rarity', 0):.1f}%"
        },
        "supply": gift.get('supply', 'Unknown'),
        "image": gift.get('image', f"https://via.placeholder.com/300x300?text={gift.get('name', 'Unknown')}"),
        "animatedImage": gift.get('animated_image'),
        "url": gift.get('url', f"https://fragment.com/gift/{gift.get('id', '0')}")
    }

# Маршрут для получения списка подарков
@app.route('/api/fragment/gifts', methods=['GET'])
def get_gifts():
    try:
        # Получаем параметры запроса
        collection = request.args.get('collection')
        status = request.args.get('status', 'all')
        
        logger.info(f"Запрос на получение подарков (коллекция: {collection}, статус: {status})")
        
        try:
            # Пытаемся получить подарки через API
            gifts = []
            
            try:
                # Получаем все подарки
                if collection:
                    # Получаем подарки из указанной коллекции
                    gifts_list = fragment.get_gifts_by_collection(fragment_client, collection)
                else:
                    # Получаем все подарки
                    gifts_list = fragment.get_all_gifts(fragment_client)
                
                # Преобразуем в словари
                gifts = [gift_to_dict(gift) for gift in gifts_list]
                
                # Фильтруем по статусу, если указан
                if status != 'all':
                    if status == 'for_sale':
                        gifts = [gift for gift in gifts if gift['status'] == 'for_sale']
                    elif status == 'on_auction':
                        gifts = [gift for gift in gifts if gift['status'] == 'on_auction']
                    elif status == 'available':
                        gifts = [gift for gift in gifts if gift['status'] in ['for_sale', 'on_auction']]
            except Exception as api_error:
                logger.error(f"Ошибка при вызове API ton_fragment: {api_error}")
                # Создаем тестовые данные
                gifts = []
            
            # Сохраняем данные в файл
            gifts_data = {
                "gifts": gifts,
                "lastUpdated": datetime.now().isoformat()
            }
            save_gifts_data(gifts_data)
            
            logger.info(f"Получено {len(gifts)} подарков")
            
            return jsonify({
                "success": True,
                "gifts": gifts,
                "lastUpdated": gifts_data["lastUpdated"]
            })
            
        except Exception as api_error:
            logger.error(f"Ошибка при получении подарков через API: {api_error}")
            
            # Пробуем загрузить из файла
            gifts_data = load_gifts_data()
            
            # Если в файле нет данных, создаем тестовые
            if not gifts_data["gifts"]:
                gifts_data = create_test_data()
            
            # Фильтруем по коллекции, если указана
            if collection:
                gifts_data["gifts"] = [gift for gift in gifts_data["gifts"] if gift.get("collection") == collection]
            
            # Фильтруем по статусу, если указан
            if status != 'all':
                if status == 'for_sale':
                    gifts_data["gifts"] = [gift for gift in gifts_data["gifts"] if gift.get("status") == 'for_sale']
                elif status == 'on_auction':
                    gifts_data["gifts"] = [gift for gift in gifts_data["gifts"] if gift.get("status") == 'on_auction']
                elif status == 'available':
                    gifts_data["gifts"] = [gift for gift in gifts_data["gifts"] if gift.get("status") in ['for_sale', 'on_auction']]
            
            logger.info(f"Загружено {len(gifts_data['gifts'])} подарков из файла")
            
            return jsonify({
                "success": True,
                "gifts": gifts_data["gifts"],
                "lastUpdated": gifts_data["lastUpdated"],
                "fromCache": True
            })
    
    except Exception as e:
        logger.error(f"Ошибка при обработке запроса: {e}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

# Маршрут для получения подарка по ID
@app.route('/api/fragment/gifts/<gift_id>', methods=['GET'])
def get_gift_by_id(gift_id):
    try:
        logger.info(f"Запрос на получение подарка с ID: {gift_id}")
        
        try:
            # Пытаемся получить подарок через API
            try:
                gift = fragment.get_gift_by_id(fragment_client, gift_id)
                if gift:
                    gift_data = gift_to_dict(gift)
                    return jsonify({
                        "success": True,
                        "gift": gift_data
                    })
            except Exception as api_error:
                logger.error(f"Ошибка при получении подарка через API: {api_error}")
                
            # Если подарок не найден через API или произошла ошибка, ищем в файле
            gifts_data = load_gifts_data()
            gift_data = next((gift for gift in gifts_data["gifts"] if gift["id"] == gift_id), None)
            
            if gift_data:
                return jsonify({
                    "success": True,
                    "gift": gift_data,
                    "fromCache": True
                })
            else:
                return jsonify({
                    "success": False,
                    "error": "Gift not found"
                }), 404
        
        except Exception as api_error:
            logger.error(f"Ошибка при получении подарка через API: {api_error}")
            
            # Ищем в файле
            gifts_data = load_gifts_data()
            gift_data = next((gift for gift in gifts_data["gifts"] if gift["id"] == gift_id), None)
            
            if gift_data:
                return jsonify({
                    "success": True,
                    "gift": gift_data,
                    "fromCache": True
                })
            else:
                return jsonify({
                    "success": False,
                    "error": "Gift not found"
                }), 404
    
    except Exception as e:
        logger.error(f"Ошибка при обработке запроса: {e}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

# Маршрут для получения списка коллекций
@app.route('/api/fragment/collections', methods=['GET'])
def get_collections():
    try:
        logger.info("Запрос на получение списка коллекций")
        
        try:
            # Пытаемся получить коллекции через API
            collections = fragment.get_all_collections(fragment_client)
            collections_data = [{"id": str(col.get('id', i)), "name": col.get('name', f'Collection {i}')}
                               for i, col in enumerate(collections)]
            
            logger.info(f"Получено {len(collections_data)} коллекций")
            
            return jsonify({
                "success": True,
                "collections": collections_data
            })
        
        except Exception as api_error:
            logger.error(f"Ошибка при получении коллекций через API: {api_error}")
            
            # Извлекаем уникальные коллекции из файла с подарками
            gifts_data = load_gifts_data()
            collections_set = set()
            
            for gift in gifts_data["gifts"]:
                if "collection" in gift and gift["collection"]:
                    collections_set.add(gift["collection"])
            
            collections_data = [{"id": i, "name": name} for i, name in enumerate(sorted(collections_set))]
            
            logger.info(f"Извлечено {len(collections_data)} коллекций из кэша")
            
            return jsonify({
                "success": True,
                "collections": collections_data,
                "fromCache": True
            })
    
    except Exception as e:
        logger.error(f"Ошибка при обработке запроса: {e}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

# Маршрут для обновления данных подарков
@app.route('/api/fragment/update', methods=['POST'])
def update_gifts():
    try:
        logger.info("Запрос на обновление данных подарков")
        
        try:
            # Получаем все подарки через API
            try:
                all_gifts = fragment.get_all_gifts(fragment_client)
                gifts = [gift_to_dict(gift) for gift in all_gifts]
                
                # Сохраняем данные в файл
                gifts_data = {
                    "gifts": gifts,
                    "lastUpdated": datetime.now().isoformat()
                }
                save_gifts_data(gifts_data)
                
                logger.info(f"Обновлено {len(gifts)} подарков")
                
                return jsonify({
                    "success": True,
                    "message": f"Updated {len(gifts)} gifts",
                    "lastUpdated": gifts_data["lastUpdated"]
                })
            except Exception as api_error:
                logger.error(f"Ошибка при обновлении подарков через API: {api_error}")
                # Создаем тестовые данные
                gifts_data = create_test_data()
                
                return jsonify({
                    "success": True,
                    "message": f"Created {len(gifts_data['gifts'])} test gifts due to API error",
                    "lastUpdated": gifts_data["lastUpdated"],
                    "isTestData": True,
                    "error": str(api_error)
                })
        
        except Exception as api_error:
            logger.error(f"Ошибка при обновлении подарков через API: {api_error}")
            
            # Создаем тестовые данные
            gifts_data = create_test_data()
            
            return jsonify({
                "success": True,
                "message": f"Created {len(gifts_data['gifts'])} test gifts",
                "lastUpdated": gifts_data["lastUpdated"],
                "isTestData": True
            })
    
    except Exception as e:
        logger.error(f"Ошибка при обработке запроса: {e}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

# Маршрут для покупки подарка
@app.route('/api/fragment/buy', methods=['POST'])
def buy_gift():
    try:
        data = request.json
        gift_id = data.get('giftId')
        recipient = data.get('recipient')
        
        if not gift_id:
            return jsonify({
                "success": False,
                "error": "Gift ID is required"
            }), 400
        
        if not recipient:
            return jsonify({
                "success": False,
                "error": "Recipient is required"
            }), 400
        
        logger.info(f"Запрос на покупку подарка с ID: {gift_id} для получателя: {recipient}")
        
        try:
            # Пытаемся купить подарок через API
            try:
                result = fragment.buy_gift(fragment_client, gift_id, recipient)
                
                if result and result.get('success'):
                    return jsonify({
                        "success": True,
                        "message": f"Gift {gift_id} successfully purchased and sent to {recipient}",
                        "transactionId": result.get('transaction_id', 'unknown')
                    })
                else:
                    return jsonify({
                        "success": False,
                        "error": result.get('error', 'Unknown error')
                    }), 400
            except Exception as api_error:
                logger.error(f"Ошибка при покупке подарка через API: {api_error}")
                return jsonify({
                    "success": False,
                    "error": str(api_error)
                }), 400
        
        except Exception as api_error:
            logger.error(f"Ошибка при покупке подарка через API: {api_error}")
            
            # Симулируем успешную покупку для тестирования
            return jsonify({
                "success": True,
                "message": f"Simulated purchase of gift {gift_id} for {recipient}",
                "transactionId": "test_transaction_" + datetime.now().strftime("%Y%m%d%H%M%S"),
                "isSimulated": True
            })
    
    except Exception as e:
        logger.error(f"Ошибка при обработке запроса: {e}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

# Запуск приложения
if __name__ == '__main__':
    # Создаем тестовые данные при первом запуске, если файл не существует
    if not os.path.exists(GIFTS_DATA_PATH):
        create_test_data()
    
    # Запускаем приложение
    app.run(host='0.0.0.0', port=5000, debug=True)