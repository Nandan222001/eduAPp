"""
Weakness Detection and Recommendation Engine Example

This example demonstrates how to use the comprehensive weakness detection system
to analyze student performance, generate recommendations, and provide personalized insights.
"""

from datetime import date, timedelta
from sqlalchemy.orm import Session
from src.database import get_db
from src.services.weakness_detection_service import (
    WeaknessDetectionEngine,
    ChapterPerformanceAnalyzer,
    SmartQuestionRecommender,
    FocusAreaPrioritizer,
    PersonalizedInsightGenerator
)


def example_comprehensive_analysis(db: Session, institution_id: int, student_id: int):
    """
    Run a comprehensive weakness detection analysis for a student.
    This includes:
    - Chapter-wise performance analysis
    - Smart question recommendations with spaced repetition
    - Focus area prioritization
    - AI-powered personalized insights
    """
    print("=" * 80)
    print("COMPREHENSIVE WEAKNESS DETECTION ANALYSIS")
    print("=" * 80)
    
    engine = WeaknessDetectionEngine(db)
    
    target_exam_date = date.today() + timedelta(days=30)
    
    result = engine.run_comprehensive_analysis(
        institution_id=institution_id,
        student_id=student_id,
        target_exam_date=target_exam_date,
        generate_recommendations=True
    )
    
    print("\n📊 ANALYSIS SUMMARY")
    print("-" * 80)
    summary = result['summary']
    print(f"Total Chapters Analyzed: {summary['total_chapters_analyzed']}")
    print(f"Weak Chapters Identified: {summary['weak_chapters_count']}")
    print(f"Weak Areas Count: {summary['weak_areas_count']}")
    print(f"Focus Areas Identified: {summary['focus_areas_count']}")
    print(f"Critical Focus Areas: {summary['critical_focus_areas']}")
    print(f"Question Recommendations: {summary['question_recommendations_count']}")
    print(f"Personalized Insights: {summary['personalized_insights_count']}")
    print(f"Average Mastery Score: {summary['average_mastery_score']:.2f}%")
    
    print("\n🎯 TOP IMPROVEMENT AREAS")
    print("-" * 80)
    for idx, area in enumerate(summary['improvement_areas'], 1):
        print(f"{idx}. {area['subject']} - {area['chapter']}")
        print(f"   Mastery Score: {area['mastery_score']:.2f}% | Trend: {area['trend']}")
    
    print("\n⚡ TOP PRIORITIES")
    print("-" * 80)
    for idx, priority in enumerate(summary['top_priorities'], 1):
        print(f"{idx}. {priority['area']} ({priority['type'].upper()})")
        print(f"   Priority Score: {priority['priority_score']:.2f}")
        print(f"   Recommended Hours: {priority['recommended_hours']:.1f}")
    
    return result


def example_chapter_performance_analysis(db: Session, institution_id: int, student_id: int):
    """
    Analyze chapter-wise performance to identify strengths and weaknesses.
    """
    print("\n" + "=" * 80)
    print("CHAPTER-WISE PERFORMANCE ANALYSIS")
    print("=" * 80)
    
    analyzer = ChapterPerformanceAnalyzer(db)
    
    performances = analyzer.analyze_chapter_performance(
        institution_id=institution_id,
        student_id=student_id
    )
    
    print(f"\n📚 Total Chapters Analyzed: {len(performances)}")
    
    performances_sorted = sorted(performances, key=lambda x: float(x.mastery_score))
    
    print("\n🔴 WEAKEST CHAPTERS (Bottom 5)")
    print("-" * 80)
    for idx, perf in enumerate(performances_sorted[:5], 1):
        print(f"{idx}. {perf.chapter.name} ({perf.subject.name})")
        print(f"   Mastery Score: {perf.mastery_score}%")
        print(f"   Average Score: {perf.average_score}%")
        print(f"   Success Rate: {perf.success_rate}%")
        print(f"   Trend: {perf.trend}")
        print(f"   Proficiency: {perf.proficiency_level}")
        print(f"   Attempts: {perf.total_attempts} (✓{perf.successful_attempts} / ✗{perf.failed_attempts})")
        print()
    
    print("\n🟢 STRONGEST CHAPTERS (Top 5)")
    print("-" * 80)
    for idx, perf in enumerate(reversed(performances_sorted[-5:]), 1):
        print(f"{idx}. {perf.chapter.name} ({perf.subject.name})")
        print(f"   Mastery Score: {perf.mastery_score}%")
        print(f"   Average Score: {perf.average_score}%")
        print(f"   Success Rate: {perf.success_rate}%")
        print(f"   Trend: {perf.trend}")
        print()


