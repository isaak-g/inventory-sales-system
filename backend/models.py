from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt

db = SQLAlchemy()
bcrypt = Bcrypt()

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(100), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(200), nullable=False)  # Hashed password storage
    role = db.Column(db.String(50), default="staff")  # "admin" or "staff" (change as needed)

    def set_password(self, password):
        """Hashes the password before storing it."""
        self.password_hash = bcrypt.generate_password_hash(password).decode("utf-8")

    def check_password(self, password):
        """Checks if the provided password matches the stored hash."""
        return bcrypt.check_password_hash(self.password_hash, password)

    def is_admin(self):
        """Check if the user is an admin."""
        return self.role == "admin"

    def to_dict(self):
        """Return user data (exclude password hash)"""
        return {
            "id": self.id,
            "username": self.username,
            "email": self.email,
            "role": self.role
        }

    def __repr__(self):
        return f"<User {self.username}>"


class Product(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)  # Product name (e.g., "Galaxy S24 Ultra")
    brand = db.Column(db.String(50), nullable=False, default="Unknown")  # Brand (e.g., "Samsung")
    category = db.Column(db.String(50), nullable=False)  # Category (e.g., "Phones")
    price = db.Column(db.Float, nullable=False)
    stock_quantity = db.Column(db.Integer, default=0)
    image = db.Column(db.String(255), nullable=True)

    def to_dict(self):
        """Return product details in dictionary format."""
        return {
            "id": self.id,
            "name": self.name,
            "brand": self.brand,
            "category": self.category,
            "price": self.price,
            "stock_quantity": self.stock_quantity,
            "image": self.image  # Include image in response
        }

    def __repr__(self):
        return f"<Product {self.name}>"


from datetime import datetime

class Order(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey("product.id"), nullable=False)
    quantity = db.Column(db.Integer, nullable=False)
    price_at_sale = db.Column(db.Float, nullable=False)  # Store price at sale time
    total_price = db.Column(db.Float, nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    user = db.relationship("User", backref="orders", lazy=True)
    product = db.relationship("Product", backref="orders", lazy=True)

    def to_dict(self):
        return {
            "id": self.id,
            "date": self.timestamp.strftime("%Y-%m-%d %H:%M:%S") if self.timestamp else "Unknown",
            "user": self.user.to_dict() if self.user else {"id": self.user_id},  # Prevent errors
            "product": self.product.name if self.product else "Unknown",
            "brand": self.product.brand if self.product else "Unknown",
            "category": self.product.category if self.product else "Unknown",
            "price": self.price_at_sale,  # Use stored price
            "quantity": self.quantity,
            "total_price": self.total_price
        }


