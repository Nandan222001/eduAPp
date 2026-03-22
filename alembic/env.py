from logging.config import fileConfig
from sqlalchemy import engine_from_config
from sqlalchemy import pool
from alembic import context
from src.config import settings
from src.database import Base
import importlib.util
from pathlib import Path

models_dir = Path(__file__).resolve().parent.parent / "src" / "models"
for path in sorted(models_dir.glob("*.py")):
    if path.name == "__init__.py" or path.name.startswith("_"):
        continue
    module_name = f"_alembic_src_models_{path.stem}"
    try:
        spec = importlib.util.spec_from_file_location(module_name, str(path))
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
    except Exception:
        pass

config = context.config

config.set_main_option("sqlalchemy.url", settings.database_url)

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


def run_migrations_offline() -> None:
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        render_as_batch=True,
        compare_type=True,
        compare_server_default=True,
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            render_as_batch=True,
            compare_type=True,
            compare_server_default=True,
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
