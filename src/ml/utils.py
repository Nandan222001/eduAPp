from typing import List, Dict, Any, Optional
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import joblib
import os


class MLUtils:

    @staticmethod
    def safe_divide(numerator: float, denominator: float, default: float = 0.0) -> float:
        try:
            if denominator == 0:
                return default
            return numerator / denominator
        except (TypeError, ZeroDivisionError):
            return default

    @staticmethod
    def calculate_percentile(
        values: List[float],
        percentile: int
    ) -> float:
        if not values:
            return 0.0
        return float(np.percentile(values, percentile))

    @staticmethod
    def calculate_z_score(
        value: float,
        mean: float,
        std: float
    ) -> float:
        if std == 0:
            return 0.0
        return (value - mean) / std

    @staticmethod
    def categorize_score(
        score: float,
        excellent_threshold: float = 90,
        good_threshold: float = 75,
        average_threshold: float = 60,
        poor_threshold: float = 40
    ) -> str:
        if score >= excellent_threshold:
            return "excellent"
        elif score >= good_threshold:
            return "good"
        elif score >= average_threshold:
            return "average"
        elif score >= poor_threshold:
            return "below_average"
        else:
            return "poor"

    @staticmethod
    def detect_outliers_iqr(
        data: pd.Series,
        multiplier: float = 1.5
    ) -> pd.Series:
        Q1 = data.quantile(0.25)
        Q3 = data.quantile(0.75)
        IQR = Q3 - Q1
        lower_bound = Q1 - multiplier * IQR
        upper_bound = Q3 + multiplier * IQR
        return (data < lower_bound) | (data > upper_bound)

    @staticmethod
    def detect_outliers_zscore(
        data: pd.Series,
        threshold: float = 3.0
    ) -> pd.Series:
        mean = data.mean()
        std = data.std()
        z_scores = np.abs((data - mean) / std)
        return z_scores > threshold

    @staticmethod
    def smooth_time_series(
        data: pd.Series,
        window_size: int = 3
    ) -> pd.Series:
        return data.rolling(window=window_size, min_periods=1).mean()

    @staticmethod
    def calculate_moving_average(
        values: List[float],
        window_size: int = 3
    ) -> List[float]:
        if len(values) < window_size:
            return values
        
        df = pd.DataFrame({'value': values})
        return df['value'].rolling(window=window_size, min_periods=1).mean().tolist()

    @staticmethod
    def calculate_trend(
        values: List[float],
        dates: Optional[List[datetime]] = None
    ) -> Dict[str, float]:
        if len(values) < 2:
            return {'slope': 0.0, 'intercept': 0.0, 'r_squared': 0.0}
        
        x = np.arange(len(values)) if dates is None else np.array([(d - dates[0]).days for d in dates])
        y = np.array(values)
        
        coefficients = np.polyfit(x, y, 1)
        slope, intercept = coefficients
        
        y_pred = slope * x + intercept
        ss_res = np.sum((y - y_pred) ** 2)
        ss_tot = np.sum((y - np.mean(y)) ** 2)
        r_squared = 1 - (ss_res / ss_tot) if ss_tot != 0 else 0
        
        return {
            'slope': float(slope),
            'intercept': float(intercept),
            'r_squared': float(r_squared)
        }

    @staticmethod
    def normalize_scores(
        scores: List[float],
        min_score: float = 0,
        max_score: float = 100
    ) -> List[float]:
        if not scores or max(scores) == min(scores):
            return scores
        
        arr = np.array(scores)
        normalized = (arr - arr.min()) / (arr.max() - arr.min())
        scaled = normalized * (max_score - min_score) + min_score
        return scaled.tolist()


