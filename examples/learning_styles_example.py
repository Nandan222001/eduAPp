"""
Example usage of the Learning Styles and Adaptive Learning System

This example demonstrates:
1. Creating a learning style profile
2. Administering an assessment
3. Generating personalized recommendations
4. Managing adaptive learning sessions
5. Tracking effectiveness
"""

import requests
from typing import Dict, Any

BASE_URL = "http://localhost:8000/api/v1"
AUTH_TOKEN = "your_auth_token_here"

headers = {
    "Authorization": f"Bearer {AUTH_TOKEN}",
    "Content-Type": "application/json"
}


def create_learning_profile(student_id: int) -> Dict[str, Any]:
    """Create a learning style profile for a student"""
    profile_data = {
        "student_id": student_id,
        "visual_score": 0.35,
        "auditory_score": 0.20,
        "kinesthetic_score": 0.25,
        "reading_writing_score": 0.20,
        "social_vs_solitary": "mixed",
        "social_score": 0.60,
        "sequential_vs_global": "sequential",
        "sequential_score": 0.70,
        "cognitive_strengths": {
            "analytical_thinking": "high",
            "creative_thinking": "medium",
            "memory_retention": "high"
        }
    }
    
    response = requests.post(
        f"{BASE_URL}/learning-styles/profiles",
        json=profile_data,
        headers=headers
    )
    
    return response.json()


def get_default_assessment_questions() -> Dict[str, Any]:
    """Get default VARK assessment questions"""
    response = requests.get(
        f"{BASE_URL}/learning-styles/default-assessment-questions",
        headers=headers
    )
    
    return response.json()


def create_assessment(student_id: int) -> Dict[str, Any]:
    """Create a new learning style assessment"""
    questions = get_default_assessment_questions()
    
    assessment_data = {
        "student_id": student_id,
        "assessment_type": "vark",
        "questions": questions["questions"]
    }
    
    response = requests.post(
        f"{BASE_URL}/learning-styles/assessments",
        json=assessment_data,
        headers=headers
    )
    
    return response.json()


def start_assessment(assessment_id: int, student_id: int) -> Dict[str, Any]:
    """Start an assessment"""
    response = requests.post(
        f"{BASE_URL}/learning-styles/assessments/{assessment_id}/start",
        params={"student_id": student_id},
        headers=headers
    )
    
    return response.json()


def submit_assessment(assessment_id: int, responses: list) -> Dict[str, Any]:
    """Submit assessment responses"""
    submission = {
        "assessment_id": assessment_id,
        "responses": responses
    }
    
    response = requests.post(
        f"{BASE_URL}/learning-styles/assessments/submit",
        json=submission,
        headers=headers
    )
    
    return response.json()


def tag_content(content_id: int, content_type: str = "study_material") -> Dict[str, Any]:
    """Tag content with learning style suitability"""
    tag_data = {
        "content_type": content_type,
        "content_id": content_id,
        "visual_suitability": 0.90,
        "auditory_suitability": 0.30,
        "kinesthetic_suitability": 0.20,
        "reading_writing_suitability": 0.70,
        "delivery_format": "video",
        "difficulty_level": "medium",
        "supports_social_learning": False,
        "supports_solitary_learning": True,
        "sequential_flow": True,
        "holistic_approach": False,
        "metadata": {
            "duration_minutes": 15,
            "interactive_elements": ["quizzes", "diagrams"]
        }
    }
    
    response = requests.post(
        f"{BASE_URL}/learning-styles/content-tags",
        json=tag_data,
        headers=headers
    )
    
    return response.json()


def auto_tag_content(content_id: int, content_type: str = "study_material") -> Dict[str, Any]:
    """Automatically tag content based on its type"""
    response = requests.post(
        f"{BASE_URL}/learning-styles/content-tags/{content_type}/{content_id}/auto-tag",
        headers=headers
    )
    
    return response.json()


