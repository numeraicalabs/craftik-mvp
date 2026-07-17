"""Geo utilities.

MVP uses simple Haversine distance in Python — good enough for filtering results
in-memory or on modest datasets. When we hit ~50k active workers per region,
migrate to PostGIS with a GiST index and ST_DWithin queries.
"""
from math import asin, cos, radians, sin, sqrt

EARTH_RADIUS_KM = 6371.0


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Great-circle distance between two points in kilometers."""
    lat1_r, lon1_r, lat2_r, lon2_r = map(radians, (lat1, lon1, lat2, lon2))
    dlat = lat2_r - lat1_r
    dlon = lon2_r - lon1_r
    a = sin(dlat / 2) ** 2 + cos(lat1_r) * cos(lat2_r) * sin(dlon / 2) ** 2
    return round(2 * EARTH_RADIUS_KM * asin(sqrt(a)), 1)


# Rough bounding-box prefilter — useful when we need SQL-side filtering.
# 1 degree of latitude ≈ 111 km; longitude varies with latitude.
def bounding_box(lat: float, lon: float, radius_km: float) -> tuple[float, float, float, float]:
    """Return (lat_min, lat_max, lon_min, lon_max) enclosing the circle."""
    dlat = radius_km / 111.0
    # cos(lat) can be near zero at the poles; guard.
    cos_lat = max(cos(radians(lat)), 0.01)
    dlon = radius_km / (111.0 * cos_lat)
    return lat - dlat, lat + dlat, lon - dlon, lon + dlon
