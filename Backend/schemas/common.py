# Import tools for working with dates, times, and time zones.
from datetime import datetime, timezone

# Import tools for defining a list and allowed values.
from typing import List, Literal

# Import tools for creating data models and checking input values.
from pydantic import BaseModel, field_validator


# Get the current date and time using UTC.
def utcnow() -> datetime:
    return datetime.now(timezone.utc)


# Define a model for storing a geographic location.
class GeoPoint(BaseModel):
    # This represents a GeoJSON Point.
    # Coordinates must be in [longitude, latitude] order.
    type: Literal["Point"] = "Point"

    # Store the longitude and latitude as a list of numbers.
    coordinates: List[float]

    # Check if the coordinates are valid.
    @field_validator("coordinates")
    @classmethod
    def check_coordinates(cls, v):
        # Make sure there are exactly two values.
        if len(v) != 2:
            raise ValueError("coordinates must be [longitude, latitude]")

        # Assign the first value to longitude and the second to latitude.
        lng, lat = v

        # Check if the longitude is within the valid range.
        if not (-180 <= lng <= 180):
            raise ValueError("longitude must be between -180 and 180")

        # Check if the latitude is within the valid range.
        if not (-90 <= lat <= 90):
            raise ValueError("latitude must be between -90 and 90")

        # Convert both coordinate values into floating-point numbers.
        return [float(lng), float(lat)]
