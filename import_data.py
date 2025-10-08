import pandas as pd
import os
from app import db
from app.models import Consumption, Cost
from datetime import datetime
from sqlalchemy.sql import text, func
from sqlalchemy.exc import ProgrammingError

def parse_date(date_value):
    """Parse date value to datetime.date object or return None if empty or invalid."""
    if pd.isna(date_value) or date_value == '':
        return None
    try:
        # Handle pandas Timestamp
        if isinstance(date_value, pd.Timestamp):
            return date_value.date()
        # Handle string dates (assuming DD/MM/YYYY format)
        return datetime.strptime(date_value, '%d/%m/%Y').date()
    except (ValueError, TypeError) as e:
        print(f"Error parsing date {date_value}: {e}")
        return None

def check_table_exists(table_name):
    """Check if a table exists in the database."""
    try:
        db.session.execute(text(f"SELECT 1 FROM {table_name} LIMIT 1"))
        print(f"Table {table_name} exists")
        return True
    except ProgrammingError as e:
        print(f"Table {table_name} does not exist: {e}")
        return False

def import_consumptions(file_path):
    """Import data from consumptions.xlsx into the Consumption table."""
    try:
        # Check if file exists
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"File {file_path} not found")

        # Read Excel file
        df = pd.read_excel(file_path)
        print(f"Read {len(df)} rows from {file_path}")
        print(f"Columns in consumptions.xlsx: {df.columns.tolist()}")
        if not df.empty:
            print(f"Sample data:\n{df.head().to_string()}")

        # Check if consumption table exists
        if not check_table_exists('consumption'):
            raise RuntimeError("Consumption table does not exist. Run migrations first.")

        # Insert each row into the Consumption table
        for index, row in df.iterrows():
            print(f"Processing consumption row {index + 1}: {row.to_dict()}")
            # Convert ID to Python int to avoid numpy.int64 issue
            consumption_id = int(row['ID']) if pd.notna(row['ID']) else None
            consumption = Consumption(
                id_consumption=consumption_id,  # Explicitly set ID
                year=int(row['Year']) if pd.notna(row['Year']) else None,
                month=int(row['Month']) if pd.notna(row['Month']) else None,
                kwh=float(row['kWh']) if pd.notna(row['kWh']) else None,
                smc=float(row['SMC']) if pd.notna(row['SMC']) else None
            )
            db.session.merge(consumption)  # Use merge to handle existing IDs
        db.session.commit()
        print("Successfully imported consumptions data")
    except Exception as e:
        db.session.rollback()
        print(f"Error importing consumptions: {e}")
        raise  # Re-raise to see full stack trace for debugging

def import_costs(file_path):
    """Import data from costs.xlsx into the Cost table."""
    try:
        # Check if file exists
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"File {file_path} not found")

        # Read Excel file
        df = pd.read_excel(file_path)
        print(f"Read {len(df)} rows from {file_path}")
        print(f"Columns in costs.xlsx: {df.columns.tolist()}")
        if not df.empty:
            print(f"Sample data:\n{df.head().to_string()}")

        # Check if cost table exists
        if not check_table_exists('cost'):
            raise RuntimeError("Cost table does not exist. Run migrations first.")

        # Insert each row into the Cost table
        for index, row in df.iterrows():
            print(f"Processing cost row {index + 1}: {row.to_dict()}")
            # Convert ID to Python int to avoid numpy.int64 issue
            cost_id = int(row['ID']) if pd.notna(row['ID']) else None
            cost = Cost(
                id_cost=cost_id,  # Explicitly set ID
                start=parse_date(row['Start']),
                end=parse_date(row['End']),
                kwh=float(row['KWH Bill (€)']) if pd.notna(row['KWH Bill (€)']) else None,
                smc=float(row['SMC Bill (€)']) if pd.notna(row['SMC Bill (€)']) else None,
                kwh_cost=float(row['KWH Cost (€/kWh)']) if pd.notna(row['KWH Cost (€/kWh)']) else None,
                smc_cost=float(row['SMC Cost (€/Smc)']) if pd.notna(row['SMC Cost (€/Smc)']) else None
            )
            db.session.merge(cost)  # Use merge to handle existing IDs
        db.session.commit()
        print("Successfully imported costs data")
    except Exception as e:
        db.session.rollback()
        print(f"Error importing costs: {e}")
        raise  # Re-raise to see full stack trace for debugging

def realign_sequences():
    """Realign PostgreSQL sequences for consumption and cost tables."""
    try:
        # Get the maximum id_consumption from the consumption table
        max_consumption_id = db.session.query(func.max(Consumption.id_consumption)).scalar()
        max_consumption_id = max_consumption_id or 0  # Default to 0 if table is empty

        # Get the maximum id_cost from the cost table
        max_cost_id = db.session.query(func.max(Cost.id_cost)).scalar()
        max_cost_id = max_cost_id or 0  # Default to 0 if table is empty

        # Realign the sequence for consumption
        consumption_sequence = 'consumption_id_consumption_seq'
        db.session.execute(
            text("SELECT setval(:seq, :max_id, true)"),
            {'seq': consumption_sequence, 'max_id': max_consumption_id}
        )
        print(f"Realigned sequence {consumption_sequence} to {max_consumption_id}")

        # Realign the sequence for cost
        cost_sequence = 'cost_id_cost_seq'
        db.session.execute(
            text("SELECT setval(:seq, :max_id, true)"),
            {'seq': cost_sequence, 'max_id': max_cost_id}
        )
        print(f"Realigned sequence {cost_sequence} to {max_cost_id}")

        db.session.commit()
        print("Successfully realigned sequences")
    except Exception as e:
        db.session.rollback()
        print(f"Error realigning sequences: {e}")
        raise  # Re-raise to see full stack trace for debugging

def main():
    # File paths for the Excel files
    consumptions_file = 'consumptions.xlsx'
    costs_file = 'costs.xlsx'

    # Check database connectivity
    try:
        db.session.execute(text("SELECT 1"))
        print("Database connection successful")
    except Exception as e:
        print(f"Database connection failed: {e}")
        raise

    # Import data
    import_consumptions(consumptions_file)
    import_costs(costs_file)
    # Realign sequences after import
    realign_sequences()

if __name__ == '__main__':
    # Ensure the Flask app context is active
    from app import create_app
    app = create_app()
    with app.app_context():
        main()