from geopy.geocoders import Nominatim

geolocator = Nominatim(user_agent="pyserver")

def get_location(lat, long):
    location = geolocator.reverse(lat + "," + long)
    return location

def get_geocode(address):
    location = geolocator.geocode(address)
    return location