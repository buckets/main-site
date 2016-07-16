from buckets.web import app
import os
from uuid import uuid4

app.secret_key = os.environ.get('FLASK_SECRET_KEY', str(uuid4()))
app.run(debug=True)
