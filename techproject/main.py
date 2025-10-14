from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import JSONResponse
import torch
import torch.nn as nn
from transformers import AutoImageProcessor, AutoModelForImageClassification
from PIL import Image
import io
import numpy as np
import cv2
from typing import Dict, Any
import json
import os
import argparse
import asyncio
from aiogram import Bot
from aiogram.types import BufferedInputFile
from contextlib import asynccontextmanager
from dotenv import load_dotenv

# Load .env for both API and CLI modes
load_dotenv()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Load models once at startup; removes on_event deprecation warning
    # Load .env before anything else
    load_models()
    yield

app = FastAPI(title="Image Analysis API", description="API for image analysis using ViT and Swin models", lifespan=lifespan)

class_names = {
    0: "Excellent",
    1: "Good", 
    2: "Fair",
    3: "Poor",
    4: "Scrap"
}

vit_processor = None
vit_model = None
swin_processor = None
swin_model = None

def _cleanup_state_dict_keys(state_dict: dict) -> dict:
    return { (k.replace('module.', '') if k.startswith('module.') else k): v for k, v in state_dict.items() }

def build_vit_model(num_classes: int = 5):
    processor = AutoImageProcessor.from_pretrained("google/vit-base-patch16-224", use_fast=True)
    model = AutoModelForImageClassification.from_pretrained("google/vit-base-patch16-224")
    model.classifier = nn.Linear(in_features=768, out_features=num_classes)
    model.eval()
    return processor, model

def build_swin_model(num_classes: int = 2):
    processor = AutoImageProcessor.from_pretrained("microsoft/swin-tiny-patch4-window7-224", use_fast=True)
    model = AutoModelForImageClassification.from_pretrained("microsoft/swin-tiny-patch4-window7-224")
    model.classifier = nn.Linear(in_features=768, out_features=num_classes)
    model.eval()
    return processor, model

def load_weights(model: nn.Module, path: str) -> None:
    obj = torch.load(path, map_location="cpu")
    if isinstance(obj, dict) and 'state_dict' in obj:
        state = _cleanup_state_dict_keys(obj['state_dict'])
        try:
            model.load_state_dict(state, strict=True)
        except Exception:
            model.load_state_dict(state, strict=False)
    elif isinstance(obj, dict):
        state = _cleanup_state_dict_keys(obj)
        try:
            model.load_state_dict(state, strict=True)
        except Exception:
            model.load_state_dict(state, strict=False)
    elif isinstance(obj, nn.Module):
        model.load_state_dict(obj.state_dict(), strict=False)
    else:
        raise ValueError("Неизвестный формат весов модели")

def load_models():
    """Загрузка моделей ViT (5 классов) и Swin (бинарная)"""
    global vit_processor, vit_model, swin_processor, swin_model
    try:
        vit_processor, vit_model = build_vit_model(num_classes=5)
        load_weights(vit_model, 'model/best_convnext_large_model-2.pth')
        
        swin_processor, swin_model = build_swin_model(num_classes=2)
        load_weights(swin_model, 'model/best_binary_model-2.pth')
        
        print("ViT и Swin модели успешно загружены")
    except Exception as e:
        print(f"Ошибка при загрузке моделей: {e}")
        raise e

def preprocess_image(image_bytes: bytes) -> Image.Image:
    """Загружает изображение и приводит к RGB."""
    try:
        image = Image.open(io.BytesIO(image_bytes)).convert('RGB')
        return image
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Ошибка при обработке изображения: {str(e)}")