def generate_recommendations(
    student_id: int,
    subject_id: int = None,
    chapter_id: int = None,
    limit: int = 10
) -> Dict[str, Any]:
    """Generate personalized content recommendations"""
    request_data = {
        "student_id": student_id,
        "subject_id": subject_id,
        "chapter_id": chapter_id,
        "limit": limit
    }
    
    response = requests.post(
        f"{BASE_URL}/learning-styles/recommendations/generate",
        json=request_data,
        headers=headers
    )
    
    return response.json()


def generate_personalized_feed(student_id: int, subject_id: int = None) -> Dict[str, Any]:
    """Generate a personalized content feed"""
    request_data = {
        "student_id": student_id,
        "subject_id": subject_id,
        "limit": 20
    }
    
    response = requests.post(
        f"{BASE_URL}/learning-styles/feed/generate",
        json=request_data,
        headers=headers
    )
    
    return response.json()


def create_adaptive_session(
    student_id: int,
    content_id: int,
    content_type: str = "study_material"
) -> Dict[str, Any]:
    """Create an adaptive learning session"""
    session_data = {
        "student_id": student_id,
        "content_type": content_type,
        "content_id": content_id,
        "initial_format": "video",
        "initial_difficulty": "medium"
    }
    
    response = requests.post(
        f"{BASE_URL}/learning-styles/adaptive-sessions",
        json=session_data,
        headers=headers
    )
    
    return response.json()


def adjust_session_real_time(
    session_id: int,
    success_rate: float,
    engagement_rate: float,
    time_spent: int,
    interaction_count: int
) -> Dict[str, Any]:
    """Get real-time adjustments for difficulty and format"""
    performance_metrics = {
        "success_rate": success_rate,
        "questions_attempted": 10,
        "questions_correct": int(10 * success_rate)
    }
    
    engagement_metrics = {
        "engagement_rate": engagement_rate,
        "time_spent_seconds": time_spent,
        "interaction_count": interaction_count
    }
    
    response = requests.post(
        f"{BASE_URL}/learning-styles/adaptive-sessions/{session_id}/real-time-adjust",
        json={
            "performance_metrics": performance_metrics,
            "engagement_metrics": engagement_metrics
        },
        headers=headers
    )
    
    return response.json()


def end_adaptive_session(session_id: int) -> Dict[str, Any]:
    """End an adaptive learning session"""
    response = requests.post(
        f"{BASE_URL}/learning-styles/adaptive-sessions/{session_id}/end",
        headers=headers
    )
    
    return response.json()


def record_effectiveness(
    student_id: int,
    content_id: int,
    delivery_format: str,
    metrics: Dict[str, Any]
) -> Dict[str, Any]:
    """Record learning effectiveness data"""
    effectiveness_data = {
        "student_id": student_id,
        "content_type": "study_material",
        "content_id": content_id,
        "delivery_format": delivery_format,
        "time_spent_seconds": metrics.get("time_spent_seconds", 300),
        "completion_rate": metrics.get("completion_rate", 1.0),
        "pre_assessment_score": metrics.get("pre_score"),
        "post_assessment_score": metrics.get("post_score"),
        "improvement": metrics.get("improvement"),
        "engagement_score": metrics.get("engagement_score", 0.75),
        "satisfaction_rating": metrics.get("satisfaction_rating", 4),
        "would_recommend": metrics.get("would_recommend", True),
        "feedback": metrics.get("feedback")
    }
    
    response = requests.post(
        f"{BASE_URL}/learning-styles/effectiveness",
        json=effectiveness_data,
        headers=headers
    )
    
    return response.json()


def get_effectiveness_analytics(student_id: int, days: int = 30) -> Dict[str, Any]:
    """Get effectiveness analytics for a student"""
    response = requests.get(
        f"{BASE_URL}/learning-styles/analytics/effectiveness/{student_id}",
        params={"days": days},
        headers=headers
    )
    
    return response.json()