def example_smart_question_recommendations(db: Session, institution_id: int, student_id: int):
    """
    Generate smart question recommendations using spaced repetition algorithm.
    """
    print("\n" + "=" * 80)
    print("SMART QUESTION RECOMMENDATIONS")
    print("=" * 80)
    
    from src.models.study_planner import WeakArea
    
    weak_areas = db.query(WeakArea).filter(
        WeakArea.institution_id == institution_id,
        WeakArea.student_id == student_id,
        WeakArea.is_resolved == False
    ).order_by(WeakArea.weakness_score.desc()).limit(5).all()
    
    recommender = SmartQuestionRecommender(db)
    
    recommendations = recommender.generate_recommendations(
        institution_id=institution_id,
        student_id=student_id,
        weak_areas=weak_areas,
        limit=20
    )
    
    print(f"\n📝 Total Recommendations Generated: {len(recommendations)}")
    
    print("\n🎯 TOP 10 RECOMMENDED QUESTIONS")
    print("-" * 80)
    for idx, rec in enumerate(recommendations[:10], 1):
        print(f"{idx}. Question ID: {rec.question_id}")
        print(f"   Recommendation Score: {rec.recommendation_score:.2f}")
        print(f"   Relevance: {rec.relevance_score:.1f}%")
        print(f"   Difficulty Match: {rec.difficulty_match_score:.1f}%")
        print(f"   Weakness Alignment: {rec.weakness_alignment_score:.1f}%")
        print(f"   Spaced Repetition: {rec.spaced_repetition_score:.1f}%")
        print(f"   Next Review: {rec.next_review_date}")
        print(f"   Priority Rank: #{rec.priority_rank}")
        print()
    
    print("\n💡 SPACED REPETITION INSIGHTS")
    print("-" * 80)
    due_today = [r for r in recommendations if r.next_review_date and r.next_review_date <= date.today()]
    due_this_week = [r for r in recommendations if r.next_review_date and r.next_review_date <= date.today() + timedelta(days=7)]
    
    print(f"Due Today: {len(due_today)} questions")
    print(f"Due This Week: {len(due_this_week)} questions")
    print(f"Average Ease Factor: {sum(float(r.ease_factor) for r in recommendations) / len(recommendations):.2f}")
    print(f"Average Repetition Number: {sum(r.repetition_number for r in recommendations) / len(recommendations):.1f}")


def example_update_spaced_repetition(db: Session, institution_id: int, recommendation_id: int):
    """
    Update spaced repetition schedule based on student performance.
    """
    print("\n" + "=" * 80)
    print("UPDATE SPACED REPETITION")
    print("=" * 80)
    
    recommender = SmartQuestionRecommender(db)
    
    performance_score = 85.0
    
    print(f"\nUpdating recommendation {recommendation_id} with performance score: {performance_score}%")
    
    updated = recommender.update_spaced_repetition(
        recommendation_id=recommendation_id,
        performance_score=performance_score,
        institution_id=institution_id
    )
    
    print("\n✅ UPDATE COMPLETE")
    print("-" * 80)
    print(f"New Ease Factor: {updated.ease_factor}")
    print(f"New Interval: {updated.interval_days} days")
    print(f"Next Review Date: {updated.next_review_date}")
    print(f"Repetition Number: {updated.repetition_number}")
    print(f"Is Completed: {updated.is_completed}")


