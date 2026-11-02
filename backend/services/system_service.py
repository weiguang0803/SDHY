from sqlalchemy.future import select
from backend.models.setting import SystemSetting

async def get_system_setting(db, key: str, default_value: str = "true") -> str:
    try:
        result = await db.execute(select(SystemSetting.value).where(SystemSetting.key == key))
        val = result.scalar_one_or_none()
        return val if val is not None else default_value
    except Exception:
        return default_value

async def set_system_setting(db, key: str, value: str):
    result = await db.execute(select(SystemSetting).where(SystemSetting.key == key))
    setting = result.scalar_one_or_none()
    if setting:
        setting.value = value
    else:
        setting = SystemSetting(key=key, value=value)
        db.add(setting)
    await db.commit()
