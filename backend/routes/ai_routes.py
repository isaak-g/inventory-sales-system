from flask import Blueprint, jsonify
from ai.recommender import (
    get_top_selling_products,
    get_restock_suggestions,
    get_frequently_bought_together,
    get_category_trends,
    get_time_based_recommendations
)

ai_bp = Blueprint('ai', __name__)

# Route to get AI-powered recommendations
@ai_bp.route('/recommendations', methods=['GET'])
def recommendations():
    top_sellers = get_top_selling_products()  # Get top-selling products
    restock_suggestions = get_restock_suggestions()  # Get restock suggestions
    frequently_bought_together = get_frequently_bought_together()  # Get frequently bought together items
    category_trends = get_category_trends()  # Get category trends
    time_based_recommendations = get_time_based_recommendations()  # Get time-based recommendations
    
    return jsonify({
        "top_sellers": top_sellers,
        "restock_suggestions": restock_suggestions,
        "frequently_bought_together": frequently_bought_together,
        "category_trends": category_trends,
        "time_based_recommendations": time_based_recommendations
    })
