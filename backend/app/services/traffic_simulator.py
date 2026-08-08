"""
Simulated traffic generator, used by the /ws/traffic WebSocket to make the
dashboard feel like it's watching live network activity. Also assigns a
simulated source location for the threat map — these are NOT real GeoIP
lookups, just illustrative coordinates for demo purposes.
"""
import random

# A handful of illustrative locations. Replace with a real GeoIP database
# (e.g. MaxMind GeoLite2) if you wire this up to real captured traffic.
SIMULATED_LOCATIONS = [
    {"country": "Russia", "lat": 61.5240, "lon": 105.3188},
    {"country": "China", "lat": 35.8617, "lon": 104.1954},
    {"country": "United States", "lat": 37.0902, "lon": -95.7129},
    {"country": "Brazil", "lat": -14.2350, "lon": -51.9253},
    {"country": "Germany", "lat": 51.1657, "lon": 10.4515},
    {"country": "India", "lat": 20.5937, "lon": 78.9629},
    {"country": "Nigeria", "lat": 9.0820, "lon": 8.6753},
    {"country": "Vietnam", "lat": 14.0583, "lon": 108.2772},
]


def random_ip() -> str:
    return ".".join(str(random.randint(1, 254)) for _ in range(4))


def generate_traffic_sample(anomaly_chance: float = 0.15) -> dict:
    """Generate one simulated traffic sample. Occasionally shaped like an attack."""
    is_attack_shaped = random.random() < anomaly_chance

    if is_attack_shaped:
        packet_size = random.uniform(20, 60)
        duration = random.uniform(0, 0.3)
        src_bytes = random.uniform(30000, 80000)
        dst_bytes = random.uniform(0, 100)
    else:
        packet_size = max(40, random.gauss(500, 120))
        duration = max(0, random.gauss(2.0, 1.0))
        src_bytes = max(0, random.gauss(3000, 800))
        dst_bytes = max(0, random.gauss(3000, 800))

    location = random.choice(SIMULATED_LOCATIONS)

    return {
        "source_ip": random_ip(),
        "destination_ip": random_ip(),
        "protocol": random.choice(["TCP", "UDP", "ICMP"]),
        "packet_size": round(packet_size, 2),
        "duration": round(duration, 3),
        "src_bytes": round(src_bytes, 2),
        "dst_bytes": round(dst_bytes, 2),
        "origin_country": location["country"],
        "origin_lat": location["lat"],
        "origin_lon": location["lon"],
    }
