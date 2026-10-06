from fastapi import APIRouter

from app.api.v1 import auth, support, words

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(words.router, prefix="/words", tags=["words"])
api_router.include_router(support.router, tags=["support"])
