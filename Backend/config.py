from pydantic_settings import BaseSettings, SettingsConfigDict

# WAG GAGALAWIN
class Settings(BaseSettings):
    mongodb_url: str
    db_name: str

    # T05: login tokens
    jwt_secret: str
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 60

    model_config = SettingsConfigDict(env_file=".env")

settings = Settings()