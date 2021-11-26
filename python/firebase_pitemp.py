import datetime
import firebase_admin
from firebase_admin import credentials
from firebase_admin import firestore
from sensor.SHT31 import SHT31
from sensor.BH1750FVI import BH1750FVI
from sensor.VL6180 import VL6180X
from sensor.MCP300X import MCP300X

# Use a service account
cred = credentials.Certificate('/home/pi/firebase/serviceAccountKey.json')
firebase_admin.initialize_app(cred)
db = firestore.client()
    
distance = VL6180X().get_distance()
light = BH1750FVI().get_light()
temperature, humidity = SHT31().get_temperature_humidity()

distance_limit = 20
water_turn_on_time = 3

def water_job():
    if is_water_flag(distance):
        MCP300X().turn_on_water(water_turn_on_time)

def is_water_flag(distance):
    return distance > distance_limit

water_flag = 1 if is_water_flag(distance) else 0

def logging_job():
    ref = db.collection('Database').document()
    ref.set({
        u'Hum': round(humidity, 1),
        u'Temp': round(temperature, 1),
        u'Lit': round(light, 1),
        u'Dist': round(distance, 1),
        u'Wtr': water_flag,
        u'Time': firestore.SERVER_TIMESTAMP,
    })
    
    values = [
        round(humidity, 1),
        round(temperature, 1),
        round(light, 1),
        round(distance, 1),
        water_flag
    ]
    print(values)

maxLength = 20

def resizeDatabase():
    ref = db.collection('Database')
    docs = ref.stream()
    dataSize = 0
    for doc in docs:
        print(doc.id, doc._data)
        dataSize += 1
        if dataSize == 1:
            firstDateId = doc.id

    if dataSize > maxLength:
        deleteDoc(firstDateId)

def deleteDoc(id):
    db.collection('Database').document(id).delete()

if __name__ == '__main__':
    logging_job()
    water_job()
    