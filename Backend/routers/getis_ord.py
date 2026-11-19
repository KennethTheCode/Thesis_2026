from typing import Optional
import numpy as np
from esda.getisord import G_Local
from fastapi import APIRouter, HTTPException, Query
from libpysal.weights import KNN, fill_diagonal

from database import db

router = APIRouter(prefix="/analytics/getis-ord", tags=["Spatial Hotspot Analysis"])

# Official 24 Barangays of the City of Biñan, Laguna (Geographic Centroids)
BINAN_BARANGAY_COORDINATES = {
    "Biñan":         {"lat": 14.3372, "lon": 121.0811},
    "Bungahan":      {"lat": 14.3039, "lon": 121.0642},
    "Canlalay":      {"lat": 14.3492, "lon": 121.0736},
    "Casile":        {"lat": 14.3168, "lon": 121.0451},
    "De La Paz":     {"lat": 14.3435, "lon": 121.0924},
    "Ganado":        {"lat": 14.3182, "lon": 121.0689},
    "Langkiwa":      {"lat": 14.2947, "lon": 121.0628},
    "Loma":          {"lat": 14.2874, "lon": 121.0745},
    "Malaban":       {"lat": 14.3511, "lon": 121.0878},
    "Malamig":       {"lat": 14.2825, "lon": 121.0579},
    "Mamplasan":     {"lat": 14.3069, "lon": 121.0526},
    "Platero":       {"lat": 14.3426, "lon": 121.0731},
    "Poblacion":     {"lat": 14.3385, "lon": 121.0802},
    "San Antonio":   {"lat": 14.3314, "lon": 121.0768},
    "San Francisco": {"lat": 14.3125, "lon": 121.0794},
    "San Jose":      {"lat": 14.3358, "lon": 121.0854},
    "San Vicente":   {"lat": 14.3264, "lon": 121.0782},
    "Santo Domingo": {"lat": 14.3229, "lon": 121.0715},
    "Santo Niño":    {"lat": 14.3321, "lon": 121.0886},
    "Santo Tomas":   {"lat": 14.3018, "lon": 121.0819},
    "Soro-Soro":     {"lat": 14.3112, "lon": 121.0912},
    "Timbao":        {"lat": 14.2916, "lon": 121.0798},
    "Tubigan":       {"lat": 14.3248, "lon": 121.0867},
    "Zapote":        {"lat": 14.3275, "lon": 121.0634},
}

# 2020 PSA Official Population per Barangay (for optional population-normalized rates per 10,000 residents)
PSA_2020_POPULATION = {
    "Biñan": 4564,
    "Bungahan": 1957,
    "Canlalay": 21242,
    "Casile": 3992,
    "De La Paz": 33379,
    "Ganado": 5192,
    "Langkiwa": 35116,
    "Loma": 12217,
    "Malaban": 28479,
    "Malamig": 4912,
    "Mamplasan": 6267,
    "Platero": 13447,
    "Poblacion": 4844,
    "San Antonio": 39815,
    "San Francisco": 35920,
    "San Jose": 7569,
    "San Vicente": 16595,
    "Santo Domingo": 6983,
    "Santo Niño": 9145,
    "Santo Tomas": 37412,
    "Soro-Soro": 6164,
    "Timbao": 19453,
    "Tubigan": 8664,
    "Zapote": 32418,
}

BARANGAY_ALIASES = {
    "binan": "Biñan",
    "biñan (poblacion)": "Biñan",
    "poblacion": "Poblacion",
    "san francisco (halang)": "San Francisco",
    "halang": "San Francisco",
    "santo nino": "Santo Niño",
    "sto. niño": "Santo Niño",
    "sto. nino": "Santo Niño",
    "sto niño": "Santo Niño",
    "sto nino": "Santo Niño",
    "sto. tomas": "Santo Tomas",
    "sto tomas": "Santo Tomas",
    "sto. domingo": "Santo Domingo",
    "sto domingo": "Santo Domingo",
    "dela paz": "De La Paz",
    "de la paz": "De La Paz",
    "sorosoro": "Soro-Soro",
    "soro-soro": "Soro-Soro",
}


def _normalize_barangay_name(raw_name: str) -> Optional[str]:
    cleaned = raw_name.strip()
    lowered = cleaned.lower()
    if lowered in BARANGAY_ALIASES:
        return BARANGAY_ALIASES[lowered]
    for canonical in BINAN_BARANGAY_COORDINATES:
        if canonical.lower() == lowered:
            return canonical
    return None


def _classify_gi_star(z_score: float, p_value: float) -> dict:
    """
    Classifies Getis-Ord Gi* statistical significance at standard 95% and 99% confidence levels
    (p < 0.05 and |z| > 1.96).
    """
    if p_value < 0.05 and z_score > 1.96:
        if z_score >= 2.58:
            return {
                "classification": "Hotspot (99% Confidence)",
                "tier": "hotspot",
                "color": "#dc2626",
            }
        return {
            "classification": "Hotspot (95% Confidence)",
            "tier": "hotspot",
            "color": "#ea580c",
        }
    if p_value < 0.05 and z_score < -1.96:
        if z_score <= -2.58:
            return {
                "classification": "Coldspot (99% Confidence)",
                "tier": "coldspot",
                "color": "#1d4ed8",
            }
        return {
            "classification": "Coldspot (95% Confidence)",
            "tier": "coldspot",
            "color": "#3b82f6",
        }
    return {
        "classification": "Not Statistically Significant",
        "tier": "neutral",
        "color": "#94a3b8",
    }


