from pydantic import BaseModel
from typing import List, Optional
from sqlalchemy import Column, String, Boolean, Integer, ForeignKey, create_engine, MetaData
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from databases import Database

# Database URL
DATABASE_URL = "postgresql://postgres:postgres@localhost:5433/fastapi_db"

# SQLAlchemy setup
metadata = MetaData()
Base = declarative_base(metadata=metadata)
database = Database(DATABASE_URL)

# Pydantic Models (Schema Validation)
class StudentBase(BaseModel):
    student_id: int
    name: str
    other_attributes: Optional[str] = None

    class Config:
        orm_mode = True

class FacultyBase(BaseModel):
    faculty_id: int
    name: str
    other_attributes: Optional[str] = None

    class Config:
        orm_mode = True

class AdminBase(BaseModel):
    admin_id: int
    name: str
    other_attributes: Optional[str] = None

    class Config:
        orm_mode = True

class CourseBase(BaseModel):
    course_id: int
    faculty_id: int
    course_name: str
    other_attributes: Optional[str] = None

    class Config:
        orm_mode = True

class CourseMetadataBase(BaseModel):
    metadata_id: int
    course_id: int
    faculty_id: int
    transaction_hash: str

    class Config:
        orm_mode = True

class FeedbackTransactionBase(BaseModel):
    feedback_id: int
    student_id: int
    faculty_id: int
    transaction_hash: str

    class Config:
        orm_mode = True

# SQLAlchemy Models (Database Tables)
class Student(Base):
    __tablename__ = "student"

    student_id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    other_attributes = Column(String, nullable=True)

    # Relationship with feedback transactions
    feedback_transactions = relationship("FeedbackTransaction", back_populates="student")

class Faculty(Base):
    __tablename__ = "faculty"

    faculty_id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    other_attributes = Column(String, nullable=True)

    # Relationships - renamed 'metadata' to 'course_metadata_records'
    courses = relationship("Course", back_populates="faculty")
    course_metadata_records = relationship("CourseMetadata", back_populates="faculty")
    feedback_received = relationship("FeedbackTransaction", back_populates="faculty")

class Admin(Base):
    __tablename__ = "admin"

    admin_id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    other_attributes = Column(String, nullable=True)

class Course(Base):
    __tablename__ = "courses"

    course_id = Column(Integer, primary_key=True, index=True)
    faculty_id = Column(Integer, ForeignKey("faculty.faculty_id"), nullable=False)
    course_name = Column(String, nullable=False)
    other_attributes = Column(String, nullable=True)

    # Relationships - renamed 'metadata' to 'metadata_records'
    faculty = relationship("Faculty", back_populates="courses")
    metadata_records = relationship("CourseMetadata", back_populates="course")

class CourseMetadata(Base):
    __tablename__ = "courses_metadata"

    metadata_id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.course_id"), nullable=False)
    faculty_id = Column(Integer, ForeignKey("faculty.faculty_id"), nullable=False)
    transaction_hash = Column(String, nullable=False)

    # Relationships
    course = relationship("Course", back_populates="metadata_records")
    faculty = relationship("Faculty", back_populates="course_metadata_records")

class FeedbackTransaction(Base):
    __tablename__ = "feedback_transaction_table"

    feedback_id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("student.student_id"), nullable=False)
    faculty_id = Column(Integer, ForeignKey("faculty.faculty_id"), nullable=False)
    transaction_hash = Column(String, nullable=False)

    # Relationships
    student = relationship("Student", back_populates="feedback_transactions")
    faculty = relationship("Faculty", back_populates="feedback_received")

# Create database engine
engine = create_engine(DATABASE_URL)

# Create all tables
def init_db():
    Base.metadata.drop_all(bind=engine)  # Clear existing tables
    Base.metadata.create_all(bind=engine)
    print("Database tables created successfully!")

# Helper functions to maintain backward compatibility
def get_student_by_email(email: str):
    """Helper function for backward compatibility - you'll need to implement email lookup separately"""
    pass

def get_faculty_by_email(email: str):
    """Helper function for backward compatibility - you'll need to implement email lookup separately"""
    pass

def get_admin_by_email(email: str):
    """Helper function for backward compatibility - you'll need to implement email lookup separately"""
    pass