from typing import Dict, List, Optional
import pandas as pd
import numpy as np
from datetime import datetime, timedelta


class StudentFeatureEngineering:

    @staticmethod
    def calculate_attendance_percentage(
        attendance_df: pd.DataFrame,
        subject_id: Optional[int] = None
    ) -> pd.DataFrame:
        if attendance_df.empty:
            return pd.DataFrame(columns=['student_id', 'attendance_percentage'])
        
        df = attendance_df.copy()
        
        if subject_id is not None:
            df = df[df['subject_id'] == subject_id]
        
        df['is_present'] = df['status'].isin(['present', 'late', 'half_day'])
        
        attendance_stats = df.groupby('student_id').agg({
            'is_present': ['sum', 'count']
        }).reset_index()
        
        attendance_stats.columns = ['student_id', 'present_count', 'total_count']
        attendance_stats['attendance_percentage'] = (
            attendance_stats['present_count'] / attendance_stats['total_count'] * 100
        )
        
        return attendance_stats[['student_id', 'attendance_percentage']]

    @staticmethod
    def calculate_subject_wise_attendance(
        attendance_df: pd.DataFrame
    ) -> pd.DataFrame:
        if attendance_df.empty:
            return pd.DataFrame(columns=['student_id', 'subject_id', 'subject_attendance_percentage'])
        
        df = attendance_df.copy()
        df['is_present'] = df['status'].isin(['present', 'late', 'half_day'])
        
        subject_attendance = df.groupby(['student_id', 'subject_id']).agg({
            'is_present': ['sum', 'count']
        }).reset_index()
        
        subject_attendance.columns = ['student_id', 'subject_id', 'present_count', 'total_count']
        subject_attendance['subject_attendance_percentage'] = (
            subject_attendance['present_count'] / subject_attendance['total_count'] * 100
        )
        
        return subject_attendance[['student_id', 'subject_id', 'subject_attendance_percentage']]

    @staticmethod
    def calculate_assignment_scores(
        assignment_df: pd.DataFrame
    ) -> pd.DataFrame:
        if assignment_df.empty:
            return pd.DataFrame(columns=[
                'student_id', 'avg_assignment_score', 'assignment_submission_rate',
                'late_submission_rate', 'assignment_count'
            ])
        
        df = assignment_df.copy()
        
        df['score_percentage'] = np.where(
            df['max_marks'] > 0,
            (df['marks_obtained'] / df['max_marks'] * 100),
            0
        )
        
        df['is_submitted'] = df['status'].isin(['submitted', 'late_submitted', 'graded', 'returned'])
        
        assignment_stats = df.groupby('student_id').agg({
            'score_percentage': 'mean',
            'is_submitted': ['sum', 'count'],
            'is_late': 'sum'
        }).reset_index()
        
        assignment_stats.columns = [
            'student_id', 'avg_assignment_score', 'submitted_count',
            'total_count', 'late_count'
        ]
        
        assignment_stats['assignment_submission_rate'] = (
            assignment_stats['submitted_count'] / assignment_stats['total_count'] * 100
        )
        
        assignment_stats['late_submission_rate'] = np.where(
            assignment_stats['submitted_count'] > 0,
            (assignment_stats['late_count'] / assignment_stats['submitted_count'] * 100),
            0
        )
        
        assignment_stats['assignment_count'] = assignment_stats['total_count']
        
        return assignment_stats[[
            'student_id', 'avg_assignment_score', 'assignment_submission_rate',
            'late_submission_rate', 'assignment_count'
        ]]

    @staticmethod
    def calculate_subject_wise_assignment_scores(
        assignment_df: pd.DataFrame
    ) -> pd.DataFrame:
        if assignment_df.empty:
            return pd.DataFrame(columns=[
                'student_id', 'subject_id', 'subject_avg_assignment_score'
            ])
        
        df = assignment_df.copy()
        df['score_percentage'] = np.where(
            df['max_marks'] > 0,
            (df['marks_obtained'] / df['max_marks'] * 100),
            0
        )
        
        subject_assignment = df.groupby(['student_id', 'subject_id']).agg({
            'score_percentage': 'mean'
        }).reset_index()
        
        subject_assignment.columns = ['student_id', 'subject_id', 'subject_avg_assignment_score']
        
        return subject_assignment

    @staticmethod
    def calculate_chapter_wise_performance(
        assignment_df: pd.DataFrame
    ) -> pd.DataFrame:
        if assignment_df.empty:
            return pd.DataFrame(columns=[
                'student_id', 'subject_id', 'chapter_id', 'chapter_avg_score'
            ])
        
        df = assignment_df.copy()
        df = df[df['chapter_id'].notna()]
        
        df['score_percentage'] = np.where(
            df['max_marks'] > 0,
            (df['marks_obtained'] / df['max_marks'] * 100),
            0
        )
        
        chapter_performance = df.groupby(['student_id', 'subject_id', 'chapter_id']).agg({
            'score_percentage': 'mean'
        }).reset_index()
        
        chapter_performance.columns = [
            'student_id', 'subject_id', 'chapter_id', 'chapter_avg_score'
        ]
        
        return chapter_performance

    @staticmethod
    def calculate_exam_performance(
        exam_df: pd.DataFrame
    ) -> pd.DataFrame:
        if exam_df.empty:
            return pd.DataFrame(columns=[
                'student_id', 'avg_exam_score', 'exam_count',
                'exams_passed', 'exam_pass_rate'
            ])
        
        df = exam_df.copy()
        df = df[df['is_absent'] == False]
        
        df['score_percentage'] = np.where(
            df['total_max_marks'] > 0,
            (df['total_marks_obtained'] / df['total_max_marks'] * 100),
            0
        )
        
        df['is_pass'] = df['score_percentage'] >= 40
        
        exam_stats = df.groupby('student_id').agg({
            'score_percentage': 'mean',
            'exam_id': 'nunique',
            'is_pass': 'sum'
        }).reset_index()
        
        exam_stats.columns = ['student_id', 'avg_exam_score', 'exam_count', 'exams_passed']
        
        exam_stats['exam_pass_rate'] = np.where(
            exam_stats['exam_count'] > 0,
            (exam_stats['exams_passed'] / exam_stats['exam_count'] * 100),
            0
        )
        
        return exam_stats

    @staticmethod
    def calculate_subject_wise_exam_performance(
        exam_df: pd.DataFrame
    ) -> pd.DataFrame:
        if exam_df.empty:
            return pd.DataFrame(columns=[
                'student_id', 'subject_id', 'subject_avg_exam_score'
            ])
        
        df = exam_df.copy()
        df = df[df['is_absent'] == False]
        
        df['score_percentage'] = np.where(
            df['total_max_marks'] > 0,
            (df['total_marks_obtained'] / df['total_max_marks'] * 100),
            0
        )
        
        subject_exam = df.groupby(['student_id', 'subject_id']).agg({
            'score_percentage': 'mean'
        }).reset_index()
        
        subject_exam.columns = ['student_id', 'subject_id', 'subject_avg_exam_score']
        
        return subject_exam

    @staticmethod
    def calculate_test_trends(
        exam_df: pd.DataFrame,
        window_size: int = 3
    ) -> pd.DataFrame:
        if exam_df.empty:
            return pd.DataFrame(columns=[
                'student_id', 'exam_trend_slope', 'recent_exam_avg'
            ])
        
        df = exam_df.copy()
        df = df[df['is_absent'] == False]
        
        df['score_percentage'] = np.where(
            df['total_max_marks'] > 0,
            (df['total_marks_obtained'] / df['total_max_marks'] * 100),
            0
        )
        
        df = df.sort_values(['student_id', 'exam_start_date'])
        
        trends = []
        for student_id in df['student_id'].unique():
            student_scores = df[df['student_id'] == student_id]['score_percentage'].values
            
            if len(student_scores) >= 2:
                x = np.arange(len(student_scores))
                slope = np.polyfit(x, student_scores, 1)[0]
                recent_avg = student_scores[-window_size:].mean()
            else:
                slope = 0
                recent_avg = student_scores[0] if len(student_scores) > 0 else 0
            
            trends.append({
                'student_id': student_id,
                'exam_trend_slope': slope,
                'recent_exam_avg': recent_avg
            })
        
        return pd.DataFrame(trends)

    @staticmethod
    def calculate_exam_type_performance(
        exam_df: pd.DataFrame
    ) -> pd.DataFrame:
        if exam_df.empty:
            return pd.DataFrame()
        
        df = exam_df.copy()
        df = df[df['is_absent'] == False]
        
        df['score_percentage'] = np.where(
            df['total_max_marks'] > 0,
            (df['total_marks_obtained'] / df['total_max_marks'] * 100),
            0
        )
        
        exam_type_pivot = df.pivot_table(
            index='student_id',
            columns='exam_type',
            values='score_percentage',
            aggfunc='mean'
        ).reset_index()
        
        exam_type_pivot.columns = ['student_id'] + [
            f'{col}_avg_score' for col in exam_type_pivot.columns[1:]
        ]
        
        return exam_type_pivot

    @staticmethod
    def build_feature_matrix(
        data: Dict[str, pd.DataFrame]
    ) -> pd.DataFrame:
        students_df = data.get('students', pd.DataFrame())
        
        if students_df.empty:
            return pd.DataFrame()
        
        feature_df = students_df[['student_id']].copy()
        
        attendance_df = data.get('attendance', pd.DataFrame())
        if not attendance_df.empty:
            attendance_features = StudentFeatureEngineering.calculate_attendance_percentage(attendance_df)
            feature_df = feature_df.merge(attendance_features, on='student_id', how='left')
            
            subject_attendance = StudentFeatureEngineering.calculate_subject_wise_attendance(attendance_df)
            if not subject_attendance.empty:
                subject_att_pivot = subject_attendance.pivot_table(
                    index='student_id',
                    columns='subject_id',
                    values='subject_attendance_percentage'
                ).reset_index()
                subject_att_pivot.columns = ['student_id'] + [
                    f'subject_{col}_attendance' for col in subject_att_pivot.columns[1:]
                ]
                feature_df = feature_df.merge(subject_att_pivot, on='student_id', how='left')
        
        assignment_df = data.get('assignments', pd.DataFrame())
        if not assignment_df.empty:
            assignment_features = StudentFeatureEngineering.calculate_assignment_scores(assignment_df)
            feature_df = feature_df.merge(assignment_features, on='student_id', how='left')
            
            subject_assignment = StudentFeatureEngineering.calculate_subject_wise_assignment_scores(assignment_df)
            if not subject_assignment.empty:
                subject_assign_pivot = subject_assignment.pivot_table(
                    index='student_id',
                    columns='subject_id',
                    values='subject_avg_assignment_score'
                ).reset_index()
                subject_assign_pivot.columns = ['student_id'] + [
                    f'subject_{col}_assignment_score' for col in subject_assign_pivot.columns[1:]
                ]
                feature_df = feature_df.merge(subject_assign_pivot, on='student_id', how='left')
            
            chapter_performance = StudentFeatureEngineering.calculate_chapter_wise_performance(assignment_df)
            if not chapter_performance.empty:
                chapter_pivot = chapter_performance.pivot_table(
                    index='student_id',
                    columns=['subject_id', 'chapter_id'],
                    values='chapter_avg_score'
                ).reset_index()
                chapter_pivot.columns = ['student_id'] + [
                    f'chapter_{col[0]}_{col[1]}_score' for col in chapter_pivot.columns[1:]
                ]
                feature_df = feature_df.merge(chapter_pivot, on='student_id', how='left')
        
        exam_df = data.get('exams', pd.DataFrame())
        if not exam_df.empty:
            exam_features = StudentFeatureEngineering.calculate_exam_performance(exam_df)
            feature_df = feature_df.merge(exam_features, on='student_id', how='left')
            
            exam_trends = StudentFeatureEngineering.calculate_test_trends(exam_df)
            feature_df = feature_df.merge(exam_trends, on='student_id', how='left')
            
            subject_exam = StudentFeatureEngineering.calculate_subject_wise_exam_performance(exam_df)
            if not subject_exam.empty:
                subject_exam_pivot = subject_exam.pivot_table(
                    index='student_id',
                    columns='subject_id',
                    values='subject_avg_exam_score'
                ).reset_index()
                subject_exam_pivot.columns = ['student_id'] + [
                    f'subject_{col}_exam_score' for col in subject_exam_pivot.columns[1:]
                ]
                feature_df = feature_df.merge(subject_exam_pivot, on='student_id', how='left')
            
            exam_type_features = StudentFeatureEngineering.calculate_exam_type_performance(exam_df)
            if not exam_type_features.empty:
                feature_df = feature_df.merge(exam_type_features, on='student_id', how='left')
        
        feature_df = feature_df.fillna(0)
        
        return feature_df