def example_focus_area_prioritization(db: Session, institution_id: int, student_id: int):
    """
    Identify and prioritize focus areas using AI predictions.
    """
    print("\n" + "=" * 80)
    print("FOCUS AREA PRIORITIZATION")
    print("=" * 80)
    
    prioritizer = FocusAreaPrioritizer(db)
    
    target_exam_date = date.today() + timedelta(days=30)
    
    focus_areas = prioritizer.identify_focus_areas(
        institution_id=institution_id,
        student_id=student_id,
        target_exam_date=target_exam_date,
        ai_predictions=None
    )
    
    print(f"\n🎯 Total Focus Areas Identified: {len(focus_areas)}")
    
    critical = [f for f in focus_areas if f.focus_type == 'critical']
    high_priority = [f for f in focus_areas if f.focus_type == 'high_priority']
    remedial = [f for f in focus_areas if f.focus_type == 'remedial']
    
    print(f"\n📊 BREAKDOWN BY TYPE")
    print("-" * 80)
    print(f"Critical: {len(critical)}")
    print(f"High Priority: {len(high_priority)}")
    print(f"Remedial: {len(remedial)}")
    print(f"Maintenance: {len(focus_areas) - len(critical) - len(high_priority) - len(remedial)}")
    
    print("\n⚠️ TOP 5 FOCUS AREAS")
    print("-" * 80)
    for idx, focus in enumerate(focus_areas[:5], 1):
        area_name = focus.topic.name if focus.topic else (focus.chapter.name if focus.chapter else focus.subject.name)
        print(f"\n{idx}. {area_name} ({focus.focus_type.upper()})")
        print(f"   Combined Priority: {focus.combined_priority:.2f}")
        print(f"   Urgency: {focus.urgency_score:.1f}%")
        print(f"   Importance: {focus.importance_score:.1f}%")
        print(f"   Impact: {focus.impact_score:.1f}%")
        print(f"   Current Performance: {focus.current_performance:.1f}%")
        print(f"   Target Performance: {focus.target_performance:.1f}%")
        print(f"   Performance Gap: {focus.performance_gap:.1f}%")
        print(f"   Recommended Hours: {focus.recommended_hours:.1f}h")
        print(f"   Est. Improvement: {focus.estimated_improvement:.1f}%")
        print(f"   Confidence: {focus.confidence_level}")
        print(f"   Reasoning: {focus.reasoning}")


def example_personalized_insights(db: Session, institution_id: int, student_id: int):
    """
    Generate personalized, actionable insights for the student.
    """
    print("\n" + "=" * 80)
    print("PERSONALIZED INSIGHTS")
    print("=" * 80)
    
    from src.models.study_planner import ChapterPerformance, FocusArea, WeakArea
    
    chapter_performances = db.query(ChapterPerformance).filter(
        ChapterPerformance.institution_id == institution_id,
        ChapterPerformance.student_id == student_id
    ).all()
    
    focus_areas = db.query(FocusArea).filter(
        FocusArea.institution_id == institution_id,
        FocusArea.student_id == student_id,
        FocusArea.status == 'active'
    ).all()
    
    weak_areas = db.query(WeakArea).filter(
        WeakArea.institution_id == institution_id,
        WeakArea.student_id == student_id,
        WeakArea.is_resolved == False
    ).all()
    
    generator = PersonalizedInsightGenerator(db)
    
    insights = generator.generate_insights(
        institution_id=institution_id,
        student_id=student_id,
        focus_areas=focus_areas,
        chapter_performances=chapter_performances,
        weak_areas=weak_areas
    )
    
    print(f"\n💡 Total Insights Generated: {len(insights)}")
    
    critical_insights = [i for i in insights if i.severity == 'critical']
    high_insights = [i for i in insights if i.severity == 'high']
    medium_insights = [i for i in insights if i.severity == 'medium']
    info_insights = [i for i in insights if i.severity == 'info']
    
    print(f"\n📊 INSIGHTS BY SEVERITY")
    print("-" * 80)
    print(f"Critical: {len(critical_insights)}")
    print(f"High: {len(high_insights)}")
    print(f"Medium: {len(medium_insights)}")
    print(f"Info: {len(info_insights)}")
    
    print(f"\n🎯 ACTIONABLE INSIGHTS: {sum(1 for i in insights if i.is_actionable)}")
    print(f"🤖 AI-Generated: {sum(1 for i in insights if i.ai_generated)}")
    
    print("\n🚨 TOP PRIORITY INSIGHTS")
    print("-" * 80)
    for idx, insight in enumerate(insights[:5], 1):
        severity_icon = {
            'critical': '🔴',
            'high': '🟠',
            'medium': '🟡',
            'info': '🔵'
        }.get(insight.severity, '⚪')
        
        print(f"\n{idx}. {severity_icon} {insight.title}")
        print(f"   Type: {insight.insight_type} | Category: {insight.category}")
        print(f"   Severity: {insight.severity.upper()} | Priority: {insight.priority}")
        print(f"   Confidence: {insight.confidence_score}%")
        print(f"   {insight.description}")
        
        if insight.is_actionable and insight.actionable_items:
            print(f"\n   📋 ACTION ITEMS:")
            for item in insight.actionable_items[:3]:
                print(f"      • {item}")
        
        if insight.recommendations:
            print(f"\n   💡 RECOMMENDATIONS:")
            for rec in insight.recommendations[:3]:
                print(f"      • {rec}")


