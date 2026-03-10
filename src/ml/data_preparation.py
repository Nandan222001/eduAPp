from typing import Dict, Tuple, List, Optional
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, MinMaxScaler
from sklearn.impute import SimpleImputer
import joblib
from datetime import datetime


class DataValidator:

    @staticmethod
    def validate_dataframe(
        df: pd.DataFrame,
        required_columns: List[str]
    ) -> Tuple[bool, List[str]]:
        missing_columns = [col for col in required_columns if col not in df.columns]
        is_valid = len(missing_columns) == 0
        return is_valid, missing_columns

    @staticmethod
    def validate_numeric_range(
        df: pd.DataFrame,
        column: str,
        min_value: float,
        max_value: float
    ) -> pd.DataFrame:
        if column in df.columns:
            df[column] = df[column].clip(lower=min_value, upper=max_value)
        return df

    @staticmethod
    def validate_percentage_columns(
        df: pd.DataFrame,
        percentage_columns: List[str]
    ) -> pd.DataFrame:
        for col in percentage_columns:
            if col in df.columns:
                df[col] = df[col].clip(lower=0, upper=100)
        return df

    @staticmethod
    def check_data_quality(
        df: pd.DataFrame
    ) -> Dict[str, any]:
        quality_report = {
            'total_rows': len(df),
            'total_columns': len(df.columns),
            'missing_values': df.isnull().sum().to_dict(),
            'missing_percentage': (df.isnull().sum() / len(df) * 100).to_dict(),
            'duplicate_rows': df.duplicated().sum(),
            'numeric_columns': df.select_dtypes(include=[np.number]).columns.tolist(),
            'categorical_columns': df.select_dtypes(include=['object']).columns.tolist()
        }
        
        numeric_stats = {}
        for col in quality_report['numeric_columns']:
            numeric_stats[col] = {
                'mean': df[col].mean(),
                'std': df[col].std(),
                'min': df[col].min(),
                'max': df[col].max(),
                'median': df[col].median()
            }
        quality_report['numeric_stats'] = numeric_stats
        
        return quality_report


