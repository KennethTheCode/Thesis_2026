from pydantic_settings import BaseSettings, SettingsConfigDict

# WAG GAGALAWIN
class Settings(BaseSettings):
    mongodb_url: str
    db_name: str
    model_config = SettingsConfigDict(env_file=".env")

settings = Settings()