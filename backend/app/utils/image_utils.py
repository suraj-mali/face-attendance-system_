import base64
import numpy as np
import cv2

def base64_to_numpy(base64_string: str) -> np.ndarray:
    if "," in base64_string:
        base64_string = base64_string.split(",")[1]
    img_bytes = base64.b64decode(base64_string)
    nparr = np.frombuffer(img_bytes, np.uint8)
    return cv2.imdecode(nparr, cv2.IMREAD_COLOR)

def bytes_to_numpy(image_bytes: bytes) -> np.ndarray:
    nparr = np.frombuffer(image_bytes, np.uint8)
    return cv2.imdecode(nparr, cv2.IMREAD_COLOR)

def numpy_to_base64(img: np.ndarray) -> str:
    _, buffer = cv2.imencode('.jpg', img)
    return base64.b64encode(buffer).decode('utf-8')

def resize_image(img: np.ndarray, max_width: int = 640) -> np.ndarray:
    h, w = img.shape[:2]
    if w > max_width:
        ratio = max_width / w
        img = cv2.resize(img, (max_width, int(h * ratio)))
    return img

def validate_image_quality(img: np.ndarray) -> tuple[bool, str]:
    if img is None:
        return False, "Could not decode image"
    h, w = img.shape[:2]
    if w < 200 or h < 200:
        return False, "Image too small — minimum 200x200"
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    if cv2.Laplacian(gray, cv2.CV_64F).var() < 50:
        return False, "Image too blurry — improve lighting"
    return True, "OK"