class ModelPersistence:

    @staticmethod
    def save_model(
        model: Any,
        filepath: str,
        metadata: Optional[Dict[str, Any]] = None
    ) -> None:
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        
        model_package = {
            'model': model,
            'metadata': metadata or {},
            'saved_at': datetime.utcnow().isoformat()
        }
        
        joblib.dump(model_package, filepath)

    @staticmethod
    def load_model(filepath: str) -> Dict[str, Any]:
        if not os.path.exists(filepath):
            raise FileNotFoundError(f"Model file not found: {filepath}")
        
        model_package = joblib.load(filepath)
        return model_package

    @staticmethod
    def save_predictions(
        predictions: List[Any],
        student_ids: List[int],
        filepath: str,
        additional_data: Optional[Dict[str, Any]] = None
    ) -> None:
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        
        df = pd.DataFrame({
            'student_id': student_ids,
            'prediction': predictions
        })
        
        if additional_data:
            for key, values in additional_data.items():
                df[key] = values
        
        df['timestamp'] = datetime.utcnow().isoformat()
        
        df.to_csv(filepath, index=False)


class FeatureImportanceAnalyzer:

    @staticmethod
    def calculate_feature_importance(
        model: Any,
        feature_names: List[str],
        method: str = 'default'
    ) -> pd.DataFrame:
        if hasattr(model, 'feature_importances_'):
            importances = model.feature_importances_
        elif hasattr(model, 'coef_'):
            importances = np.abs(model.coef_).flatten()
        else:
            raise ValueError("Model does not support feature importance extraction")
        
        importance_df = pd.DataFrame({
            'feature': feature_names,
            'importance': importances
        }).sort_values('importance', ascending=False)
        
        return importance_df

    @staticmethod
    def get_top_features(
        importance_df: pd.DataFrame,
        top_n: int = 10
    ) -> List[str]:
        return importance_df.head(top_n)['feature'].tolist()


class DataAggregator:

    @staticmethod
    def aggregate_by_time_period(
        df: pd.DataFrame,
        date_column: str,
        value_columns: List[str],
        period: str = 'M',
        agg_func: str = 'mean'
    ) -> pd.DataFrame:
        df[date_column] = pd.to_datetime(df[date_column])
        df_copy = df.copy()
        df_copy.set_index(date_column, inplace=True)
        
        aggregated = df_copy[value_columns].resample(period).agg(agg_func)
        
        return aggregated.reset_index()

    @staticmethod
    def aggregate_by_group(
        df: pd.DataFrame,
        group_columns: List[str],
        value_columns: List[str],
        agg_func: str = 'mean'
    ) -> pd.DataFrame:
        return df.groupby(group_columns)[value_columns].agg(agg_func).reset_index()

    @staticmethod
    def pivot_performance_data(
        df: pd.DataFrame,
        index_col: str,
        column_col: str,
        value_col: str,
        agg_func: str = 'mean'
    ) -> pd.DataFrame:
        return df.pivot_table(
            index=index_col,
            columns=column_col,
            values=value_col,
            aggfunc=agg_func
        ).reset_index()


class PerformanceMetrics:

    @staticmethod
    def calculate_improvement_rate(
        initial_score: float,
        final_score: float
    ) -> float:
        if initial_score == 0:
            return 0.0
        return ((final_score - initial_score) / initial_score) * 100

    @staticmethod
    def calculate_consistency_score(
        scores: List[float]
    ) -> float:
        if len(scores) < 2:
            return 100.0
        
        std = np.std(scores)
        mean = np.mean(scores)
        
        if mean == 0:
            return 0.0
        
        cv = (std / mean) * 100
        consistency = max(0, 100 - cv)
        
        return float(consistency)

    @staticmethod
    def calculate_performance_index(
        attendance_pct: float,
        assignment_score: float,
        exam_score: float,
        attendance_weight: float = 0.2,
        assignment_weight: float = 0.3,
        exam_weight: float = 0.5
    ) -> float:
        total_weight = attendance_weight + assignment_weight + exam_weight
        
        performance_index = (
            (attendance_pct * attendance_weight) +
            (assignment_score * assignment_weight) +
            (exam_score * exam_weight)
        ) / total_weight
        
        return float(performance_index)