def analyze_color_properties(image: Image.Image) -> Dict[str, Any]:
    """Basic color properties analysis (hue, brightness, saturation)."""
    try:
        img_array = np.array(image)
        
        hsv = cv2.cvtColor(img_array, cv2.COLOR_RGB2HSV)
        mean_hue = np.mean(hsv[:, :, 0])
        
        if mean_hue < 15 or mean_hue > 165:
            hue_name = "Red"
        elif 15 <= mean_hue < 45:
            hue_name = "Orange"
        elif 45 <= mean_hue < 75:
            hue_name = "Yellow"
        elif 75 <= mean_hue < 105:
            hue_name = "Green"
        elif 105 <= mean_hue < 135:
            hue_name = "Cyan"
        elif 135 <= mean_hue < 165:
            hue_name = "Blue"
        else:
            hue_name = "Undefined"
        
        gray = cv2.cvtColor(img_array, cv2.COLOR_RGB2GRAY)
        brightness = np.mean(gray)
        
        if brightness < 85:
            brightness_name = "Dark"
            brightness_category_ru = "Затемнённо (лучше переделать фото)"
        elif brightness < 170:
            brightness_name = "Medium"
            brightness_category_ru = "Нормальная яркость"
        else:
            brightness_name = "Light"
            brightness_category_ru = "Отличная яркость"
        
        saturation = np.mean(hsv[:, :, 1])
        if saturation < 50:
            saturation_name = "Desaturated"
        elif saturation < 150:
            saturation_name = "Moderately saturated"
        else:
            saturation_name = "Saturated"
        
        return {
            "hue": hue_name,
            "color": f"{brightness_name} {hue_name}",
            "brightness": brightness,
            "brightness_category": brightness_category_ru,
            "saturation": saturation_name
        }
        
    except Exception as e:
        return {
            "hue": "Undefined",
            "color": "Undefined",
            "brightness": 0,
            "brightness_category": "Неопределённо",
            "saturation": "Undefined"
        }

def predict_with_models(pil_image: Image.Image) -> Dict[str, Any]:
    """Prediction using ViT (quality) and Swin (defects)."""
    try:
        with torch.no_grad():
            
            vit_inputs = vit_processor(images=pil_image, return_tensors="pt")
            vit_outputs = vit_model(**vit_inputs)
            vit_logits = vit_outputs.logits  # [1,5]
            vit_probs = torch.softmax(vit_logits, dim=1)
            vit_pred = torch.argmax(vit_probs, dim=1).item()
            class_name = class_names.get(vit_pred, str(vit_pred))

            
            swin_inputs = swin_processor(images=pil_image, return_tensors="pt")
            swin_outputs = swin_model(**swin_inputs)
            swin_logits = swin_outputs.logits  # [1,2]
            swin_probs = torch.softmax(swin_logits, dim=1)
            swin_pred = torch.argmax(swin_probs, dim=1).item()
            has_defects = swin_pred == 0

            return {
                "class_name": class_name,
                "defects": "yes" if has_defects else "no"
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка при предсказании: {str(e)}")

@app.post("/analyze_image")
async def analyze_image(file: UploadFile = File(...)):
    """Analyze an image using two models."""
    try:
        if not file.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="File must be an image")
        
      
        image_bytes = await file.read()
        
    
        pil_image = preprocess_image(image_bytes)
        
        predictions = predict_with_models(pil_image)
        

        color_analysis = analyze_color_properties(pil_image)
  
        file_extension = file.filename.split('.')[-1].lower() if '.' in file.filename else 'unknown'
        width, height = pil_image.size
        size_str = f"{width}x{height}"
        
        result = {
            "class_name": predictions["class_name"],
            "defects": predictions["defects"],
            "type": file_extension,
            "size": size_str,
            "hue": color_analysis["hue"],
            "color": color_analysis["color"],
            "additional_info": {
                "brightness": round(color_analysis["brightness"], 2),
                "brightness_category": color_analysis.get("brightness_category"),
                "saturation": color_analysis["saturation"]
            }
        }
        
        try:
            send_to_tg = os.getenv("SEND_TO_TG_DEFAULT", "false").lower() == "true"
            if send_to_tg:
                await send_result_to_telegram(result, image_bytes, file.filename)
        except Exception:
            pass
        return JSONResponse(content=result)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Внутренняя ошибка сервера: {str(e)}")

@app.get("/")
async def root():
    """Root endpoint"""
    return {"message": "Image Analysis API is up and running"}

@app.get("/health")
async def health_check():
    """Health check"""
    return {
        "status": "healthy",
        "models_loaded": vit_model is not None and swin_model is not None
    }

def analyze_image_from_path(image_path: str) -> Dict[str, Any]:
    with open(image_path, 'rb') as f:
        image_bytes = f.read()
    pil_image = preprocess_image(image_bytes)
    predictions = predict_with_models(pil_image)
    color_analysis = analyze_color_properties(pil_image)
    file_extension = os.path.splitext(image_path)[1].lower().lstrip('.') or 'unknown'
    width, height = pil_image.size
    size_str = f"{width}x{height}"
    result = {
        "class_name": predictions["class_name"],
        "defects": predictions["defects"],
        "type": file_extension,
        "size": size_str,
        "hue": color_analysis["hue"],
        "color": color_analysis["color"],
        "additional_info": {
            "brightness": round(color_analysis["brightness"], 2),
            "brightness_category": color_analysis.get("brightness_category"),
            "saturation": color_analysis["saturation"]
        }
    }
    return result

