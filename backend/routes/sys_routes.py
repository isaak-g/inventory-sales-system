from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt, verify_jwt_in_request
from models import db, Product, User, Order
from sqlalchemy import func

# Create a Blueprint for the routes
routes = Blueprint("routes", __name__)



    
# Total Product Count (Single Number)
@routes.route("/products/count-total", methods=["GET"])
def get_total_product_count():
    """Returns the total number of products."""
    try:
        count = Product.query.count()
        return jsonify({"total_count": count}), 200
    except Exception as e:
        return jsonify({"error": f"Failed to fetch total product count: {str(e)}"}), 500


# Category-Wise Product Count
@routes.route("/products/count-by-category", methods=["GET"])
def get_product_count_by_category():
    """Returns the count of products grouped by category."""
    try:
        category_counts = (
            db.session.query(Product.category, func.count(Product.id))
            .group_by(Product.category)
            .all()
        )

        # Convert result to dictionary format
        category_counts_dict = {category: count for category, count in category_counts}

        return jsonify(category_counts_dict), 200

    except Exception as e:
        return jsonify({"error": f"Failed to fetch product counts: {str(e)}"}), 500
    
# Fetch All Products (Public Access)
@routes.route("/products", methods=["GET"])
def fetch_products():
    """Fetches all products from the database (accessible to all users)."""

    try:
        products = Product.query.all()  # Retrieve all products

        # Convert products to a list of dictionaries
        product_list = [product.to_dict() for product in products]

        return jsonify({"products": product_list}), 200

    except Exception as e:
        return jsonify({"error": f"Failed to fetch products: {str(e)}"}), 500

# Add a New Product (Requires Admin)
@routes.route('/add_product', methods=['POST'])
@jwt_required()
def add_product():
    """Adds a new product or updates stock if it already exists."""
    try:
        verify_jwt_in_request()
        current_user = get_jwt_identity()
        user_role = get_jwt().get("role")
    except Exception as e:
        return jsonify({"error": f"JWT Error: {str(e)}"}), 401

    # Ensure only admin users can add/update products
    user = User.query.get(current_user)
    if not user or user_role != "admin":
        return jsonify({"error": "Unauthorized: Admins only"}), 403

    # Parse request data
    try:
        data = request.get_json()
        name = data.get("name", "").strip()
        brand = data.get("brand", "").strip()
        category = data.get("category", "").strip()
        price = data.get("price")
        stock_quantity = data.get("stock_quantity", 0)
        image = data.get("image", None)

        # Validate required fields
        if not name or not brand or not category or price is None:
            return jsonify({"error": "Missing required fields"}), 400

        # Check if product already exists (same name, brand, category)
        existing_product = Product.query.filter_by(name=name, brand=brand, category=category).first()

        if existing_product:
            # If product exists, increase stock quantity
            existing_product.stock_quantity += stock_quantity
            db.session.commit()
            return jsonify({"message": "Stock updated successfully!", "product": existing_product.to_dict()}), 200
        else:
            # If not found, add a new product
            new_product = Product(
                name=name,
                brand=brand,
                category=category,
                price=price,
                stock_quantity=stock_quantity,
                image=image  # Can be None
            )
            db.session.add(new_product)
            db.session.commit()
            return jsonify({"message": "Product added successfully!", "product": new_product.to_dict()}), 201

    except Exception as e:
        return jsonify({"error": f"Internal Server Error: {str(e)}"}), 500


# delete a Product (Requires Admin)
@routes.route('/products/<int:product_id>', methods=['DELETE'])
@jwt_required()  # Require authentication
def delete_product(product_id):
    """Allows an admin to delete a product."""
    
    #  Debug request headers
    print(" Request Headers:", request.headers)

    try:
        verify_jwt_in_request()
        current_user = get_jwt_identity()
        user_role = get_jwt().get("role")
    except Exception as e:
        return jsonify({"error": f"JWT Error: {str(e)}"}), 401  # Token error

    # Ensure only admins can delete products
    user = User.query.get(current_user)
    if not user or user_role != "admin":
        return jsonify({"error": "Unauthorized: Admins only"}), 403

    product = Product.query.get(product_id)
    if not product:
        return jsonify({"error": "Product not found"}), 404

    db.session.delete(product)
    db.session.commit()

    return jsonify({"message": "Product deleted successfully"}), 200



