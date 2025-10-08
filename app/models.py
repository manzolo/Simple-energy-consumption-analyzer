from sqlalchemy import Column, Integer, Float, Date, String
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.sql import func
from . import db

class Consumption(db.Model):
    __tablename__ = 'consumption'
    
    id_consumption = Column(Integer, primary_key=True)
    year = Column(Integer, nullable=False)  # Rimuovi default=func.strftime
    month = Column(Integer, nullable=False)  # Rimuovi default=func.strftime
    kwh = Column(Float, nullable=False)
    smc = Column(Float, nullable=False)
    
    def __repr__(self):
        return f"<Consumption(id={self.id_consumption}, year={self.year}, month={self.month}, kwh={self.kwh}, smc={self.smc})>"

class Cost(db.Model):
    __tablename__ = 'cost'
    
    id_cost = Column(Integer, primary_key=True)
    start = Column(Date)
    end = Column(Date)
    kwh = Column(Float, nullable=False)
    smc = Column(Float, nullable=False)
    kwh_cost = Column(Float)
    smc_cost = Column(Float)
    
    def __repr__(self):
        return f"<Cost(id={self.id_cost}, start={self.start}, end={self.end}, kwh={self.kwh}, smc={self.smc})>"