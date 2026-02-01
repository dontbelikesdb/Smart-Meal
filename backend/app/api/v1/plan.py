from fastapi import APIRouter
from app.schemas.plan import PlanRequest
import uuid

router = APIRouter()

@router.post("/generate")
def generate_plan(req: PlanRequest):
    plan_id = str(uuid.uuid4())
    # TODO: send job to GA worker queue
    return {"plan_id": plan_id, "status": "pending"}