# Edit a Product (Requires Admin)
@routes.route('/products/<int:product_id>', methods=['PUT'])
@jwt_required()  # Require JWT authentication
def update_product(product_id):
    """Allows an admin to update a product's details."""
    try:
        verify_jwt_in_request()
        current_user = get_jwt_identity()
        user_role = get_jwt().get("role")
    except Exception as e:
        return jsonify({"error": f"JWT Error: {str(e)}"}), 401

    # Ensure only admin users can edit products
    user = User.query.get(current_user)
    if not user or user_role != "admin":
        return jsonify({"error": "Unauthorized: Admins only"}), 403

    # Get product
    product = Product.query.get(product_id)
    if not product:
        return jsonify({"error": "Product not found"}), 404

    # Parse request data
    try:
        data = request.get_json()
    except Exception as e:
        return jsonify({"error": f"Invalid JSON format: {str(e)}"}), 400

    # Validate and update product fields
    product.name = data.get("name", product.name)
    if isinstance(product.name, str): 
        product.name = product.name.strip()

    product.category = data.get("category", product.category)
    if isinstance(product.category, str): 
        product.category = product.category.strip()

    product.brand = data.get("brand", product.brand)
    if isinstance(product.brand, str): 
        product.brand = product.brand.strip()

    # Ensure price is valid
    try:
        product.price = float(data.get("price", product.price))
        if product.price < 0:
            return jsonify({"error": "Price cannot be negative"}), 400
    except ValueError:
        return jsonify({"error": "Invalid price value"}), 400

    # Ensure stock_quantity is valid
    try:
        product.stock_quantity = int(data.get("stock_quantity", product.stock_quantity))
        if product.stock_quantity < 0:
            return jsonify({"error": "Stock quantity cannot be negative"}), 400
    except ValueError:
        return jsonify({"error": "Invalid stock quantity value"}), 400

    # Allow empty image field (optional)
    product.image = data.get("image", product.image)

    # Commit the changes
    db.session.commit()

    return jsonify({"message": " Product updated successfully!", "product": product.to_dict()}), 200


#sales API Route
@routes.route('/sales', methods=['GET'])
def get_sales():
    """Fetch all sales transactions from the Order table."""
    orders = Order.query.all()  # Fetch all orders from the database

    sales_list = []
    for order in orders:
        sales_list.append({
            "id": order.id,
            "date": order.timestamp.strftime("%Y-%m-%d %H:%M:%S") if order.timestamp else "Unknown",  
            "user": order.user.to_dict() if order.user else {"id": None, "username": "Unknown"},  # Prevent crash if user is missing
            "product": order.product.name if order.product else "Unknown",  # Prevent crash if product is missing
            "brand": order.product.brand if order.product else "Unknown",
            "category": order.product.category if order.product else "Unknown",
            "price": order.product.price if order.product else 0.0,  # Default price
            "quantity": order.quantity,
            "total_price": order.total_price
        })

    return jsonify({"sales": sales_list}), 200

#total sale count
@routes.route("/sales/total", methods=["GET"])
def get_total_sales():
    """Returns the total revenue from all sales."""
    try:
        total_sales = db.session.query(func.sum(Order.total_price)).scalar() or 0
        return jsonify({"total_sales": total_sales}), 200
    except Exception as e:
        return jsonify({"error": f"Failed to fetch total sales: {str(e)}"}), 500



#api to make call
@routes.route('/make_sale', methods=['POST'])
@jwt_required()
def make_sale():
    """Processes a sale and updates stock."""
    try:
        verify_jwt_in_request()
        current_user = get_jwt_identity()
        data = request.get_json()

        # Ensure `quantity` is an integer
        product_id = data.get("product_id")
        quantity = int(data.get("quantity", 0))

        if not product_id or quantity < 1:
            return jsonify({"error": "Invalid product or quantity"}), 400

        product = Product.query.get(product_id)
        if not product:
            return jsonify({"error": "Product not found"}), 404

        if product.stock_quantity < quantity:
            return jsonify({"error": "Not enough stock available"}), 400

        # Use transaction to prevent stock deduction if commit fails
        total_price = product.price * quantity
        new_order = Order(
            user_id=current_user,
            product_id=product.id,
            quantity=quantity,
            price_at_sale=product.price,  # Store product price at sale time
            total_price=total_price
        )

        product.stock_quantity -= quantity  # Reduce stock

        db.session.add(new_order)
        db.session.commit()  # Commit both order and stock update

        return jsonify({"message": "Sale successful!", "sale": new_order.to_dict()}), 201  # Consistent API response

    except ValueError:
        return jsonify({"error": "Quantity must be a valid number"}), 400
    except Exception as e:
        db.session.rollback()  # Rollback if failure occurs
        return jsonify({"error": str(e)}), 500


#Sales Count by Category
@routes.route("/sales/count-by-category", methods=["GET"])
def get_sales_count_by_category():
    """Returns the count of sales grouped by category."""
    try:
        sales_counts = (
            db.session.query(Product.category, func.count(Order.id))
            .join(Order, Product.id == Order.product_id)
            .group_by(Product.category)
            .all()
        )

        sales_counts_dict = {category: count for category, count in sales_counts}
        return jsonify(sales_counts_dict), 200

    except Exception as e:
        return jsonify({"error": f"Failed to fetch sales counts: {str(e)}"}), 500
