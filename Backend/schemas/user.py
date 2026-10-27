from pydantic import BaseModel, EmailStr, Field


class UserCreate(BaseModel):
    username: str = Field(..., min_length=4, max_length=30)
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=72)
    contact_number: str
    address: str


class UserOut(BaseModel):
    id: str
    username: str
    email: EmailStr | None = None
    contact_number: str
    address: str
    status: str
    role: str | None = None