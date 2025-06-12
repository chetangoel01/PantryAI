from PIL import Image
import pytesseract
from utils.logger import logger

def extract_text(image_file) -> str:
    img = Image.open(image_file)
    text = pytesseract.image_to_string(img)
    logger.debug(f"OCR output: {text}")
    return text