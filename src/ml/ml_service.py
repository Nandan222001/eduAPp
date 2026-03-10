from typing import Dict, List, Optional, Any
from datetime import date, datetime
from sqlalchemy.orm import Session
import pandas as pd
import numpy as np

from src.ml.data_pipeline import StudentPerformanceDataPipeline
from src.ml.feature_engineering import StudentFeatureEngineering
from src.ml.data_preparation import (
    DataValidator,
    TrainingDataPreparation,
    TimeSeriesSplit
)


class MLService:

    def __init__(self, db: Session):
        self.db = db
        self.pipeline = StudentPerformanceDataPipeline(db)
        self.feature_engineer = StudentFeatureEngineering()
        self.data_validator = DataValidator()

    def extract_and_prepare_features(
        self,
        institution_id: int,
        student_ids: Optional[List[int]] = None,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None
    ) -> pd.DataFrame:
        raw_data = self.pipeline.extract_all_data(
            institution_id=institution_id,
            student_ids=student_ids,
            start_date=start_date,
            end_date=end_date
        )
        
        feature_matrix = self.feature_engineer.build_feature_matrix(raw_data)
        
        return feature_matrix

    def prepare_training_dataset(
        self,
        institution_id: int,
        target_column: Optional[str] = None,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        test_size: float = 0.2,
        val_size: float = 0.1,
        normalize: bool = True,
        normalization_method: str = 'standard',
        handle_missing: bool = True,
        missing_strategy: str = 'mean',
        random_state: int = 42
    ) -> Dict[str, Any]:
        feature_matrix = self.extract_and_prepare_features(
            institution_id=institution_id,
            start_date=start_date,
            end_date=end_date
        )
        
        if feature_matrix.empty:
            raise ValueError("No data available for the specified criteria")
        
        quality_report = self.data_validator.check_data_quality(feature_matrix)
        
        data_prep = TrainingDataPreparation(random_state=random_state)
        
        splits = data_prep.prepare_training_data(
            feature_df=feature_matrix,
            target_column=target_column,
            test_size=test_size,
            val_size=val_size,
            normalize=normalize,
            normalization_method=normalization_method,
            handle_missing=handle_missing,
            missing_strategy=missing_strategy,
            exclude_columns=['student_id']
        )
        
        splits['quality_report'] = quality_report
        splits['data_prep'] = data_prep
        
        return splits

    def get_student_performance_summary(
        self,
        institution_id: int,
        student_id: int,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None
    ) -> Dict[str, Any]:
        raw_data = self.pipeline.extract_all_data(
            institution_id=institution_id,
            student_ids=[student_id],
            start_date=start_date,
            end_date=end_date
        )
        
        summary = {
            'student_id': student_id,
            'data_available': {}
        }
        
        if not raw_data['attendance'].empty:
            attendance_pct = self.feature_engineer.calculate_attendance_percentage(
                raw_data['attendance']
            )
            summary['attendance_percentage'] = float(
                attendance_pct.iloc[0]['attendance_percentage']
            ) if not attendance_pct.empty else 0.0
            
            subject_att = self.feature_engineer.calculate_subject_wise_attendance(
                raw_data['attendance']
            )
            summary['subject_wise_attendance'] = subject_att.to_dict('records') if not subject_att.empty else []
        
        if not raw_data['assignments'].empty:
            assignment_stats = self.feature_engineer.calculate_assignment_scores(
                raw_data['assignments']
            )
            if not assignment_stats.empty:
                summary['assignment_stats'] = assignment_stats.iloc[0].to_dict()
            
            subject_assignments = self.feature_engineer.calculate_subject_wise_assignment_scores(
                raw_data['assignments']
            )
            summary['subject_wise_assignments'] = subject_assignments.to_dict('records') if not subject_assignments.empty else []
            
            chapter_performance = self.feature_engineer.calculate_chapter_wise_performance(
                raw_data['assignments']
            )
            summary['chapter_wise_performance'] = chapter_performance.to_dict('records') if not chapter_performance.empty else []
        
        if not raw_data['exams'].empty:
            exam_stats = self.feature_engineer.calculate_exam_performance(
                raw_data['exams']
            )
            if not exam_stats.empty:
                summary['exam_stats'] = exam_stats.iloc[0].to_dict()
            
            exam_trends = self.feature_engineer.calculate_test_trends(
                raw_data['exams']
            )
            if not exam_trends.empty:
                summary['exam_trends'] = exam_trends.iloc[0].to_dict()
            
            subject_exams = self.feature_engineer.calculate_subject_wise_exam_performance(
                raw_data['exams']
            )
            summary['subject_wise_exams'] = subject_exams.to_dict('records') if not subject_exams.empty else []
        
        return summary

    def get_batch_performance_summary(
        self,
        institution_id: int,
        student_ids: List[int],
        start_date: Optional[date] = None,
        end_date: Optional[date] = None
    ) -> pd.DataFrame:
        feature_matrix = self.extract_and_prepare_features(
            institution_id=institution_id,
            student_ids=student_ids,
            start_date=start_date,
            end_date=end_date
        )
        
        return feature_matrix

    def identify_at_risk_students(
        self,
        institution_id: int,
        attendance_threshold: float = 75.0,
        assignment_threshold: float = 60.0,
        exam_threshold: float = 50.0,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None
    ) -> List[Dict[str, Any]]:
        feature_matrix = self.extract_and_prepare_features(
            institution_id=institution_id,
            start_date=start_date,
            end_date=end_date
        )
        
        if feature_matrix.empty:
            return []
        
        at_risk_students = []
        
        for _, row in feature_matrix.iterrows():
            risk_factors = []
            risk_score = 0
            
            if 'attendance_percentage' in row and row['attendance_percentage'] < attendance_threshold:
                risk_factors.append('low_attendance')
                risk_score += 1
            
            if 'avg_assignment_score' in row and row['avg_assignment_score'] < assignment_threshold:
                risk_factors.append('low_assignment_scores')
                risk_score += 1
            
            if 'avg_exam_score' in row and row['avg_exam_score'] < exam_threshold:
                risk_factors.append('low_exam_scores')
                risk_score += 1
            
            if 'exam_trend_slope' in row and row['exam_trend_slope'] < -5:
                risk_factors.append('declining_exam_trend')
                risk_score += 1
            
            if risk_score > 0:
                at_risk_students.append({
                    'student_id': int(row['student_id']),
                    'risk_score': risk_score,
                    'risk_factors': risk_factors,
                    'attendance_percentage': float(row.get('attendance_percentage', 0)),
                    'avg_assignment_score': float(row.get('avg_assignment_score', 0)),
                    'avg_exam_score': float(row.get('avg_exam_score', 0)),
                    'exam_trend_slope': float(row.get('exam_trend_slope', 0))
                })
        
        at_risk_students.sort(key=lambda x: x['risk_score'], reverse=True)
        
        return at_risk_students

    def get_subject_difficulty_analysis(
        self,
        institution_id: int,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None
    ) -> List[Dict[str, Any]]:
        raw_data = self.pipeline.extract_all_data(
            institution_id=institution_id,
            start_date=start_date,
            end_date=end_date
        )
        
        subject_analysis = []
        
        if not raw_data['assignments'].empty:
            subject_assignments = self.feature_engineer.calculate_subject_wise_assignment_scores(
                raw_data['assignments']
            )
            
            if not subject_assignments.empty:
                subject_avg_assignment = subject_assignments.groupby('subject_id').agg({
                    'subject_avg_assignment_score': 'mean'
                }).reset_index()
                
                for _, row in subject_avg_assignment.iterrows():
                    subject_analysis.append({
                        'subject_id': int(row['subject_id']),
                        'avg_assignment_score': float(row['subject_avg_assignment_score']),
                        'difficulty_level': 'high' if row['subject_avg_assignment_score'] < 50 else
                                          'medium' if row['subject_avg_assignment_score'] < 70 else 'low'
                    })
        
        if not raw_data['exams'].empty:
            subject_exams = self.feature_engineer.calculate_subject_wise_exam_performance(
                raw_data['exams']
            )
            
            if not subject_exams.empty:
                subject_avg_exam = subject_exams.groupby('subject_id').agg({
                    'subject_avg_exam_score': 'mean'
                }).reset_index()
                
                for _, row in subject_avg_exam.iterrows():
                    subject_id = int(row['subject_id'])
                    existing = next((s for s in subject_analysis if s['subject_id'] == subject_id), None)
                    
                    if existing:
                        existing['avg_exam_score'] = float(row['subject_avg_exam_score'])
                    else:
                        subject_analysis.append({
                            'subject_id': subject_id,
                            'avg_exam_score': float(row['subject_avg_exam_score']),
                            'difficulty_level': 'high' if row['subject_avg_exam_score'] < 50 else
                                              'medium' if row['subject_avg_exam_score'] < 70 else 'low'
                        })
        
        return subject_analysis
