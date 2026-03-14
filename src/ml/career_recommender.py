from typing import Dict, List, Optional, Tuple, Any
import numpy as np
import pandas as pd
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.ensemble import RandomForestClassifier, GradientBoostingRegressor
from sklearn.metrics.pairwise import cosine_similarity
from datetime import date, datetime
import joblib
import json


class CareerRecommenderModel:
    
    def __init__(self):
        self.scaler = StandardScaler()
        self.label_encoders = {}
        self.career_classifier = RandomForestClassifier(
            n_estimators=100,
            max_depth=10,
            random_state=42
        )
        self.match_scorer = GradientBoostingRegressor(
            n_estimators=100,
            learning_rate=0.1,
            max_depth=5,
            random_state=42
        )
        self.is_trained = False
    
    def _extract_student_features(
        self,
        student_profile: Dict[str, Any],
        academic_performance: Dict[str, Any]
    ) -> np.ndarray:
        features = []
        
        personality_mapping = {
            'realistic': 0, 'investigative': 1, 'artistic': 2,
            'social': 3, 'enterprising': 4, 'conventional': 5
        }
        personality_score = personality_mapping.get(
            student_profile.get('personality_type', ''), 0
        )
        features.append(personality_score)
        
        interests = student_profile.get('interests', [])
        interest_scores = [0] * 12
        interest_categories = [
            'stem', 'arts_humanities', 'business', 'healthcare', 'education',
            'engineering', 'technology', 'social_services', 'creative_arts',
            'law_government', 'sports_fitness', 'skilled_trades'
        ]
        for interest in interests:
            if isinstance(interest, dict):
                category = interest.get('category', '')
                score = interest.get('score', 0.5)
                if category in interest_categories:
                    idx = interest_categories.index(category)
                    interest_scores[idx] = score
        features.extend(interest_scores)
        
        top_subjects = student_profile.get('top_subjects', [])
        subject_scores = [0] * 5
        if top_subjects:
            for i, subj in enumerate(top_subjects[:5]):
                if isinstance(subj, dict):
                    subject_scores[i] = subj.get('score', 0) / 100
        features.extend(subject_scores)
        
        academic_summary = student_profile.get('academic_performance_summary', {})
        features.append(academic_summary.get('overall_gpa', 0) / 100)
        features.append(academic_summary.get('average_score', 0) / 100)
        features.append(academic_summary.get('attendance_percentage', 0) / 100)
        
        skills = student_profile.get('current_skills', [])
        features.append(len(skills) / 20)
        
        activities = student_profile.get('extracurricular_activities', [])
        features.append(len(activities) / 10)
        
        achievements = student_profile.get('achievements', [])
        features.append(len(achievements) / 15)
        
        return np.array(features)
    
    def _extract_career_features(self, career_pathway: Dict[str, Any]) -> np.ndarray:
        features = []
        
        education_mapping = {
            'high_school': 0, 'diploma': 1, 'certification': 1,
            'associate_degree': 2, 'bachelor_degree': 3,
            'master_degree': 4, 'doctoral_degree': 5, 'professional_degree': 5
        }
        education_level = education_mapping.get(
            career_pathway.get('required_education', ''), 0
        )
        features.append(education_level)
        
        required_skills = career_pathway.get('required_skills', [])
        features.append(len(required_skills) / 20)
        
        avg_salary = (
            float(career_pathway.get('average_salary_min', 0) or 0) +
            float(career_pathway.get('average_salary_max', 0) or 0)
        ) / 2
        features.append(min(avg_salary / 200000, 1.0))
        
        growth_rate = float(career_pathway.get('job_growth_rate', 0) or 0)
        features.append(min(growth_rate / 20, 1.0))
        
        demand_mapping = {'low': 0.3, 'medium': 0.6, 'high': 0.9}
        demand_score = demand_mapping.get(
            career_pathway.get('demand_level', 'medium'), 0.6
        )
        features.append(demand_score)
        
        personality_match = career_pathway.get('personality_match', [])
        personality_scores = [0] * 6
        personality_types = [
            'realistic', 'investigative', 'artistic',
            'social', 'enterprising', 'conventional'
        ]
        for match in personality_match:
            if isinstance(match, dict):
                ptype = match.get('type', '')
                score = match.get('score', 0)
                if ptype in personality_types:
                    idx = personality_types.index(ptype)
                    personality_scores[idx] = score
        features.extend(personality_scores)
        
        return np.array(features)
    
    def calculate_skill_match(
        self,
        student_skills: List[Dict[str, Any]],
        required_skills: List[Dict[str, Any]]
    ) -> float:
        if not required_skills:
            return 1.0
        
        student_skill_dict = {}
        for skill in student_skills:
            if isinstance(skill, dict):
                name = skill.get('name', '').lower()
                level = skill.get('level', 'beginner')
                level_scores = {
                    'beginner': 0.25, 'intermediate': 0.5,
                    'advanced': 0.75, 'expert': 1.0
                }
                student_skill_dict[name] = level_scores.get(level, 0.25)
        
        match_scores = []
        for req_skill in required_skills:
            if isinstance(req_skill, dict):
                skill_name = req_skill.get('name', '').lower()
                required_level = req_skill.get('level', 'intermediate')
                
                if skill_name in student_skill_dict:
                    level_scores = {
                        'beginner': 0.25, 'intermediate': 0.5,
                        'advanced': 0.75, 'expert': 1.0
                    }
                    required_score = level_scores.get(required_level, 0.5)
                    actual_score = student_skill_dict[skill_name]
                    match_scores.append(min(actual_score / required_score, 1.0))
                else:
                    match_scores.append(0.0)
        
        return sum(match_scores) / len(match_scores) if match_scores else 0.0
    
    def calculate_interest_match(
        self,
        student_interests: List[Dict[str, Any]],
        career_category: str
    ) -> float:
        if not student_interests:
            return 0.5
        
        interest_dict = {}
        for interest in student_interests:
            if isinstance(interest, dict):
                category = interest.get('category', '').lower()
                score = interest.get('score', 0.5)
                interest_dict[category] = score
        
        career_cat = career_category.lower()
        return interest_dict.get(career_cat, 0.3)
    
    def calculate_personality_match(
        self,
        student_personality: str,
        career_personality_match: List[Dict[str, Any]]
    ) -> float:
        if not career_personality_match or not student_personality:
            return 0.5
        
        for match in career_personality_match:
            if isinstance(match, dict):
                if match.get('type', '').lower() == student_personality.lower():
                    return match.get('score', 0.5)
        
        return 0.3
    
    def calculate_academic_match(
        self,
        student_profile: Dict[str, Any],
        career_pathway: Dict[str, Any]
    ) -> float:
        academic_summary = student_profile.get('academic_performance_summary', {})
        overall_performance = academic_summary.get('average_score', 0) / 100
        
        education_mapping = {
            'high_school': 0.5, 'diploma': 0.6, 'certification': 0.6,
            'associate_degree': 0.65, 'bachelor_degree': 0.75,
            'master_degree': 0.85, 'doctoral_degree': 0.95, 'professional_degree': 0.95
        }
        required_education = career_pathway.get('required_education', 'bachelor_degree')
        education_threshold = education_mapping.get(required_education, 0.75)
        
        if overall_performance >= education_threshold:
            return min(overall_performance / education_threshold, 1.0)
        else:
            return overall_performance / education_threshold * 0.8
    
    def generate_recommendations(
        self,
        student_profile: Dict[str, Any],
        career_pathways: List[Dict[str, Any]],
        top_n: int = 10
    ) -> List[Dict[str, Any]]:
        recommendations = []
        
        for career in career_pathways:
            skill_match = self.calculate_skill_match(
                student_profile.get('current_skills', []),
                career.get('required_skills', [])
            )
            
            interest_match = self.calculate_interest_match(
                student_profile.get('interests', []),
                career.get('category', '')
            )
            
            personality_match = self.calculate_personality_match(
                student_profile.get('personality_type', ''),
                career.get('personality_match', [])
            )
            
            academic_match = self.calculate_academic_match(
                student_profile,
                career
            )
            
            weights = {
                'skill': 0.30,
                'interest': 0.30,
                'personality': 0.20,
                'academic': 0.20
            }
            
            match_score = (
                skill_match * weights['skill'] +
                interest_match * weights['interest'] +
                personality_match * weights['personality'] +
                academic_match * weights['academic']
            )
            
            confidence_level = self._calculate_confidence(
                skill_match, interest_match, personality_match, academic_match
            )
            
            recommendations.append({
                'career_pathway_id': career.get('id'),
                'career_title': career.get('title'),
                'match_score': round(match_score * 100, 2),
                'confidence_level': round(confidence_level * 100, 2),
                'skill_match_score': round(skill_match * 100, 2),
                'interest_match_score': round(interest_match * 100, 2),
                'personality_match_score': round(personality_match * 100, 2),
                'academic_match_score': round(academic_match * 100, 2),
                'matching_factors': self._get_matching_factors(
                    skill_match, interest_match, personality_match, academic_match
                ),
                'recommendation_reasons': self._generate_reasons(
                    student_profile, career,
                    skill_match, interest_match, personality_match, academic_match
                ),
                'estimated_preparation_time': self._estimate_preparation_time(
                    student_profile, career
                ),
                'difficulty_level': self._calculate_difficulty(
                    student_profile, career
                )
            })
        
        recommendations.sort(key=lambda x: x['match_score'], reverse=True)
        
        for i, rec in enumerate(recommendations[:top_n], 1):
            rec['rank'] = i
        
        return recommendations[:top_n]
    
    def _calculate_confidence(
        self,
        skill_match: float,
        interest_match: float,
        personality_match: float,
        academic_match: float
    ) -> float:
        scores = [skill_match, interest_match, personality_match, academic_match]
        avg_score = sum(scores) / len(scores)
        variance = sum((s - avg_score) ** 2 for s in scores) / len(scores)
        consistency = 1 - min(variance, 0.5)
        
        return (avg_score * 0.7 + consistency * 0.3)
    
    def _get_matching_factors(
        self,
        skill_match: float,
        interest_match: float,
        personality_match: float,
        academic_match: float
    ) -> List[Dict[str, Any]]:
        factors = [
            {'factor': 'Skills', 'score': round(skill_match * 100, 2)},
            {'factor': 'Interests', 'score': round(interest_match * 100, 2)},
            {'factor': 'Personality', 'score': round(personality_match * 100, 2)},
            {'factor': 'Academic Performance', 'score': round(academic_match * 100, 2)}
        ]
        return sorted(factors, key=lambda x: x['score'], reverse=True)
    
    def _generate_reasons(
        self,
        student_profile: Dict[str, Any],
        career: Dict[str, Any],
        skill_match: float,
        interest_match: float,
        personality_match: float,
        academic_match: float
    ) -> List[str]:
        reasons = []
        
        if interest_match > 0.7:
            reasons.append(
                f"Your strong interest in {career.get('category', 'this field')} "
                "aligns well with this career path."
            )
        
        if skill_match > 0.6:
            reasons.append(
                "You already possess many of the skills required for this career."
            )
        
        if personality_match > 0.7:
            reasons.append(
                "Your personality type is well-suited for this career's work environment."
            )
        
        if academic_match > 0.75:
            reasons.append(
                "Your academic performance suggests you can meet the educational requirements."
            )
        
        growth_rate = career.get('job_growth_rate', 0)
        if growth_rate and growth_rate > 5:
            reasons.append(
                f"This field has a strong job growth rate of {growth_rate}%."
            )
        
        if not reasons:
            reasons.append(
                "This career path matches several aspects of your profile."
            )
        
        return reasons[:5]
    
    def _estimate_preparation_time(
        self,
        student_profile: Dict[str, Any],
        career: Dict[str, Any]
    ) -> str:
        education_times = {
            'high_school': '0-1 years',
            'diploma': '1-2 years',
            'certification': '6 months - 1 year',
            'associate_degree': '2-3 years',
            'bachelor_degree': '4-5 years',
            'master_degree': '6-7 years',
            'doctoral_degree': '8-12 years',
            'professional_degree': '6-8 years'
        }
        
        required_education = career.get('required_education', 'bachelor_degree')
        return education_times.get(required_education, '4-5 years')
    
    def _calculate_difficulty(
        self,
        student_profile: Dict[str, Any],
        career: Dict[str, Any]
    ) -> str:
        education_mapping = {
            'high_school': 1, 'diploma': 2, 'certification': 2,
            'associate_degree': 3, 'bachelor_degree': 4,
            'master_degree': 5, 'doctoral_degree': 6, 'professional_degree': 6
        }
        
        required_education = career.get('required_education', 'bachelor_degree')
        education_difficulty = education_mapping.get(required_education, 4)
        
        skill_gap = len(career.get('required_skills', [])) - len(
            student_profile.get('current_skills', [])
        )
        
        difficulty_score = education_difficulty + max(skill_gap / 5, 0)
        
        if difficulty_score <= 2:
            return 'Easy'
        elif difficulty_score <= 4:
            return 'Moderate'
        elif difficulty_score <= 5:
            return 'Challenging'
        else:
            return 'Very Challenging'
    
    def analyze_skill_gap(
        self,
        student_profile: Dict[str, Any],
        career_pathway: Dict[str, Any]
    ) -> Dict[str, Any]:
        student_skills = student_profile.get('current_skills', [])
        required_skills = career_pathway.get('required_skills', [])
        
        student_skill_names = {
            skill.get('name', '').lower() for skill in student_skills
            if isinstance(skill, dict)
        }
        
        gaps = []
        priority_skills = []
        foundational_skills = []
        advanced_skills = []
        
        for req_skill in required_skills:
            if isinstance(req_skill, dict):
                skill_name = req_skill.get('name', '')
                skill_level = req_skill.get('level', 'intermediate')
                importance = req_skill.get('importance', 'medium')
                
                if skill_name.lower() not in student_skill_names:
                    gap_info = {
                        'name': skill_name,
                        'required_level': skill_level,
                        'current_level': 'none',
                        'importance': importance
                    }
                    gaps.append(gap_info)
                    
                    if importance == 'high':
                        priority_skills.append(gap_info)
                    
                    if skill_level in ['beginner', 'intermediate']:
                        foundational_skills.append(gap_info)
                    else:
                        advanced_skills.append(gap_info)
        
        gap_count = len(gaps)
        total_skills = len(required_skills)
        gap_percentage = (gap_count / total_skills * 100) if total_skills > 0 else 0
        
        if gap_percentage > 70:
            severity = 'high'
            estimated_time = '2-3 years'
        elif gap_percentage > 40:
            severity = 'medium'
            estimated_time = '1-2 years'
        else:
            severity = 'low'
            estimated_time = '6-12 months'
        
        return {
            'required_skills': required_skills,
            'current_skills': student_skills,
            'skill_gaps': gaps,
            'gap_severity': severity,
            'estimated_time_to_close': estimated_time,
            'priority_skills': priority_skills,
            'foundational_skills': foundational_skills,
            'advanced_skills': advanced_skills,
            'recommended_actions': self._generate_skill_actions(gaps),
            'learning_resources': self._suggest_learning_resources(gaps)
        }
    
    def _generate_skill_actions(
        self,
        skill_gaps: List[Dict[str, Any]]
    ) -> List[Dict[str, str]]:
        actions = []
        
        high_priority = [g for g in skill_gaps if g.get('importance') == 'high']
        if high_priority:
            actions.append({
                'priority': 'high',
                'action': f"Focus on acquiring {len(high_priority)} high-priority skills first",
                'timeline': 'Next 3-6 months'
            })
        
        foundational = [
            g for g in skill_gaps
            if g.get('required_level') in ['beginner', 'intermediate']
        ]
        if foundational:
            actions.append({
                'priority': 'medium',
                'action': f"Build foundational knowledge in {len(foundational)} core skills",
                'timeline': 'Next 6-12 months'
            })
        
        advanced = [
            g for g in skill_gaps
            if g.get('required_level') in ['advanced', 'expert']
        ]
        if advanced:
            actions.append({
                'priority': 'low',
                'action': f"Work towards advanced proficiency in {len(advanced)} specialized skills",
                'timeline': 'Next 12-24 months'
            })
        
        return actions
    
    def _suggest_learning_resources(
        self,
        skill_gaps: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        resources = []
        
        for gap in skill_gaps[:5]:
            skill_name = gap.get('name', '')
            resources.append({
                'skill': skill_name,
                'resource_types': ['Online courses', 'Certifications', 'Books', 'Practice projects'],
                'estimated_time': self._estimate_skill_learning_time(gap.get('required_level', 'intermediate'))
            })
        
        return resources
    
    def _estimate_skill_learning_time(self, level: str) -> str:
        time_mapping = {
            'beginner': '2-4 weeks',
            'intermediate': '2-3 months',
            'advanced': '6-12 months',
            'expert': '1-2 years'
        }
        return time_mapping.get(level, '2-3 months')
    
    def save_model(self, file_path: str) -> None:
        model_data = {
            'scaler': self.scaler,
            'label_encoders': self.label_encoders,
            'career_classifier': self.career_classifier,
            'match_scorer': self.match_scorer,
            'is_trained': self.is_trained
        }
        joblib.dump(model_data, file_path)
    
    def load_model(self, file_path: str) -> None:
        model_data = joblib.load(file_path)
        self.scaler = model_data['scaler']
        self.label_encoders = model_data['label_encoders']
        self.career_classifier = model_data['career_classifier']
        self.match_scorer = model_data['match_scorer']
        self.is_trained = model_data['is_trained']
