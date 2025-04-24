from app import app  # ✅ Import the existing app instance
from models import db, Order
from sqlalchemy import text
""""
# Ensure the script runs inside the Flask application context
with app.app_context():
   
    # Delete all records from the Order table
    db.session.query(Order).delete()
    
    # Commit the changes
    db.session.commit()

    print("✅ Successfully deleted all orders from the database!")
    """
   


# Ensure the script runs inside the Flask application context
with app.app_context():
    # ✅ Correct way to execute raw SQL in SQLAlchemy 2.0
    result = db.session.execute(text("PRAGMA table_info('order');"))
    table_info = result.fetchall()

    print("📋 Order Table Info:")
    for column in table_info:
        print(column)




