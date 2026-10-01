from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from db.db import Base, engine
from models.Organization import Organization
from routes.auth import router as auth_router
from routes.organization import router as organization_router
from routes.task import router as task_router
from sqlalchemy import inspect


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
app.include_router(organization_router)
Base.metadata.create_all(bind=engine)


def migrate_legacy_schema():
	with engine.begin() as connection:
		for table_name, column_name, column_type in (
			("tasks", "created_by_id", "INTEGER REFERENCES users(_id)"),
		):
			columns = {column["name"] for column in inspect(connection).get_columns(table_name)}
			if column_name not in columns:
				connection.exec_driver_sql(
					f"ALTER TABLE {table_name} ADD COLUMN {column_name} {column_type}"
				)
		connection.exec_driver_sql(
			"""
			INSERT OR IGNORE INTO organizations (id, name, created_at)
			SELECT org_id, 'Organization ' || org_id, CURRENT_TIMESTAMP
			FROM users WHERE org_id IS NOT NULL
			"""
		)
		connection.exec_driver_sql(
			"""
			INSERT OR IGNORE INTO organizations (id, name, created_at)
			SELECT org_id, 'Organization ' || org_id, CURRENT_TIMESTAMP
			FROM tasks WHERE org_id IS NOT NULL
			"""
		)


migrate_legacy_schema()

