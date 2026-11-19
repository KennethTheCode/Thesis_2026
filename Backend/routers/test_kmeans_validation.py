import asyncio
import time
import math
from database import db
from routers.analytics import compute_1d_kmeans


def compute_silhouette_score_1d(spots: list[dict]) -> float:
    """Computes exact 1D Silhouette Coefficient across the k=3 risk clusters."""
    n = len(spots)
    if n < 3:
        return 0.0

    clusters = {}
    for s in spots:
        clusters.setdefault(s["cluster_id"], []).append(float(s["total_incidents"]))

    if len(clusters) < 2:
        return 0.0

    silhouette_vals = []
    for s in spots:
        val = float(s["total_incidents"])
        cid = s["cluster_id"]
        own_cluster = clusters[cid]

        # a(i): mean intra-cluster distance
        if len(own_cluster) <= 1:
            a_i = 0.0
        else:
            a_i = sum(abs(val - other) for other in own_cluster) / (len(own_cluster) - 1)

        # b(i): minimum mean distance to nearest neighboring cluster
        b_i = min(
            sum(abs(val - other) for other in members) / len(members)
            for other_cid, members in clusters.items()
            if other_cid != cid
        )

        denom = max(a_i, b_i)
        s_i = (b_i - a_i) / denom if denom > 0 else 0.0
        silhouette_vals.append(s_i)

    return round(sum(silhouette_vals) / n, 4)


def compute_wcss(spots: list[dict]) -> float:
    """Computes Within-Cluster Sum of Squares (Inertia)."""
    return round(
        sum((float(s["total_incidents"]) - float(s["cluster_centroid"])) ** 2 for s in spots),
        2,
    )


async def run_validation():
    pipeline = [
        {"$match": {"status": "resolved"}},
        {"$group": {"_id": "$barangay", "total_incidents": {"$sum": 1}}},
        {"$sort": {"total_incidents": -1}},
    ]

    raw_spots = []
    async for doc in db["incidents"].aggregate(pipeline):
        raw_spots.append({
            "barangay": doc["_id"] or "Unknown",
            "total_incidents": doc["total_incidents"],
        })

    if not raw_spots:
        print("No resolved incidents found in MongoDB.")
        return

    # 1. Benchmark execution speed & determinism across 10 runs
    runtimes_ms = []
    baseline_assignments = None
    deterministic = True

    for run in range(10):
        sample = [dict(item) for item in raw_spots]
        t0 = time.perf_counter()
        clustered = compute_1d_kmeans(sample, k=3)
        t1 = time.perf_counter()
        runtimes_ms.append((t1 - t0) * 1000)

        current_map = {s["barangay"]: s["risk_label"] for s in clustered}
        if baseline_assignments is None:
            baseline_assignments = current_map
        elif current_map != baseline_assignments:
            deterministic = False

    # 2. Compute evaluation metrics on final clustered output
    results = compute_1d_kmeans([dict(item) for item in raw_spots], k=3)
    sil_score = compute_silhouette_score_1d(results)
    wcss = compute_wcss(results)
    avg_ms = round(sum(runtimes_ms) / len(runtimes_ms), 4)

    print("\n" + "=" * 68)
    print("  RESQ:BINAN — 1D K-MEANS (k=3) ALGORITHM VALIDATION REPORT")
    print("=" * 68)
    print(f"  Total Barangays Evaluated : {len(results)}")
    print(f"  Total Incidents Analyzed  : {sum(s['total_incidents'] for s in results)}")
    print(f"  Silhouette Score          : {sil_score}  (Target: > 0.60)")
    print(f"  Within-Cluster SS (WCSS)  : {wcss}")
    print(f"  Determinism (10 Runs)     : {'PASS (100% Consistent)' if deterministic else 'FAIL'}")
    print(f"  Mean Execution Time       : {avg_ms} ms")
    print("=" * 68)

    # 3. Cluster Summary Table
    print("\n  CLUSTER SUMMARY:")
    print(f"  {'Tier':<16} {'Cluster ID':<12} {'Count':<8} {'Centroid (Mean)':<18} {'Incident Range'}")
    print("  " + "-" * 64)
    for tier_id in [2, 1, 0]:
        members = [s for s in results if s["cluster_id"] == tier_id]
        if members:
            label = members[0]["risk_label"]
            centroid = members[0]["cluster_centroid"]
            min_v = min(m["total_incidents"] for m in members)
            max_v = max(m["total_incidents"] for m in members)
            print(f"  {label:<16} {tier_id:<12} {len(members):<8} {centroid:<18} {min_v} – {max_v}")

    # 4. Full Barangay Classification Table
    print("\n  BARANGAY RISK CLASSIFICATION TABLE:")
    print(f"  {'Rank':<6} {'Barangay':<26} {'Incidents':<11} {'Assigned Risk':<16} {'Centroid'}")
    print("  " + "-" * 64)
    for idx, s in enumerate(results, start=1):
        print(
            f"  #{idx:<5} {s['barangay']:<26} {s['total_incidents']:<11} "
            f"{s['risk_label']:<16} {s['cluster_centroid']}"
        )
    print()


if __name__ == "__main__":
    asyncio.run(run_validation())