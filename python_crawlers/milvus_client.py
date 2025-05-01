from pymilvus import connections, Collection, ...
from transformers import CLIPProcessor, CLIPModel
from sentence_transformers import SentenceTransformer
from PIL import Image
import requests
import io
import numpy as np

class MilvusClient:
    def __init__(self, host='milvus', port='19530'):
        connections.connect(alias="default", host=host, port=port)
        self.clip_model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32")
        self.clip_processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")
        self.text_model = SentenceTransformer('all-MiniLM-L6-v2')
        self.image_collection = self._create_image_collection()   # 512 dim
        self.text_collection = self._create_text_collection()     # 384 dim
        # ...

    # create_image_collection, create_text_collection, insert_image_vector, insert_text_vector ...
