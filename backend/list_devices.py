"""One-off: list distinct device_ids present in the sensor_readings collection."""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from app.core.settings import settings


async def main():
    client = AsyncIOMotorClient(settings.MONGO_URI)
    db = client[settings.MONGO_DB_NAME]
    col = db[settings.MONGO_COL_SENSOR_READINGS]
    devices = await col.distinct("device_id")
    total = await col.count_documents({})
    print(f"Database: {settings.MONGO_DB_NAME}")
    print(f"Total sensor readings: {total}")
    print(f"Distinct device_ids: {devices or '(none yet)'}")
    client.close()


asyncio.run(main())
