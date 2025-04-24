# ai/recommender.py
from sqlalchemy.orm import aliased

from models import db, Product, Order  # Make sure db is imported from models

from sqlalchemy import func

# Function to get top-selling products
def get_top_selling_products():
    top_sellers = db.session.query(
        Product.name,
        func.sum(Order.quantity).label('total_sold')
    ) \
        .join(Order, Order.product_id == Product.id) \
        .group_by(Product.id) \
        .order_by(func.sum(Order.quantity).desc()) \
        .limit(5) \
        .all()
    return [{"name": name, "total_sold": total_sold} for name, total_sold in top_sellers]

# Function to get restock suggestions
def get_restock_suggestions():
    low_stock_products = Product.query.filter(Product.stock_quantity < 10).all()
    return [product.name for product in low_stock_products]

# Function to get frequently bought together items
# A simple example for Frequently Bought Together: Get pairs of products bought together

def get_frequently_bought_together():
    # Create an alias for the Order table to join it with itself
    Order2 = aliased(Order)

    # Efficiently query product pairs from the same order
    frequently_bought = db.session.query(
        Order.product_id.label('product_1'),
        Order2.product_id.label('product_2'),
        func.count().label('pair_count')
    ).join(
        Order2, Order.id == Order2.id  # Self-join on the Order table to pair products within the same order
    ).filter(
        Order.product_id != Order2.product_id  # Filter to avoid pairing the same product
    ).group_by(
        'product_1', 'product_2'  # Group by product 1 and product 2
    ).order_by(
        func.count().desc()  # Sort by frequency of pairs
    ).all()

    return [{"product_pair": (product_1, product_2), "count": count} for product_1, product_2, count in frequently_bought]


# Function to get category trends
def get_category_trends():
    category_trends = db.session.query(
        Product.category, func.sum(Order.quantity).label('total_sold')
    ).join(Order, Order.product_id == Product.id) \
     .group_by(Product.category) \
     .order_by(func.sum(Order.quantity).desc()) \
     .all()

    # Handle the case where there are no sales for a category
    if not category_trends:
        return [{"category": "No data", "total_sold": 0}]
    
    return [{"category": category, "total_sold": total_sold} for category, total_sold in category_trends]


# Function to get time-based recommendations (e.g., seasonal)
def get_time_based_recommendations():
    time_based_recommendations = db.session.query(
        Product.name,
        func.sum(Order.quantity).label('total_sold'),
        func.extract('month', Order.timestamp).label('month')
    ).join(Order, Order.product_id == Product.id) \
     .group_by(Product.id, 'month') \
     .order_by('month', func.sum(Order.quantity).desc()) \
     .all()

    # Handle empty results
    if not time_based_recommendations:
        return [{"name": "No data", "total_sold": 0, "month": "Unknown"}]
    
    return [{"name": name, "total_sold": total_sold, "month": month} for name, total_sold, month in time_based_recommendations]

