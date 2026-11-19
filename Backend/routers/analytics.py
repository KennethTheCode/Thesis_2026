from typing import Optional
from fastapi import APIRouter, Query
from database import db

router = APIRouter()

# Query matching incident documents with missing or placeholder fields
INCOMPLETE_RECORD_QUERY = {
    "$or": [
        {"barangay": {"$in": [None, "", "Unknown", "N/A"]}},
        {"barangay": {"$exists": False}},
        {"incident_type": {"$in": [None, "", "Unknown", "N/A"]}},
        {"incident_type": {"$exists": False}},
        {"landmark_reference": {"$in": [None, "", "N/A"]}},
        {"landmark_reference": {"$exists": False}},
        {"location": {"$in": [None, {}]}},
        {"location": {"$exists": False}},
        {"location.coordinates": {"$exists": False}},
        {"location.coordinates": {"$size": 0}},
    ]
}


def compute_1d_kmeans(spots: list[dict], k: int = 3, max_iter: int = 100) -> list[dict]:
    """
    Deterministic 1D K-Means clustering on barangay incident counts.
    Classifies barangays into Low, Moderate, and High risk tiers without relying on street-level GPS.
    """
    n = len(spots)
    if n == 0:
        return []

    # Sort descending by total_incidents so rank #1 is always highest volume
    spots.sort(key=lambda item: item["total_incidents"], reverse=True)

    unique_counts = sorted({s["total_incidents"] for s in spots})
    if len(unique_counts) < k:
        # Fallback if filtered subset has fewer than 3 distinct counts
        max_val = spots[0]["total_incidents"] or 1
        for s in spots:
            ratio = s["total_incidents"] / max_val
            if ratio >= 0.65:
                s["risk_level"] = "high"
                s["risk_label"] = "High Risk"
                s["cluster_id"] = 2
            elif ratio >= 0.30:
                s["risk_level"] = "moderate"
                s["risk_label"] = "Moderate Risk"
                s["cluster_id"] = 1
            else:
                s["risk_level"] = "low"
                s["risk_label"] = "Low Risk"
                s["cluster_id"] = 0
            s["cluster_centroid"] = float(s["total_incidents"])
        return spots

    # Deterministic centroid initialization: [min, median, max]
    sorted_vals = sorted(float(s["total_incidents"]) for s in spots)
    centroids = [
        sorted_vals[0],
        sorted_vals[n // 2],
        sorted_vals[-1],
    ]

    assignments = [0] * n
    for _ in range(max_iter):
        changed = False
        clusters = [[] for _ in range(k)]

        for i, s in enumerate(spots):
            val = float(s["total_incidents"])
            nearest_idx = min(range(k), key=lambda c: abs(val - centroids[c]))
            if assignments[i] != nearest_idx:
                assignments[i] = nearest_idx
                changed = True
            clusters[nearest_idx].append(val)

        new_centroids = [
            (sum(clusters[c]) / len(clusters[c])) if clusters[c] else centroids[c]
            for c in range(k)
        ]

        if not changed and new_centroids == centroids:
            break
        centroids = new_centroids

    # Order clusters from lowest centroid (0 = Low) to highest centroid (2 = High)
    ordered_cluster_indices = sorted(range(k), key=lambda c: centroids[c])
    rank_map = {orig_idx: tier for tier, orig_idx in enumerate(ordered_cluster_indices)}

    tier_meta = {
        2: ("high", "High Risk"),
        1: ("moderate", "Moderate Risk"),
        0: ("low", "Low Risk"),
    }

    for i, s in enumerate(spots):
        raw_cluster = assignments[i]
        tier = rank_map[raw_cluster]
        risk_level, risk_label = tier_meta[tier]
        s["cluster_id"] = tier
        s["risk_level"] = risk_level
        s["risk_label"] = risk_label
        s["cluster_centroid"] = round(centroids[raw_cluster], 2)

    return spots


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

        results.append({
            "barangay": doc["_id"] or "Unknown",
            "total_incidents": doc["total_incidents"],
            "latitude": doc.get("latitude") or 0.0,
            "longitude": doc.get("longitude") or 0.0,
            "landmark_reference": doc.get("landmark_reference") or "",
            "top_incident_type": top_type,
            "breakdown": type_counts,
        })

    if not results:
        return []

    return compute_1d_kmeans(results, k=3)


@router.get("/dashboard-summary")
async def get_dashboard_summary():
    """
    Returns live KPI counts for the BCDRRMO administrative dashboard:
    1. Active Incidents (pending or ongoing response)
    2. User Verification Requests (residents awaiting manual credential review)
    3. Incomplete Records (incidents with missing barangay, type, landmark, or coordinates)
    4. Resolved Incidents (completed cases)
    """
    active_incidents = await db["incidents"].count_documents({
        "status": {"$regex": "^(pending|in_progress|dispatched|verified)$", "$options": "i"}
    })

    verification_requests = await db["users"].count_documents({
        "$or": [
            {"verification_status": {"$regex": "^pending$", "$options": "i"}},
            {"is_verified": False},
        ]
    })

    incomplete_records = await db["incidents"].count_documents(INCOMPLETE_RECORD_QUERY)

    resolved_incidents = await db["incidents"].count_documents({
        "status": {"$regex": "^resolved$", "$options": "i"}
    })

    return {
        "active_incidents": active_incidents,
        "verification_requests": verification_requests,
        "incomplete_records": incomplete_records,
        "resolved_incidents": resolved_incidents,
    }


@router.get("/incomplete-records")
async def list_incomplete_records(limit: int = Query(100, ge=1, le=500)):
    """
    Lists incident documents that are missing key fields (barangay, incident_type,
    landmark_reference, or location coordinates) so admins can inspect and complete them.
    """
    cursor = db["incidents"].find(INCOMPLETE_RECORD_QUERY).limit(limit)
    records = []
    async for doc in cursor:
        missing_fields = []
        if not doc.get("barangay") or doc.get("barangay") in ("Unknown", "N/A"):
            missing_fields.append("barangay")
        if not doc.get("incident_type") or doc.get("incident_type") in ("Unknown", "N/A"):
            missing_fields.append("incident_type")
        if not doc.get("landmark_reference") or doc.get("landmark_reference") == "N/A":
            missing_fields.append("landmark_reference")
        coords = (doc.get("location") or {}).get("coordinates")
        if not coords or len(coords) < 2:
            missing_fields.append("location")

        doc["_id"] = str(doc["_id"])
        doc["missing_fields"] = missing_fields
        records.append(doc)

    return {
        "count": len(records),
        "records": records,
    }