@router.get("/hotspots")
async def compute_getis_ord_gi_star(
    incident_type: Optional[str] = Query(
        None,
        description="Optional filter (e.g., MEDICAL ASSISTANCE, VEHICULAR, FIRE)",
    ),
    year: Optional[int] = Query(
        None,
        description="Optional year filter (e.g., 2023, 2024, 2025)",
    ),
    use_normalized_rate: bool = Query(
        False,
        description="False = raw incident counts (default); True = incidents per 10,000 residents (PSA 2020)",
    ),
    k_neighbors: int = Query(
        3,
        ge=2,
        le=8,
        description="Number of nearest neighboring barangays for spatial weights (default k=3)",
    ),
    status_filter: str = Query(
        "pending_and_resolved",
        description="Filter by ticket status: 'pending_and_resolved' (default), 'pending', 'resolved', or 'all'",
    ),
):
    """
    Executes Getis-Ord Gi* local spatial autocorrelation directly from MongoDB incident
    counts and Biñan's 24 barangay centroid coordinates using K-Nearest Neighbors (KNN)
    spatial weights with self-inclusion (diagonal=1.0) and 999 conditional permutations.
    """
    match_stage: dict = {}
    normalized_status = (status_filter or "pending_and_resolved").strip().lower()

    if normalized_status == "pending_and_resolved":
        match_stage["status"] = {"$regex": "^(pending|resolved)$", "$options": "i"}
    elif normalized_status == "pending":
        match_stage["status"] = {"$regex": "^pending$", "$options": "i"}
    elif normalized_status == "resolved":
        match_stage["status"] = {"$regex": "^resolved$", "$options": "i"}
    # 'all' leaves match_stage["status"] unfiltered

    if incident_type and incident_type.strip().upper() != "ALL":
        match_stage["incident_type"] = {
            "$regex": f"^{incident_type.strip()}$",
            "$options": "i",
        }

    cursor = db["incidents"].find(
        match_stage,
        {"barangay": 1, "date": 1, "incident_date": 1, "year": 1, "_id": 0},
    )
    docs = await cursor.to_list(length=50000)

    counts_by_barangay = {brgy: 0 for brgy in BINAN_BARANGAY_COORDINATES}
    matched_records = 0

    for doc in docs:
        raw_brgy = doc.get("barangay")
        if not raw_brgy or not isinstance(raw_brgy, str):
            continue

        canonical_brgy = _normalize_barangay_name(raw_brgy)
        if not canonical_brgy:
            continue

        if year is not None:
            doc_year = doc.get("year")
            if doc_year is None:
                raw_date = str(doc.get("date") or doc.get("incident_date") or "").strip()
                if len(raw_date) >= 4 and raw_date[:4].isdigit():
                    doc_year = int(raw_date[:4])
                elif "/" in raw_date:
                    parts = raw_date.split(" ")[0].split("/")
                    if len(parts) == 3 and parts[-1].isdigit():
                        doc_year = int(parts[-1])
            if doc_year != year:
                continue

        counts_by_barangay[canonical_brgy] += 1
        matched_records += 1

    if matched_records == 0:
        raise HTTPException(
            status_code=404,
            detail="No matching MongoDB incident records found for the selected filters.",
        )

    barangays = list(BINAN_BARANGAY_COORDINATES.keys())
    coords = np.array(
        [[BINAN_BARANGAY_COORDINATES[b]["lon"], BINAN_BARANGAY_COORDINATES[b]["lat"]] for b in barangays],
        dtype=float,
    )

    raw_counts = [counts_by_barangay[b] for b in barangays]
    norm_rates = [
        round((cnt / PSA_2020_POPULATION[b]) * 10000.0, 2)
        for b, cnt in zip(barangays, raw_counts)
    ]

    values = np.array(norm_rates if use_normalized_rate else raw_counts, dtype=float)
    if np.std(values) == 0:
        raise HTTPException(
            status_code=400,
            detail="Zero variance across barangays; cannot compute Gi* z-scores.",
        )

    # Build row-standardized K-Nearest Neighbors weights matrix with self-inclusion on the diagonal
    weights = KNN.from_array(coords, k=k_neighbors)
    weights = fill_diagonal(weights, val=1.0)
    weights.transform = "r"

    np.random.seed(42)
    gi_star = G_Local(values, weights, transform="R", star=None, permutations=999)

    results = []
    for idx, brgy in enumerate(barangays):
        z_val = round(float(gi_star.Zs[idx]), 4)
        p_val = round(float(gi_star.p_sim[idx]), 4)
        status = _classify_gi_star(z_val, p_val)

        results.append({
            "barangay": brgy,
            "population_2020": PSA_2020_POPULATION[brgy],
            "incident_count": raw_counts[idx],
            "incident_rate_per_10k": norm_rates[idx],
            "gi_z_score": z_val,
            "p_value": p_val,
            "classification": status["classification"],
            "tier": status["tier"],
            "color": status["color"],
            "centroid": BINAN_BARANGAY_COORDINATES[brgy],
        })

    results.sort(key=lambda r: r["gi_z_score"], reverse=True)

    return {
        "parameters": {
            "weights_type": f"K-Nearest Neighbors (k={k_neighbors}, Self-Included, Row-Standardized)",
            "metric": "Rate per 10,000 Residents (PSA 2020)" if use_normalized_rate else "Raw Incident Count",
            "status_filter": normalized_status,
            "significance_threshold": "p < 0.05 and |z| > 1.96",
            "permutations": 999,
            "total_records_analyzed": matched_records,
        },
        "summary": {
            "total_barangays": len(results),
            "hotspot_count": sum(1 for r in results if r["tier"] == "hotspot"),
            "coldspot_count": sum(1 for r in results if r["tier"] == "coldspot"),
            "not_significant_count": sum(1 for r in results if r["tier"] == "neutral"),
        },
        "barangays": results,
    }