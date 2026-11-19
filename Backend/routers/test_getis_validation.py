import asyncio
import time
from routers.getis_ord import compute_getis_ord_gi_star


async def main():
    print("=== 1. ALGORITHM EXECUTION SPEED BENCHMARK (GETIS-ORD Gi*) ===")
    latencies_ms = []
    res = None

    for run in range(1, 6):
        start = time.perf_counter()
        res = await compute_getis_ord_gi_star(
            incident_type=None,
            year=None,
            use_normalized_rate=True,
            k_neighbors=4,
            include_all_statuses=False,
        )
        elapsed_ms = (time.perf_counter() - start) * 1000.0
        latencies_ms.append(elapsed_ms)
        label = "Cold Run (1st query)" if run == 1 else f"Warm Run #{run}"
        print(f"  {label:<22}: {elapsed_ms:>7.2f} ms")

    avg_ms = sum(latencies_ms) / len(latencies_ms)
    warm_avg_ms = sum(latencies_ms[1:]) / len(latencies_ms[1:])
    print(f"\n  Overall Average Latency : {avg_ms:.2f} ms")
    print(f"  Warm Average Latency    : {warm_avg_ms:.2f} ms")

    print("\n=== 2. PAYLOAD & DATA CONSISTENCY CHECK ===")
    total_table_count = sum(b["incident_count"] for b in res["barangays"])
    reported_total = res["parameters"]["total_records_analyzed"]
    is_consistent = total_table_count == reported_total and len(res["barangays"]) == 24

    print(f"  Barangays Returned      : {len(res['barangays'])} / 24")
    print(f"  Total Incidents Summed  : {total_table_count} (MongoDB Matched: {reported_total})")
    print(f"  Data Consistency Status : {'PASS (Exact Match)' if is_consistent else 'FAIL (Count Mismatch)'}")

    print("\n=== 3. PREVIEW OF DATA DISPLAYED IN SYSTEM ===")
    header = (
        f"{'Barangay':<16} | {'Count':>5} | {'Rate/10k':>8} | "
        f"{'Gi* Z':>8} | {'p-val':>6} | {'Tier':<8} | Classification"
    )
    print(header)
    print("-" * len(header))

    for b in res["barangays"]:
        print(
            f"{b['barangay']:<16} | {b['incident_count']:>5} | {b['incident_rate_per_10k']:>8.2f} | "
            f"{b['gi_z_score']:>8.4f} | {b['p_value']:>6.4f} | {b['tier']:<8} | {b['classification']}"
        )


if __name__ == "__main__":
    asyncio.run(main())