from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_restful import Api
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_migrate import Migrate
from models import db
from routes.auth_routes import auth  # Import authentication routes
from routes.sys_routes import routes  # Import routes from routes.py
from routes.ai_routes import ai_bp  # Import the AI routes

# Initialize Flask app
app = Flask(__name__)
app.config.from_object("config.Config")

# Initialize Database & Migrations Properly
db.init_app(app)
migrate = Migrate(app, db)

# Initialize API & CORS Before Registering Blueprints
api = Api(app)
CORS(app)

# Set Up JWT Secret Key Before Initializing JWT
app.config["JWT_SECRET_KEY"] = "your_secret_key"  
jwt = JWTManager(app)

# Register Blueprints
app.register_blueprint(auth, url_prefix="/auth")
app.register_blueprint(routes)  # Register routes from routes.py
app.register_blueprint(ai_bp, url_prefix="/api/ai")  # Register AI blueprint


# Run Flask App
#if __name__ == "__main__":
    #app.run(debug=True)
    
if __name__ == "__main__":
    with app.app_context():  
        db.create_all()  # Ensure tables exist
    app.run(debug=True)
