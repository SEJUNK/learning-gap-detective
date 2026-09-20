from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Environment-based application configuration.

    Values are read from environment variables / a .env file so that
    deployment targets (local, staging, prod) can differ without code
    changes. See backend/.env.example for the supported keys.
    """

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_name: str = "Learning Gap Detective API"
    environment: str = "development"
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
