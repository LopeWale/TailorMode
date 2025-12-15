import numpy as np
import trimesh
import networkx as nx
from scipy.spatial import cKDTree
from scipy.sparse.csgraph import dijkstra
import scipy.sparse as sp

class GeometryEngine:
    def __init__(self, mesh_data: trimesh.Trimesh):
        self.mesh = mesh_data
        self.graph = None
        self._build_graph()

    def _build_graph(self):
        edges = self.mesh.edges_unique
        length = self.mesh.edges_unique_length
        n_vertices = len(self.mesh.vertices)

        rows = np.concatenate([edges[:, 0], edges[:, 1]])
        cols = np.concatenate([edges[:, 1], edges[:, 0]])
        data = np.concatenate([length, length])

        self.graph = sp.csr_matrix((data, (rows, cols)), shape=(n_vertices, n_vertices))

    def get_vertex_index(self, point: list[float]) -> int:
        _, idx = self.mesh.kdtree.query(point)
        return int(idx)

    def compute_geodesic_distance(self, start_point: list[float], end_point: list[float]) -> float:
        start_idx = self.get_vertex_index(start_point)
        end_idx = self.get_vertex_index(end_point)

        if start_idx == end_idx:
            return 0.0

        dist_matrix = dijkstra(self.graph, directed=False, indices=[start_idx], min_only=True)

        if dist_matrix.ndim == 1:
            distance = dist_matrix[end_idx]
        else:
            distance = dist_matrix[0, end_idx]

        if np.isinf(distance):
            return float(np.linalg.norm(np.array(start_point) - np.array(end_point)))

        return float(distance)

    def compute_planar_circumference(self, landmark_point: list[float], normal_vector: list[float] = [0, 1, 0]) -> float:
        slice_segments = self.mesh.section(
            plane_origin=landmark_point,
            plane_normal=normal_vector
        )

        if not slice_segments:
            return 0.0

        try:
            slice_2d, to_3d = slice_segments.to_planar()

            if hasattr(slice_2d, 'polygons_full'):
                polygons = slice_2d.polygons_full
            elif hasattr(slice_2d, 'polygons_closed'):
                 polygons = slice_2d.polygons_closed
            else:
                 polygons = [slice_2d.polygons_closed] if hasattr(slice_2d, 'polygons_closed') else []

            if not polygons:
                return 0.0

            valid_polygons = [p for p in polygons if p is not None]
            if not valid_polygons:
                return 0.0

            largest_polygon = max(valid_polygons, key=lambda p: p.area)
            return float(largest_polygon.length)

        except Exception as e:
            print(f"Error processing slice: {e}")
            return 0.0

    def compute_limb_circumference(self, start_point: list[float], end_point: list[float], fraction: float = 0.5) -> float:
        start = np.array(start_point)
        end = np.array(end_point)
        axis = end - start
        length = np.linalg.norm(axis)
        if length == 0:
            return 0.0
        axis_normalized = axis / length
        center_point = start + axis * fraction
        return self.compute_planar_circumference(center_point, axis_normalized)
