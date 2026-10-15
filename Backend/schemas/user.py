# (LIZ) 
# Sample lang to liz pwede mo dagdagan pwede rin bawasan, Depende sa data na need hingiin. 
# Para lang table to, pero collection tawag 
# Example next data natin puro accidents naman, gawa ka lang isa pang file pero sa next collection 
#(ex. accidents.py)

# (MIGZ) 
# Dito ka mag base palagi kung ano lalagay na data ni liz, ayun lalagay mo sa pang backend.


from pydantic import BaseModel, Field

class UserCreate(BaseModel):          # what the client sends
    username: str = Field(min_length=4, max_length=30)
    password: str = Field(min_length=8)
    contact_number: str
    address: str

class UserOut(BaseModel):             # what we send back (no password!)
    id: str
    username: str
    contact_number: str
    status: str