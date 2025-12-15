#!/bin/bash
cd backend/geometry-service
pip install -r requirements.txt
python3 main.py > ../../service.stdout 2> ../../service.stderr
