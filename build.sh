#!/usr/bin/env bash
set -o errexit

pip install -r Backend/requirements.txt

cd Backend

python manage.py collectstatic --no-input
python manage.py migrate