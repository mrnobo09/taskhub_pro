from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from db.db import Base, engine
from routes.auth import router as auth_router
from routes.task import router as task_router


app = FastAPI(title="TaskHub API")
app.add_middleware(
	CORSMiddleware,
	allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
	allow_credentials=True,
	allow_methods=["*"],
	allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(task_router)
Base.metadata.create_all(bind=engine)

