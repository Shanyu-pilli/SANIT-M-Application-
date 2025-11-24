from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Change to relative imports (notice the dots)
from .Routers.feedbackrouter import router as FeedbackRouter
from .Models.requests.request import router as RequestRouter

app = FastAPI(
    title="SANIT-M Management System",
    description="A FastAPI-based backend for college management with blockchain integration",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(FeedbackRouter, prefix="/feedback", tags=["feedback"])
app.include_router(RequestRouter, prefix="/createaccount", tags=["account"])

@app.get("/")
async def root():
    return {"message": "SANIT-M Management System API"}

# Allow direct module execution
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=9001, reload=True)