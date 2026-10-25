# (LIZ) 
# Sample lang to liz pwede mo dagdagan pwede rin bawasan, Depende sa data na need hingiin. 
# Para lang table to, pero collection tawag 
# Example next data natin puro accidents naman, gawa ka lang isa pang file pero sa next collection 
#(ex. accidents.py)

# (MIGZ) 
# Dito ka mag base palagi kung ano lalagay na data ni liz, ayun lalagay mo sa pang backend.


import re
from typing import Literal, Optional

from pydantic import BaseModel, EmailStr, Field, field_validator

# Accepts 09XXXXXXXXX, +639XXXXXXXXX, 639XXXXXXXXX -> stored as 09XXXXXXXXX
# so the unique index on contact_number really catches duplicates.
_PH_MOBILE = re.compile(r"^(?:\+?63|0)(9\d{9})$")


class UserCreate(BaseModel):          # what the client sends
    username: str = Field(min_length=4, max_length=30)
    password: str = Field(min_length=8, max_length=72)   # 72 = bcrypt limit
    contact_number: str
    address: str = Field(min_length=3, max_length=200)
    email: EmailStr                                         # NEW (unique)

    @field_validator("username")
    @classmethod
    def clean_username(cls, v: str) -> str:
        v = v.strip().lower()          # lowercase so "Liz" and "liz" can't both exist
        if not re.fullmatch(r"[a-z0-9_.]{4,30}", v):
            raise ValueError("username may only contain letters, numbers, '_' and '.'")
        return v

    @field_validator("email")
    @classmethod
    def clean_email(cls, v: str) -> str:
        return v.strip().lower()

    @field_validator("contact_number")
    @classmethod
    def clean_contact(cls, v: str) -> str:
        digits = re.sub(r"[\s\-()]", "", v)
        m = _PH_MOBILE.fullmatch(digits)
        if not m:
            raise ValueError("enter a valid PH mobile number (e.g. 09171234567)")
        return "0" + m.group(1)

    @field_validator("address")
    @classmethod
    def clean_address(cls, v: str) -> str:
        return v.strip()


class UserOut(BaseModel):             # what we send back (no password!)
    id: str
    username: str
    contact_number: str
    status: str
    email: Optional[str] = None                                                  # NEW
    role: Literal["admin", "responder", "barangay_official", "citizen"] = "citizen"  # NEW