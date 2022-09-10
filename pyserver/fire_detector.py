import sys
sys.path.insert(0, './pyserver/utils')
from locator import get_location
from events import Events

class fire_detector:
    def __init__(self, sendFunc):
        self.sendFunc = sendFunc
        self.currentFires = []
        self.events = Events()
        self.events.on_fire_detected += self.onFireDetected
        self.events.on_fire_extinguished += self.onFireExtinguished

    #Info Structur: {id, lat, long, location, probability, socket} - socket that sent the data
    def onFireDetected(self, info):
        if (self.fireExists(info['lat'], info['long'])):
            return

        print("Fire detected!")
        print(info)

        info['id'] = self.generateFireId()
        info['location'] = get_location(info["lat"], info["long"])
        self.currentFires.append(info)
        self.sendFunc("fire_detected", {
            'info': info
        })

    def onFireExtinguished(self, id):
        for fire in self.currentFires:
            if fire["id"] == id:
                self.currentFires.remove(fire)
                return True
        return False

    def fireExists(self, lat, long):
        for fire in self.currentFires:
            if fire["lat"] == lat and fire["long"] == long:
                return True
        
        return False

    def fireIdExists(self, id):
        for fire in self.currentFires:
            if fire["id"] == id:
                return True
        return False
    
    def generateFireId(self):
        id = 0
        while self.fireIdExists(id):
            id += 1
        return id