from pydantic import BaseModel
from typing import Optional
from fastapi import APIRouter, HTTPException

# Change to relative imports
from ..schemas.database import (
    database, Student, Faculty, Admin,
    StudentBase, FacultyBase, AdminBase,
    init_db
)
import json

router = APIRouter()

class LoginRequest(BaseModel):
    email: str
    password: str
    role: str

class CreateAccountRequest(BaseModel):
    Department: Optional[str]
    Email: str
    IsVerified: bool
    Name: str
    Role: str
    RollNumber: Optional[str]
    faculty_id: Optional[str]
    admin_id: Optional[str]

@router.on_event("startup")
async def startup():
    await database.connect()
    init_db()  # Initialize database tables

@router.on_event("shutdown")
async def shutdown():
    await database.disconnect()

@router.post("/")
async def create_account(request: CreateAccountRequest):
    try:
        if request.Role == "student":
            # Create other_attributes JSON with email and department
            other_attrs = json.dumps({
                "email": request.Email,
                "department": request.Department,
                "roll_number": request.RollNumber,
                "is_verified": request.IsVerified
            })
            
            query = Student.__table__.insert().values(
                name=request.Name,
                other_attributes=other_attrs
            )
            
        elif request.Role == "faculty":
            # Create other_attributes JSON with email and department
            other_attrs = json.dumps({
                "email": request.Email,
                "department": request.Department,
                "faculty_id": request.faculty_id,
                "is_verified": request.IsVerified
            })
            
            query = Faculty.__table__.insert().values(
                name=request.Name,
                other_attributes=other_attrs
            )
            
        elif request.Role == "admin":
            # Create other_attributes JSON with email
            other_attrs = json.dumps({
                "email": request.Email,
                "admin_id": request.admin_id,
                "is_verified": request.IsVerified
            })
            
            query = Admin.__table__.insert().values(
                name=request.Name,
                other_attributes=other_attrs
            )
            
        else:
            raise HTTPException(status_code=400, detail="Invalid role specified")

        # Execute the query
        result = await database.execute(query)
        
        return {
            "status": "success",
            "message": f"{request.Role} account created successfully",
            "data": {
                "id": result,
                "name": request.Name,
                "email": request.Email,
                "role": request.Role
            }
        }
    except ValueError as ve:
        # Handle validation errors
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        # Handle other errors
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/login")
async def login(request: LoginRequest):
    try:
        # Select the appropriate table based on role and search by email in other_attributes
        if request.role == "student":
            query = Student.__table__.select().where(
                Student.other_attributes.contains(f'"email": "{request.email}"')
            )
        elif request.role == "faculty":
            query = Faculty.__table__.select().where(
                Faculty.other_attributes.contains(f'"email": "{request.email}"')
            )
        elif request.role == "admin":
            query = Admin.__table__.select().where(
                Admin.other_attributes.contains(f'"email": "{request.email}"')
            )
        else:
            raise HTTPException(status_code=400, detail="Invalid role specified")

        # Execute the query
        result = await database.fetch_one(query)
        
        if not result:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Parse other_attributes to get email and department
        try:
            other_attrs = json.loads(result.other_attributes or '{}')
        except json.JSONDecodeError:
            other_attrs = {}
            
        # In a real application, you should hash and verify the password
        # For now, we'll just return the user data
        return {
            "status": "success",
            "message": "Login successful",
            "data": {
                "id": getattr(result, f'{request.role}_id'),
                "name": result.name,
                "email": other_attrs.get('email'),
                "role": request.role,
                "department": other_attrs.get('department'),
                f"{request.role}_id": getattr(result, f'{request.role}_id')
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))