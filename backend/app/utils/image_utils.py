def base64_to_numpy(base64_string: str):
  import base64, numpy as np, cv2
  try:
    if base64_string is None:
      return None
    if ',' in base64_string:
      base64_string = base64_string.split(',')[1]
    base64_string = base64_string.strip()
    img_bytes = base64.b64decode(base64_string)
    nparr = np.frombuffer(img_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if img is None:
      print('base64_to_numpy: cv2.imdecode returned None')
    return img
  except Exception as e:
    print(f'base64_to_numpy error: {e}')
    return None

def resize_image(img, max_width: int = 640):
  import cv2
  if img is None:
    return None
  h, w = img.shape[:2]
  if w <= max_width:
    return img
  ratio = max_width / w
  return cv2.resize(img, (max_width, int(h * ratio)))

def validate_image_quality(img) -> tuple:
  import cv2
  if img is None:
    return False, 'Image is None'
  h, w = img.shape[:2]
  if w < 80 or h < 80:
    return False, 'Image too small'
  gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
  if cv2.Laplacian(gray, cv2.CV_64F).var() < 15:
    return False, 'Image too blurry'
  return True, 'OK'