def get_performance_trend(student_id: int, days: int = 30) -> Dict[str, Any]:
    """Get student performance trend"""
    response = requests.get(
        f"{BASE_URL}/learning-styles/adaptive-sessions/performance-trend/{student_id}",
        params={"days": days},
        headers=headers
    )
    
    return response.json()


def main():
    """Example workflow"""
    student_id = 123
    
    # Step 1: Create learning profile
    print("Creating learning style profile...")
    profile = create_learning_profile(student_id)
    print(f"Profile created: {profile['id']}")
    
    # Step 2: Create and administer assessment
    print("\nCreating assessment...")
    assessment = create_assessment(student_id)
    assessment_id = assessment['id']
    
    print("Starting assessment...")
    start_assessment(assessment_id, student_id)
    
    # Simulate student responses (in real app, these come from user input)
    responses = [
        {"question_id": 1, "answer": "a"},  # Visual
        {"question_id": 2, "answer": "a"},  # Visual
        {"question_id": 3, "answer": "b"},  # Social
        {"question_id": 4, "answer": "a"},  # Sequential
        {"question_id": 5, "answer": "a"},  # Visual
    ]
    
    print("Submitting assessment responses...")
    result = submit_assessment(assessment_id, responses)
    print(f"Assessment completed. Dominant style: {result.get('dominant_style')}")
    
    # Step 3: Tag some content
    print("\nTagging content...")
    content_id = 456
    tag = tag_content(content_id)
    print(f"Content tagged with format: {tag['delivery_format']}")
    
    # Step 4: Generate recommendations
    print("\nGenerating recommendations...")
    recommendations = generate_recommendations(student_id, subject_id=5, limit=5)
    print(f"Generated {len(recommendations)} recommendations")
    
    # Step 5: Create adaptive session
    print("\nCreating adaptive learning session...")
    session = create_adaptive_session(student_id, content_id)
    session_id = session['id']
    print(f"Session created: {session_id}")
    
    # Step 6: Simulate learning with adjustments
    print("\nSimulating learning session...")
    
    # First check - doing well
    adjustments = adjust_session_real_time(
        session_id,
        success_rate=0.80,
        engagement_rate=0.70,
        time_spent=180,
        interaction_count=12
    )
    print(f"Adjustments: Difficulty={adjustments['difficulty']['new_difficulty']}, "
          f"Format={adjustments['format']['recommended_format']}")
    
    # Second check - struggling
    adjustments = adjust_session_real_time(
        session_id,
        success_rate=0.55,
        engagement_rate=0.35,
        time_spent=120,
        interaction_count=5
    )
    print(f"Adjustments: Difficulty={adjustments['difficulty']['new_difficulty']}, "
          f"Format={adjustments['format']['recommended_format']}")
    
    # End session
    print("\nEnding session...")
    end_adaptive_session(session_id)
    
    # Step 7: Record effectiveness
    print("\nRecording effectiveness...")
    effectiveness = record_effectiveness(
        student_id,
        content_id,
        "video",
        {
            "time_spent_seconds": 600,
            "completion_rate": 1.0,
            "pre_score": 65.0,
            "post_score": 82.0,
            "improvement": 17.0,
            "engagement_score": 0.75,
            "satisfaction_rating": 4,
            "would_recommend": True,
            "feedback": "The video format worked really well for me!"
        }
    )
    print("Effectiveness recorded")
    
    # Step 8: Get analytics
    print("\nGetting analytics...")
    analytics = get_effectiveness_analytics(student_id, days=30)
    print(f"Analytics: {analytics['total_records']} records analyzed")
    
    trend = get_performance_trend(student_id, days=30)
    print(f"Performance trend: {trend['trend']}, "
          f"Avg success rate: {trend['average_success_rate']}")
    
    print("\nExample workflow completed!")


if __name__ == "__main__":
    main()