def example_weekly_study_plan(db: Session, institution_id: int, student_id: int):
    """
    Generate a weekly study plan based on weakness detection analysis.
    """
    print("\n" + "=" * 80)
    print("WEEKLY STUDY PLAN GENERATION")
    print("=" * 80)
    
    engine = WeaknessDetectionEngine(db)
    
    target_exam_date = date.today() + timedelta(days=30)
    
    result = engine.run_comprehensive_analysis(
        institution_id=institution_id,
        student_id=student_id,
        target_exam_date=target_exam_date,
        generate_recommendations=True
    )
    
    focus_areas = sorted(result['focus_areas'], key=lambda x: float(x.combined_priority), reverse=True)
    
    print("\n📅 7-DAY STUDY PLAN")
    print("-" * 80)
    
    total_hours_available = 14
    daily_hours = 2
    
    print(f"Total Available Study Time: {total_hours_available} hours")
    print(f"Daily Study Target: {daily_hours} hours")
    
    allocated_areas = []
    remaining_hours = total_hours_available
    
    for focus in focus_areas:
        if remaining_hours <= 0:
            break
        
        recommended = float(focus.recommended_hours)
        allocated = min(recommended, remaining_hours)
        
        if allocated > 0:
            allocated_areas.append({
                'area': focus.chapter.name if focus.chapter else focus.subject.name,
                'hours': allocated,
                'priority': float(focus.combined_priority),
                'type': focus.focus_type,
                'improvement': float(focus.estimated_improvement or 0)
            })
            remaining_hours -= allocated
    
    print(f"\n🎯 STUDY ALLOCATION")
    print("-" * 80)
    for idx, area in enumerate(allocated_areas, 1):
        print(f"{idx}. {area['area']} ({area['type'].upper()})")
        print(f"   Allocated: {area['hours']:.1f}h | Priority: {area['priority']:.1f}")
        print(f"   Expected Improvement: +{area['improvement']:.1f}%")
        print()
    
    print(f"📊 SUMMARY")
    print("-" * 80)
    print(f"Focus Areas Included: {len(allocated_areas)}")
    print(f"Total Hours Allocated: {total_hours_available - remaining_hours:.1f}h")
    print(f"Expected Average Improvement: {sum(a['improvement'] for a in allocated_areas) / len(allocated_areas):.1f}%")


if __name__ == "__main__":
    print("\n🚀 WEAKNESS DETECTION AND RECOMMENDATION ENGINE")
    print("=" * 80)
    print("\nThis example demonstrates the comprehensive weakness detection system.")
    print("\nFeatures:")
    print("  ✓ Chapter-wise performance analysis")
    print("  ✓ Smart question recommendations with spaced repetition")
    print("  ✓ Focus area prioritization")
    print("  ✓ AI-powered personalized insights")
    print("  ✓ Automated weekly study plan generation")
    print("\n" + "=" * 80)
