from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Any

class Landmark(BaseModel):
    name: str
    position: List[float] # [x, y, z]

class MeasurementDefinition(BaseModel):
    name: str
    type: str # "circumference", "distance", "limb_circumference"
    landmarks: List[str] # ["neck_base"] or ["shoulder", "wrist"]
    params: Optional[Dict[str, Any]] = None # e.g. {"fraction": 0.5, "axis": [0,1,0]}

class MeasurementRequest(BaseModel):
    mesh_file: str # Path to mesh file (simulated upload for now)
    landmarks: Dict[str, List[float]] # Map of name -> [x, y, z]
    measurements: List[MeasurementDefinition]

class MeasurementResult(BaseModel):
    name: str
    value: float
    unit: str = "mm"
    confidence: float
