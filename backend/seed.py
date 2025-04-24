from app import app, db  # Import Flask app instance
from models import User, bcrypt  # Import User model

with app.app_context():
    # Admin User
    admin_email = "admin@example.com"
    existing_admin = User.query.filter_by(email=admin_email).first()

    if not existing_admin:
        admin = User(
            username="admin",
            email=admin_email,
            role="admin"
        )
        admin.set_password("admin123")  # Set password
        db.session.add(admin)
        print("✅ Admin user created successfully!")

    # Staff User
    staff_email = "staff@example.com"
    existing_staff = User.query.filter_by(email=staff_email).first()

    if not existing_staff:
        staff = User(
            username="staff",
            email=staff_email,
            role="staff"
        )
        staff.set_password("staff123")  # Set password
        db.session.add(staff)
        print("✅ Staff user created successfully!")

    db.session.commit()