class TrainingDataPreparation:

    def __init__(self, random_state: int = 42):
        self.random_state = random_state
        self.scaler = None
        self.imputer = None
        self.feature_names = None

    def prepare_features(
        self,
        feature_df: pd.DataFrame,
        target_column: Optional[str] = None,
        exclude_columns: Optional[List[str]] = None
    ) -> Tuple[pd.DataFrame, Optional[pd.Series]]:
        if exclude_columns is None:
            exclude_columns = ['student_id']
        
        df = feature_df.copy()
        
        for col in exclude_columns:
            if col in df.columns:
                df = df.drop(columns=[col])
        
        if target_column and target_column in feature_df.columns:
            y = feature_df[target_column].copy()
            if target_column in df.columns:
                df = df.drop(columns=[target_column])
        else:
            y = None
        
        return df, y

    def handle_missing_values(
        self,
        X: pd.DataFrame,
        strategy: str = 'mean',
        fit: bool = True
    ) -> pd.DataFrame:
        if fit:
            self.imputer = SimpleImputer(strategy=strategy)
            X_imputed = self.imputer.fit_transform(X)
        else:
            if self.imputer is None:
                raise ValueError("Imputer not fitted. Call with fit=True first.")
            X_imputed = self.imputer.transform(X)
        
        return pd.DataFrame(X_imputed, columns=X.columns, index=X.index)

    def normalize_features(
        self,
        X: pd.DataFrame,
        method: str = 'standard',
        fit: bool = True
    ) -> pd.DataFrame:
        if method == 'standard':
            if fit:
                self.scaler = StandardScaler()
                X_scaled = self.scaler.fit_transform(X)
            else:
                if self.scaler is None:
                    raise ValueError("Scaler not fitted. Call with fit=True first.")
                X_scaled = self.scaler.transform(X)
        elif method == 'minmax':
            if fit:
                self.scaler = MinMaxScaler()
                X_scaled = self.scaler.fit_transform(X)
            else:
                if self.scaler is None:
                    raise ValueError("Scaler not fitted. Call with fit=True first.")
                X_scaled = self.scaler.transform(X)
        else:
            raise ValueError(f"Unknown normalization method: {method}")
        
        return pd.DataFrame(X_scaled, columns=X.columns, index=X.index)

    def create_validation_splits(
        self,
        X: pd.DataFrame,
        y: Optional[pd.Series] = None,
        test_size: float = 0.2,
        val_size: float = 0.1,
        stratify: bool = False
    ) -> Dict[str, any]:
        if y is not None and stratify:
            stratify_param = y
        else:
            stratify_param = None
        
        if val_size > 0:
            X_temp, X_test, y_temp, y_test = train_test_split(
                X, y, test_size=test_size, random_state=self.random_state,
                stratify=stratify_param
            )
            
            adjusted_val_size = val_size / (1 - test_size)
            
            if y is not None and stratify:
                stratify_param = y_temp
            else:
                stratify_param = None
            
            X_train, X_val, y_train, y_val = train_test_split(
                X_temp, y_temp, test_size=adjusted_val_size,
                random_state=self.random_state, stratify=stratify_param
            )
            
            return {
                'X_train': X_train,
                'X_val': X_val,
                'X_test': X_test,
                'y_train': y_train,
                'y_val': y_val,
                'y_test': y_test
            }
        else:
            X_train, X_test, y_train, y_test = train_test_split(
                X, y, test_size=test_size, random_state=self.random_state,
                stratify=stratify_param
            )
            
            return {
                'X_train': X_train,
                'X_test': X_test,
                'y_train': y_train,
                'y_test': y_test
            }

    def prepare_training_data(
        self,
        feature_df: pd.DataFrame,
        target_column: Optional[str] = None,
        test_size: float = 0.2,
        val_size: float = 0.1,
        normalize: bool = True,
        normalization_method: str = 'standard',
        handle_missing: bool = True,
        missing_strategy: str = 'mean',
        exclude_columns: Optional[List[str]] = None,
        stratify: bool = False
    ) -> Dict[str, any]:
        X, y = self.prepare_features(feature_df, target_column, exclude_columns)
        
        self.feature_names = X.columns.tolist()
        
        if handle_missing:
            X = self.handle_missing_values(X, strategy=missing_strategy, fit=True)
        
        if normalize:
            X = self.normalize_features(X, method=normalization_method, fit=True)
        
        splits = self.create_validation_splits(
            X, y, test_size=test_size, val_size=val_size, stratify=stratify
        )
        
        splits['feature_names'] = self.feature_names
        splits['scaler'] = self.scaler
        splits['imputer'] = self.imputer
        
        return splits

    def prepare_inference_data(
        self,
        feature_df: pd.DataFrame,
        exclude_columns: Optional[List[str]] = None
    ) -> pd.DataFrame:
        X, _ = self.prepare_features(feature_df, exclude_columns=exclude_columns)
        
        if self.feature_names:
            missing_features = set(self.feature_names) - set(X.columns)
            for feature in missing_features:
                X[feature] = 0
            X = X[self.feature_names]
        
        if self.imputer:
            X = pd.DataFrame(
                self.imputer.transform(X),
                columns=X.columns,
                index=X.index
            )
        
        if self.scaler:
            X = pd.DataFrame(
                self.scaler.transform(X),
                columns=X.columns,
                index=X.index
            )
        
        return X

    def save_preprocessing_pipeline(
        self,
        filepath: str
    ) -> None:
        pipeline = {
            'scaler': self.scaler,
            'imputer': self.imputer,
            'feature_names': self.feature_names,
            'random_state': self.random_state,
            'saved_at': datetime.utcnow().isoformat()
        }
        joblib.dump(pipeline, filepath)

    def load_preprocessing_pipeline(
        self,
        filepath: str
    ) -> None:
        pipeline = joblib.load(filepath)
        self.scaler = pipeline['scaler']
        self.imputer = pipeline['imputer']
        self.feature_names = pipeline['feature_names']
        self.random_state = pipeline.get('random_state', 42)


class TimeSeriesSplit:

    @staticmethod
    def create_temporal_split(
        df: pd.DataFrame,
        date_column: str,
        train_months: int = 6,
        test_months: int = 2
    ) -> Dict[str, pd.DataFrame]:
        df_sorted = df.sort_values(date_column)
        
        max_date = df_sorted[date_column].max()
        test_start_date = max_date - pd.DateOffset(months=test_months)
        train_start_date = test_start_date - pd.DateOffset(months=train_months)
        
        train_df = df_sorted[
            (df_sorted[date_column] >= train_start_date) &
            (df_sorted[date_column] < test_start_date)
        ]
        
        test_df = df_sorted[df_sorted[date_column] >= test_start_date]
        
        return {
            'train': train_df,
            'test': test_df,
            'train_start': train_start_date,
            'test_start': test_start_date,
            'max_date': max_date
        }

    @staticmethod
    def create_rolling_window_split(
        df: pd.DataFrame,
        date_column: str,
        window_size_months: int = 3,
        step_size_months: int = 1
    ) -> List[Dict[str, pd.DataFrame]]:
        df_sorted = df.sort_values(date_column)
        
        min_date = df_sorted[date_column].min()
        max_date = df_sorted[date_column].max()
        
        splits = []
        current_start = min_date
        
        while current_start + pd.DateOffset(months=window_size_months) <= max_date:
            window_end = current_start + pd.DateOffset(months=window_size_months)
            
            window_df = df_sorted[
                (df_sorted[date_column] >= current_start) &
                (df_sorted[date_column] < window_end)
            ]
            
            splits.append({
                'data': window_df,
                'start_date': current_start,
                'end_date': window_end,
                'size': len(window_df)
            })
            
            current_start += pd.DateOffset(months=step_size_months)
        
        return splits
