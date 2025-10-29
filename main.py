from fastapi import FastAPI
from pydantic import BaseModel
from typing import Optional

# Pydantic modeli: Gelen POST request'inin gövdesini (body)
# doğrulamak ve tanımlamak için kullanılır.
class Item(BaseModel):
    name: str
    description: Optional[str] = None # Opsiyonel alan
    price: float
    tax: Optional[float] = None # Opsiyonel alan

# FastAPI uygulamasını başlat
app = FastAPI()

# Kök (root) endpoint: GET request
@app.get("/")
def read_root():
    return {"message": "Merhaba, FastAPI API çalışıyor!"}

# Path parameter (yol parametresi) ile GET request
@app.get("/items/{item_id}")
def read_item(item_id: int, q: Optional[str] = None):
    # Hem item_id (yoldan) hem de q (query string) alır
    # Örnek: /items/5?q=test
    return {"item_id": item_id, "q": q}

# Request body (Pydantic modeli) ile POST request
@app.post("/items/")
def create_item(item: Item):
    # Gelen 'item' verisi 'Item' modeline göre doğrulanır
    item_dict = item.dict()
    if item.tax:
        price_with_tax = item.price + item.tax
        item_dict.update({"price_with_tax": price_with_tax})
    
    return {"item_name": item.name, "item_price_with_tax": item_dict.get("price_with_tax", item.price)}