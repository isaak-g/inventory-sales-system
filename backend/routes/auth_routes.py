from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import (
    JWTManager, create_access_token, create_refresh_token,
    jwt_required, get_jwt_identity, get_jwt
)
from flask_jwt_extended.exceptions import NoAuthorizationError
from jwt.exceptions import ExpiredSignatureError  # Fix Import


from models import db, User
from datetime import timedelta

auth = Blueprint("auth", __name__)

# Store blacklisted tokens (for logout functionality)
blacklisted_tokens = set()

### LOGIN ROUTE
@auth.route("/login", methods=["POST"])
def login():
    """Authenticate user & return JWT access & refresh tokens."""
    data = request.get_json()
    email = data.get("email")
    password = data.get("password")

    user = User.query.filter_by(email=email).first()

    if not user or not user.check_password(password):
        return jsonify({"error": "Invalid email or password"}), 401

    # Create JWT tokens    
    access_token = create_access_token(
        identity=str(user.id),  # Ensure identity is a string
        additional_claims={"role": user.role},
        expires_delta=timedelta(hours=1)
    )


    refresh_token = create_refresh_token(
        identity=str(user.id),
        additional_claims={"role": user.role}
    )

    print("Generated Access Token:", access_token)  # Debugging
    return jsonify({
        "message": "Login successful",
        "access_token": access_token,
        "refresh_token": refresh_token,
        "user": {"id": user.id, "username": user.username, "role": user.role}
    })


    
@auth.route("/forgot-password", methods=["POST"])
def forgot_password():
    data = request.get_json()
    email = data.get("email")

    if not email:
        return jsonify({"message": "Email is required"}), 400

    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({"message": "User not found"}), 404

    # Placeholder response (implement email sending logic here)
    # send_reset_email(user.email, generate_reset_token(user.id))

    return jsonify({"message": f"Reset link sent to {email}"}), 200

### TOKEN REFRESH ROUTE
@auth.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)  # Requires refresh token
def refresh():
    """Generate a new access token using a refresh token."""
    current_user = get_jwt_identity()
    new_access_token = create_access_token(identity=current_user, additional_claims={"role": get_jwt()["role"]})
    return jsonify({"access_token": new_access_token}), 200


### LOGOUT ROUTE (BLACKLIST TOKEN)
@auth.route("/logout", methods=["POST"])
@jwt_required()
def logout():
    """Blacklist the token to log the user out."""
    jti = get_jwt()["jti"]  # Get token identifier
    blacklisted_tokens.add(jti)  # Store it in the blacklist
    return jsonify({"message": "Successfully logged out!"}), 200

### ADD USER ROUTE (ADMIN-ONLY)
@auth.route("/add-user", methods=["POST"])
@jwt_required()
def add_user():
    """Only admins can create new users."""

    user_role = get_jwt().get("role")  # Get role from claims

    if user_role != "admin":
        return jsonify({"error": "Unauthorized"}), 403  # Forbidden

    data = request.get_json()
    username = data.get("username")
    email = data.get("email")
    password = data.get("password")
    role = data.get("role", "staff")  # Default role is "staff"

    if not username or not email or not password:
        return jsonify({"error": "All fields are required"}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({"error": "Email already exists"}), 400

    new_user = User(username=username, email=email, role=role)
    new_user.set_password(password)  # Hash password before saving
    db.session.add(new_user)
    db.session.commit()

    return jsonify({
        "message": "User created successfully",
        "user": {"id": new_user.id, "username": new_user.username, "role": new_user.role}
    }), 201

@auth.route("/update_role/<int:user_id>", methods=["PUT"])
@jwt_required()
def update_role(user_id):
    current_user = get_jwt_identity()
    if current_user["role"] != "admin":
        return jsonify({"error": "Unauthorized"}), 403

    data = request.get_json()
    new_role = data.get("role")

    if new_role not in ["admin", "staff"]:
        return jsonify({"error": "Invalid role"}), 400

    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    user.role = new_role
    db.session.commit()

    return jsonify({"message": f"User {user.username} role updated to {new_role}."})


### PROTECTED ROUTE (FOR TESTING JWT AUTH)
@auth.route("/protected", methods=["GET"])
@jwt_required()
def protected():
    """Example protected route."""
    user_id = get_jwt_identity()
    user_role = get_jwt().get("role")
    return jsonify({"message": "Access granted", "user": {"id": user_id, "role": user_role}})

### ERROR HANDLING FOR JWT
@auth.app_errorhandler(ExpiredSignatureError)
def handle_expired_token(e):
    return jsonify({"error": "Token has expired"}), 401

@auth.app_errorhandler(NoAuthorizationError)
def handle_no_token(e):
    return jsonify({"error": "Token is missing or invalid"}), 401