async def send_result_to_telegram(result: Dict[str, Any], image_bytes: bytes | None, filename: str | None = None) -> None:
    token = os.getenv("TELEGRAM_BOT_TOKEN")
    chat_id = os.getenv("TELEGRAM_CHAT_ID")
    debug = os.getenv("SEND_TG_DEBUG", "false").lower() == "true"
    if not token or not chat_id:
        if debug:
            print("[TG DEBUG] Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID; skip sending")
        return
    bot = Bot(token=token)
    # Русский формат с зелёными эмодзи и HTML
    def _ru_quality(name: str) -> str:
        m = {"Excellent": "Отлично", "Good": "Хорошо", "Fair": "Неплохо", "Poor": "Плохо", "Scrap": "Отход"}
        return m.get(name, name)
    def _ru_hue(h: str) -> str:
        m = {"Red": "Красный", "Orange": "Оранжевый", "Yellow": "Жёлтый", "Green": "Зелёный", "Cyan": "Голубой", "Blue": "Синий", "Undefined": "Неопределённый"}
        return m.get(h, h)
    def _ru_color(c: str) -> str:
        parts = (c or "").split()
        if len(parts) == 2:
            b_en, h_en = parts
            b_ru = {"Light": "Светлый", "Medium": "Средний", "Dark": "Тёмный"}.get(b_en, b_en)
            return f"{b_ru} {_ru_hue(h_en)}"
        return _ru_hue(c or "")
    info = result.get('additional_info', {})
    caption = (
        f"✅ <b>Здравствуйте, результаты анализа готовы!</b>\n\n"
        f"🟩<b>Класс качества:</b> {_ru_quality(result.get('class_name'))}\n"
        f"{'-' if result.get('defects') == 'no' else '🔴'} <b>Дефекты:</b> {'Нет' if result.get('defects') == 'no' else 'Есть'}\n"
        f"- <b>Тип:</b> {result.get('type')}\n"
        f"- <b>Размер:</b> {result.get('size')}\n"
        f"- <b>Оттенок:</b> {_ru_hue(result.get('hue'))}\n"
        f"- <b>Цвет:</b> {_ru_color(result.get('color'))}\n"
        f"- <b>Яркость:</b> {info.get('brightness_category')}\n"
    )
    try:
        if debug:
            safe_token = (token[:8] + "...") if len(token) > 8 else token
            print(f"[TG DEBUG] Sending to chat_id={chat_id}, token={safe_token}, has_image={bool(image_bytes)}")
        if image_bytes:
            photo = BufferedInputFile(image_bytes, filename=filename or "image.jpg")
            await bot.send_photo(chat_id=chat_id, photo=photo, caption=caption[:1024], parse_mode="HTML")
            if len(caption) > 1024:
                await bot.send_message(chat_id=chat_id, text=caption, parse_mode="HTML")
        else:
            await bot.send_message(chat_id=chat_id, text=caption, parse_mode="HTML")
        if debug:
            print("[TG DEBUG] Sent successfully")
    except Exception as e:
        if debug:
            print(f"[TG DEBUG] Send failed: {repr(e)}")
    finally:
        await bot.session.close()

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Image Analysis API - server/CLI")
    parser.add_argument('--image', type=str, help='Path to image for analysis')
    parser.add_argument('--host', type=str, default='0.0.0.0', help='Server host')
    parser.add_argument('--port', type=int, default=8000, help='Server port')
    parser.add_argument('--send-tg', action='store_true', help='Send result to Telegram (requires TELEGRAM_CHAT_ID env)')
    # Убрали передачу токенов через флаги: используем только переменные окружения
    args = parser.parse_args()

    # Explicitly load models for CLI mode (server mode loads via lifespan)
    load_models()

    if args.image:
        result = analyze_image_from_path(args.image)
        print(json.dumps(result, ensure_ascii=False, indent=2))
        if args.send_tg:
            try:
                with open(args.image, 'rb') as _f:
                    image_bytes_cli = _f.read()
            except Exception:
                image_bytes_cli = None
            asyncio.run(send_result_to_telegram(result, image_bytes_cli, os.path.basename(args.image)))
    else:
        import uvicorn
        uvicorn.run(app, host=args.host, port=args.port)
