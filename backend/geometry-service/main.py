from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List
import uvicorn
import trimesh
import os
from models import MeasurementRequest, MeasurementResult
from geometry_engine import GeometryEngine

app = FastAPI(title="TailorMode Geometry Service", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "geometry-service"}

@app.post("/normalize")
async def normalize_mesh(request: MeasurementRequest):
    """
    Validates and Normalizes the mesh.
    - Checks for valid mesh data.
    - Checks for watertightness.
    - Aligns to Y-up (if needed - placeholder).
    - Returns metadata (volume, bounding box).
    """
    try:
        # Check if file exists ONLY if it's a local path (not a URL)
        is_url = request.mesh_file.startswith("http://") or request.mesh_file.startswith("https://")
        if not is_url and not os.path.exists(request.mesh_file):
             raise HTTPException(status_code=404, detail=f"Mesh file not found: {request.mesh_file}")

        mesh = trimesh.load(request.mesh_file, file_type="obj" if is_url and request.mesh_file.endswith(".obj") else None)
        if not isinstance(mesh, trimesh.Trimesh):
             raise HTTPException(status_code=400, detail="Loaded file is not a valid Trimesh object")

        # Basic Validation
        is_watertight = mesh.is_watertight
        volume = mesh.volume if is_watertight else 0.0
        bounds = mesh.bounds.tolist() # [[min_x, min_y, min_z], [max_x, max_y, max_z]]

        # In a real system, we might rotate/scale and save a new version.
        # Here we just report status.

        return {
            "is_watertight": is_watertight,
            "vertex_count": len(mesh.vertices),
            "face_count": len(mesh.faces),
            "volume": volume,
            "bounds": bounds,
            "status": "valid" if len(mesh.vertices) > 0 else "invalid"
        }

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/analyze", response_model=List[MeasurementResult])
async def analyze_mesh(request: MeasurementRequest):
    try:
        # Check if file exists ONLY if it's a local path (not a URL)
        is_url = request.mesh_file.startswith("http://") or request.mesh_file.startswith("https://")
        if not is_url and not os.path.exists(request.mesh_file):
             raise HTTPException(status_code=404, detail=f"Mesh file not found: {request.mesh_file}")

        # trimesh.load handles URLs automatically if requests is installed
        mesh = trimesh.load(request.mesh_file, file_type="obj" if is_url and request.mesh_file.endswith(".obj") else None)
        if not isinstance(mesh, trimesh.Trimesh):
             raise HTTPException(status_code=400, detail="Loaded file is not a valid Trimesh object")

        engine = GeometryEngine(mesh)
        results = []

        for measure_def in request.measurements:
            try:
                value = 0.0
                confidence = 1.0

                if measure_def.type == "distance":
                    start_name = measure_def.landmarks[0]
                    end_name = measure_def.landmarks[1]
                    start_pos = request.landmarks.get(start_name)
                    end_pos = request.landmarks.get(end_name)

                    if start_pos and end_pos:
                        # Convert to mm if mesh is in meters
                        dist_m = engine.compute_geodesic_distance(start_pos, end_pos)
                        value = dist_m * 1000 # convert to mm
                    else:
                        confidence = 0.0

                elif measure_def.type == "circumference":
                    landmark_name = measure_def.landmarks[0]
                    landmark_pos = request.landmarks.get(landmark_name)

                    if landmark_pos:
                        normal = [0, 1, 0]
                        if measure_def.params and "normal" in measure_def.params:
                            normal = measure_def.params["normal"]

                        circ_m = engine.compute_planar_circumference(landmark_pos, normal)
                        value = circ_m * 1000 # convert to mm
                    else:
                        confidence = 0.0

                elif measure_def.type == "limb_circumference":
                    start_name = measure_def.landmarks[0]
                    end_name = measure_def.landmarks[1]
                    start_pos = request.landmarks.get(start_name)
                    end_pos = request.landmarks.get(end_name)

                    if start_pos and end_pos:
                        fraction = 0.5
                        if measure_def.params and "fraction" in measure_def.params:
                            fraction = measure_def.params["fraction"]

                        circ_m = engine.compute_limb_circumference(start_pos, end_pos, fraction)
                        value = circ_m * 1000
                    else:
                        confidence = 0.0

                results.append(MeasurementResult(
                    name=measure_def.name,
                    value=round(value, 2),
                    unit="mm",
                    confidence=confidence
                ))
            except Exception as e:
                print(f"Error computing {measure_def.name}: {str(e)}")
                results.append(MeasurementResult(
                    name=measure_def.name,
                    value=0.0,
                    confidence=0.0
                ))

        return results

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
