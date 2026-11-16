from typing import Optional
from fastapi import APIRouter, Query
from database import db

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("/hotspots")
async def get_incident_hotspots(
    year: Optional[int] = Query(None),
    month: Optional[int] = Query(None),
    incident_type: Optional[str] = Query(None),
    status: Optional[str] = Query("resolved"),
):
    match_stage = {}
    if status and status != "all":
        match_stage["status"] = status
    if year:
        match_stage["year"] = year
    if month:
        match_stage["month"] = month
    if incident_type and incident_type != "all":
        match_stage["incident_type"] = incident_type.upper()

    pipeline = [
        {"$match": match_stage},
        {
            "$group": {
                "_id": "$barangay",
                "total_incidents": {"$sum": 1},
                "longitude": {"$first": {"$arrayElemAt": ["$location.coordinates", 0]}},
                "latitude": {"$first": {"$arrayElemAt": ["$location.coordinates", 1]}},
                "landmark_reference": {"$first": "$landmark_reference"},
                "incident_types": {"$push": "$incident_type"},
            }
        },
        {"$sort": {"total_incidents": -1}},
    ]

    results = []
    async for doc in db["incidents"].aggregate(pipeline):
        type_counts = {}
        for t in doc.get("incident_types", []):
            key = t or "OTHERS"
            type_counts[key] = type_counts.get(key, 0) + 1

        top_type = max(type_counts.items(), key=lambda x: x[1])[0] if type_counts else "N/A"
        count = doc["total_incidents"]

        results.append({
            "barangay": doc["_id"] or "Unknown",
            "total_incidents": count,
            "latitude": doc.get("latitude") or 0.0,
            "longitude": doc.get("longitude") or 0.0,
            "landmark_reference": doc.get("landmark_reference") or "",
            "top_incident_type": top_type,
            "breakdown": type_counts,
        })

    if not results:
        return []

    max_count = results[0]["total_incidents"]
    for item in results:
        ratio = item["total_incidents"] / max_count if max_count > 0 else 0
        if ratio >= 0.65:
            item["risk_level"] = "high"
        elif ratio >= 0.30:
            item["risk_level"] = "moderate"
        else:
            item["risk_level"] = "low"

    return results