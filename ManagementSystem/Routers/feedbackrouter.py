from fastapi import APIRouter, HTTPException, Header
from typing import List, Optional
import json

# Change to relative imports
from ..Models.schemas.database import database, FeedbackTransaction, Faculty, Student
from ..utils.encryption import encryption_service
from datetime import datetime

router = APIRouter()

@router.post("/submit-feedback")
async def submit_feedback(feedback: dict):
    try:
        # Extract student ID and instructor info from feedback
        student_id = feedback.get('student_id')
        instructors = feedback.get('instructors', [])
        
        if not student_id or not instructors:
            raise HTTPException(status_code=400, detail="Student ID and instructors are required")
        
        # Encrypt the entire feedback data
        encrypted_feedback = encryption_service.encrypt_feedback(feedback)
        
        feedback_records = []
        
        # Create feedback transaction record for each instructor
        for instructor in instructors:
            # Extract instructor name to map to faculty_id
            faculty_name = instructor.get('name', '').strip()
            course_code = instructor.get('courseCode', '')
            
            if not faculty_name:
                continue
                
            # Query faculty table to get faculty_id by name
            faculty_query = Faculty.__table__.select().where(
                Faculty.name.ilike(f"%{faculty_name}%")
            )
            faculty_result = await database.fetch_one(faculty_query)
            
            if faculty_result:
                faculty_id = faculty_result.faculty_id
            else:
                # If faculty not found, create a new faculty record or skip
                # For now, we'll create a new faculty record
                new_faculty_query = Faculty.__table__.insert().values(
                    name=faculty_name,
                    other_attributes=json.dumps({"course_code": course_code})
                )
                faculty_id = await database.execute(new_faculty_query)
            
            # Insert encrypted feedback into FeedbackTransaction table
            query = FeedbackTransaction.__table__.insert().values(
                student_id=int(student_id) if isinstance(student_id, str) and student_id.isdigit() else hash(student_id) % 1000000,
                faculty_id=faculty_id,
                transaction_hash=encrypted_feedback  # Store encrypted data in transaction_hash field
            )
            feedback_id = await database.execute(query)
            feedback_records.append({
                "feedback_id": feedback_id,
                "faculty_id": faculty_id,
                "faculty_name": faculty_name
            })
        
        return {
            "status": "success",
            "message": "Feedback encrypted and stored successfully",
            "feedback_records": feedback_records,
            "encryption_status": "encrypted"
        }
        
    except Exception as e:
        print("Error:", e)
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/get-feedback")
async def get_feedback(faculty_id: Optional[str] = Header(None, alias="X-Faculty-ID")):
    try:
        if not faculty_id:
            raise HTTPException(status_code=400, detail="Faculty ID is required in X-Faculty-ID header")
        
        # Convert faculty_id to integer
        try:
            faculty_id_int = int(faculty_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid Faculty ID format")
        
        # Query feedback transactions for the specific faculty
        query = FeedbackTransaction.__table__.select().where(
            FeedbackTransaction.faculty_id == faculty_id_int
        )
        results = await database.fetch_all(query)
        
        if not results:
            return {
                "status": "success",
                "data": [],
                "message": "No feedback found for this faculty"
            }
        
        decrypted_feedback = []
        
        for result in results:
            try:
                # Decrypt the feedback data
                decrypted_data = encryption_service.decrypt_feedback(result.transaction_hash)
                
                # Filter feedback for the specific faculty by matching instructor names
                instructor_feedback = []
                faculty_query = Faculty.__table__.select().where(Faculty.faculty_id == faculty_id_int)
                faculty_result = await database.fetch_one(faculty_query)
                faculty_name = faculty_result.name if faculty_result else ""
                
                for instructor in decrypted_data.get('instructors', []):
                    # Match by faculty name (case-insensitive partial match)
                    if faculty_name.lower() in instructor.get('name', '').lower() or \
                       instructor.get('name', '').lower() in faculty_name.lower():
                        instructor_feedback.append(instructor)
                
                if instructor_feedback:
                    decrypted_feedback.append({
                        "feedback_id": result.feedback_id,
                        "student_id": result.student_id,
                        "faculty_id": result.faculty_id,
                        "feedback_data": {
                            **decrypted_data,
                            "instructors": instructor_feedback
                        },
                        "decrypted": True
                    })
                    
            except Exception as decrypt_error:
                print(f"Failed to decrypt feedback {result.feedback_id}: {decrypt_error}")
                continue
        
        return {
            "status": "success", 
            "data": decrypted_feedback,
            "total_count": len(decrypted_feedback),
            "faculty_id": faculty_id_int
        }
        
    except Exception as e:
        print("Error:", e)
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/get-feedback/{student_id}")  
async def get_student_feedback(student_id: str):
    """Get feedback for a specific student (for student dashboard)"""
    try:
        # Convert student_id appropriately
        try:
            student_id_int = int(student_id)
        except ValueError:
            # If student_id is not a number, use hash
            student_id_int = hash(student_id) % 1000000
        
        # Query feedback transactions for the specific student
        query = FeedbackTransaction.__table__.select().where(
            FeedbackTransaction.student_id == student_id_int
        )
        results = await database.fetch_all(query)
        
        if not results:
            return {
                "status": "success",
                "data": [],
                "message": "No feedback found for this student"
            }
        
        decrypted_feedback = []
        
        for result in results:
            try:
                # Decrypt the feedback data
                decrypted_data = encryption_service.decrypt_feedback(result.transaction_hash)
                decrypted_feedback.append({
                    "feedback_id": result.feedback_id,
                    "feedback_data": decrypted_data,
                    "submitted_at": result.feedback_id,  # You might want to add timestamp field
                    "decrypted": True
                })
            except Exception as decrypt_error:
                print(f"Failed to decrypt feedback {result.feedback_id}: {decrypt_error}")
                continue
        
        return {
            "status": "success",
            "data": decrypted_feedback
        }
        
    except Exception as e:
        print("Error:", e)
        raise HTTPException(status_code=500, detail=str(e))