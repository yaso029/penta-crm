import random
import asyncio
from datetime import datetime
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from backend.database.db import SessionLocal
from backend.database.models import Customer, SyncLog
from backend.services import meta_capi_service

scheduler = AsyncIOScheduler()


async def auto_sync_batch():
    db = SessionLocal()
    try:
        unsynced = db.query(Customer).filter(Customer.synced_to_meta == False).all()
        if not unsynced:
            print("[AUTOSYNC] No unsynced customers remaining", flush=True)
            return

        batch_size = random.randint(7, 10)
        batch = random.sample(unsynced, min(batch_size, len(unsynced)))
        print(f"[AUTOSYNC] Starting batch of {len(batch)} customers", flush=True)

        synced = 0
        failed = 0
        for customer in batch:
            result = await meta_capi_service.send_stage_event({
                "stage": "deal_closed",
                "phone": customer.phone,
                "email": customer.email,
                "budget": None,
            })
            if not result.get("error") and not result.get("skipped"):
                customer.synced_to_meta = True
                customer.synced_at = datetime.utcnow()
                synced += 1
            else:
                failed += 1

        log = SyncLog(synced_count=synced, failed_count=failed, triggered_by="auto")
        db.add(log)
        db.commit()
        print(f"[AUTOSYNC] Done: {synced} synced, {failed} failed", flush=True)
    except Exception as e:
        print(f"[AUTOSYNC] Error: {e}", flush=True)
    finally:
        db.close()


def start_scheduler():
    scheduler.add_job(auto_sync_batch, "interval", hours=1, id="auto_sync", replace_existing=True)
    scheduler.start()
    print("[AUTOSYNC] Scheduler started — runs every hour", flush=True)


def stop_scheduler():
    scheduler.shutdown()
