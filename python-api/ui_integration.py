from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import asyncio
import json
from telethon import TelegramClient
from telethon.sessions import StringSession
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# Telegram API credentials from environment variables
API_ID = os.getenv('API_ID')
API_HASH = os.getenv('API_HASH')
SESSION_STRING = os.getenv('TELEGRAM_SESSION', '')

# Global client variable
client = None

async def init_telegram_client():
    """Initialize Telegram client"""
    global client
    try:
        if SESSION_STRING:
            client = TelegramClient(StringSession(SESSION_STRING), API_ID, API_HASH)
        else:
            client = TelegramClient('session', API_ID, API_HASH)
        
        await client.start()
        logger.info("Telegram client initialized successfully")
        return True
    except Exception as e:
        logger.error(f"Failed to initialize Telegram client: {e}")
        return False

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'ok',
        'service': 'telegram-parser-api',
        'client_connected': client is not None and client.is_connected() if client else False
    })

@app.route('/auth/status', methods=['GET'])
def auth_status():
    """Check authentication status"""
    try:
        if client and client.is_connected():
            return jsonify({
                'authenticated': True,
                'session_exists': bool(SESSION_STRING)
            })
        else:
            return jsonify({
                'authenticated': False,
                'session_exists': bool(SESSION_STRING)
            })
    except Exception as e:
        return jsonify({
            'authenticated': False,
            'error': str(e)
        }), 500

@app.route('/channels/parse', methods=['POST'])
def parse_channel():
    """Parse a Telegram channel"""
    try:
        data = request.get_json()
        channel_url = data.get('channel_url')
        limit = data.get('limit', 100)
        
        if not channel_url:
            return jsonify({'error': 'Channel URL is required'}), 400
        
        # For now, return mock data
        # In a real implementation, you would use the Telegram client here
        mock_messages = [
            {
                'id': i,
                'text': f'Sample message {i}',
                'date': '2024-01-01T12:00:00Z',
                'views': 100 + i * 10,
                'forwards': 5 + i
            }
            for i in range(1, min(limit + 1, 21))
        ]
        
        return jsonify({
            'success': True,
            'channel': channel_url,
            'messages': mock_messages,
            'total': len(mock_messages)
        })
        
    except Exception as e:
        logger.error(f"Error parsing channel: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/export/excel', methods=['POST'])
def export_to_excel():
    """Export data to Excel format"""
    try:
        data = request.get_json()
        messages = data.get('messages', [])
        
        # Mock Excel export
        return jsonify({
            'success': True,
            'download_url': '/api/download/export.xlsx',
            'filename': 'telegram_export.xlsx'
        })
        
    except Exception as e:
        logger.error(f"Error exporting to Excel: {e}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    # Initialize Telegram client if credentials are available
    if API_ID and API_HASH:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        loop.run_until_complete(init_telegram_client())
    else:
        logger.warning("Telegram API credentials not found. Running in mock mode.")
    
    port = int(os.getenv('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)
