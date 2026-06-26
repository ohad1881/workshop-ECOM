from django.db import models

# The recommendation engine (engine.py, optimizer.py) uses no database models.
# Scoring and optimization operate on in-memory data fetched via repositories.
