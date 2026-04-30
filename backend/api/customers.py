from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from backend.database.db import get_db
from backend.database.models import Customer
from backend.services.auth_service import require_admin
from backend.services import meta_capi_service

router = APIRouter(prefix="/api/customers", tags=["customers"])


class CustomerIn(BaseModel):
    full_name: str
    phone: Optional[str] = None
    email: Optional[str] = None


class BulkImport(BaseModel):
    customers: List[CustomerIn]


def to_dict(c: Customer) -> dict:
    return {
        "id": c.id,
        "full_name": c.full_name,
        "phone": c.phone,
        "email": c.email,
        "synced_to_meta": c.synced_to_meta,
        "synced_at": c.synced_at.isoformat() if c.synced_at else None,
        "created_at": c.created_at.isoformat() if c.created_at else None,
    }


@router.get("")
def list_customers(current_user=Depends(require_admin), db: Session = Depends(get_db)):
    customers = db.query(Customer).order_by(Customer.created_at.desc()).all()
    total = len(customers)
    synced = sum(1 for c in customers if c.synced_to_meta)
    return {
        "customers": [to_dict(c) for c in customers],
        "total": total,
        "synced": synced,
        "not_synced": total - synced,
    }


@router.post("/import")
def bulk_import(req: BulkImport, current_user=Depends(require_admin), db: Session = Depends(get_db)):
    added = 0
    for item in req.customers:
        if not item.full_name:
            continue
        customer = Customer(
            full_name=item.full_name,
            phone=item.phone,
            email=item.email,
        )
        db.add(customer)
        added += 1
    db.commit()
    return {"ok": True, "added": added}


@router.post("/{customer_id}/sync")
async def sync_one(customer_id: int, current_user=Depends(require_admin), db: Session = Depends(get_db)):
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    result = await meta_capi_service.send_stage_event({
        "stage": "deal_closed",
        "phone": customer.phone,
        "email": customer.email,
        "budget": None,
    })
    if not result.get("skipped"):
        customer.synced_to_meta = True
        customer.synced_at = datetime.utcnow()
        db.commit()
    return {"ok": True, "result": result}


@router.post("/sync-all")
async def sync_all(current_user=Depends(require_admin), db: Session = Depends(get_db)):
    customers = db.query(Customer).filter(Customer.synced_to_meta == False).all()
    synced = 0
    failed = 0
    for customer in customers:
        result = await meta_capi_service.send_stage_event({
            "stage": "deal_closed",
            "phone": customer.phone,
            "email": customer.email,
            "budget": None,
        })
        if not result.get("skipped") and not result.get("error"):
            customer.synced_to_meta = True
            customer.synced_at = datetime.utcnow()
            synced += 1
        else:
            failed += 1
    db.commit()
    return {"ok": True, "synced": synced, "failed": failed}


@router.delete("/{customer_id}")
def delete_customer(customer_id: int, current_user=Depends(require_admin), db: Session = Depends(get_db)):
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    db.delete(customer)
    db.commit()
    return {"ok": True}
