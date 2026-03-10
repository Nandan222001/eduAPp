from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_, desc
from datetime import datetime, timedelta
from decimal import Decimal
import math

from src.database import get_db
from src.dependencies.auth import get_current_user, require_super_admin
from src.models.user import User
from src.models.institution import Institution
from src.models.subscription import Subscription, Payment, Invoice, UsageRecord
from src.models.student import Student
from src.models.teacher import Teacher
from src.models.role import Role
from src.schemas.super_admin import (
    SuperAdminDashboardResponse,
    InstitutionMetricsSummary,
    SubscriptionStatusDistribution,
    PlatformUsageStatistics,
    RevenueTrend,
    RecentActivity,
    InstitutionPerformanceComparison,
    QuickActionStats,
    InstitutionListResponse,
    InstitutionListItem,
    InstitutionCreate,
    InstitutionUpdate,
    SubscriptionUpdate,
    BillingHistoryItem,
    UsageMetric,
    InstitutionAnalytics,
)
from src.utils.security import hash_password

router = APIRouter(prefix="/super-admin", tags=["Super Admin"])


@router.get("/dashboard", response_model=SuperAdminDashboardResponse)
async def get_super_admin_dashboard(
    current_user: User = Depends(require_super_admin),
    db: Session = Depends(get_db),
) -> SuperAdminDashboardResponse:
    """Get comprehensive super admin dashboard data."""
    
    # Calculate date ranges
    today = datetime.utcnow()
    last_month_start = (today.replace(day=1) - timedelta(days=1)).replace(day=1)
    last_month_end = today.replace(day=1) - timedelta(days=1)
    
    # Total institutions
    total_institutions = db.query(func.count(Institution.id)).scalar()
    
    # Active subscriptions
    active_subscriptions = db.query(func.count(Subscription.id)).filter(
        Subscription.status == 'active'
    ).scalar()
    
    # Calculate MRR (Monthly Recurring Revenue)
    active_subs = db.query(Subscription).filter(
        Subscription.status == 'active'
    ).all()
    
    mrr = sum(
        float(sub.price) if sub.billing_cycle == 'monthly' 
        else float(sub.price) / 12 if sub.billing_cycle == 'yearly'
        else float(sub.price) / 3 if sub.billing_cycle == 'quarterly'
        else 0
        for sub in active_subs
    )
    
    arr = mrr * 12
    
    # Get institutions created last month for trend calculation
    institutions_last_month = db.query(func.count(Institution.id)).filter(
        and_(
            Institution.created_at >= last_month_start,
            Institution.created_at <= last_month_end
        )
    ).scalar()
    
    institutions_this_month = db.query(func.count(Institution.id)).filter(
        Institution.created_at >= today.replace(day=1)
    ).scalar()
    
    institution_trend = (
        ((institutions_this_month - institutions_last_month) / institutions_last_month * 100)
        if institutions_last_month > 0 else 0
    )
    
    # Subscription status distribution
    subscription_distribution = db.query(
        Subscription.status,
        func.count(Subscription.id)
    ).group_by(Subscription.status).all()
    
    status_distribution = SubscriptionStatusDistribution(
        active=next((count for status, count in subscription_distribution if status == 'active'), 0),
        trial=next((count for status, count in subscription_distribution if status == 'trial'), 0),
        expired=next((count for status, count in subscription_distribution if status == 'expired'), 0),
        cancelled=next((count for status, count in subscription_distribution if status == 'cancelled'), 0),
    )
    
    # Platform usage statistics - DAU/MAU calculation
    # For this example, we'll use active users in the last 24 hours and 30 days
    one_day_ago = today - timedelta(days=1)
    thirty_days_ago = today - timedelta(days=30)
    
    dau = db.query(func.count(func.distinct(User.id))).filter(
        User.last_login >= one_day_ago
    ).scalar() or 0
    
    mau = db.query(func.count(func.distinct(User.id))).filter(
        User.last_login >= thirty_days_ago
    ).scalar() or 0
    
    total_users = db.query(func.count(User.id)).scalar() or 0
    active_users = db.query(func.count(User.id)).filter(User.is_active == True).scalar() or 0
    
    platform_usage = PlatformUsageStatistics(
        dau=dau,
        mau=mau,
        total_users=total_users,
        active_users=active_users,
        dau_mau_ratio=round((dau / mau * 100) if mau > 0 else 0, 2),
    )
    
    # Revenue trends (last 6 months)
    revenue_trends = []
    for i in range(6, 0, -1):
        month_start = (today.replace(day=1) - timedelta(days=30 * i))
        month_end = (month_start + timedelta(days=32)).replace(day=1) - timedelta(days=1)
        
        month_revenue = db.query(func.sum(Payment.amount)).filter(
            and_(
                Payment.status == 'paid',
                Payment.paid_at >= month_start,
                Payment.paid_at <= month_end
            )
        ).scalar() or Decimal(0)
        
        # Calculate MRR for that month
        month_subs = db.query(Subscription).filter(
            and_(
                Subscription.status == 'active',
                Subscription.start_date <= month_end
            )
        ).all()
        
        month_mrr = sum(
            float(sub.price) if sub.billing_cycle == 'monthly'
            else float(sub.price) / 12 if sub.billing_cycle == 'yearly'
            else float(sub.price) / 3 if sub.billing_cycle == 'quarterly'
            else 0
            for sub in month_subs
        )
        
        revenue_trends.append(
            RevenueTrend(
                month=month_start.strftime('%b %Y'),
                mrr=round(month_mrr, 2),
                arr=round(month_mrr * 12, 2),
                total_revenue=float(month_revenue),
            )
        )
    
    # Recent activities
    recent_activities: List[RecentActivity] = []
    
    # New institutions
    recent_institutions = db.query(Institution).order_by(
        desc(Institution.created_at)
    ).limit(5).all()
    
    for inst in recent_institutions:
        time_diff = today - inst.created_at
        hours_ago = int(time_diff.total_seconds() / 3600)
        days_ago = time_diff.days
        
        time_str = f"{hours_ago} hours ago" if days_ago == 0 else f"{days_ago} days ago"
        
        recent_activities.append(
            RecentActivity(
                type='institution',
                title='New Institution',
                description=f'{inst.name} registered',
                time=time_str,
                institution_id=inst.id,
            )
        )
    
    # Recent payments
    recent_payments = db.query(Payment).filter(
        Payment.status == 'paid'
    ).order_by(desc(Payment.paid_at)).limit(3).all()
    
    for payment in recent_payments:
        institution = db.query(Institution).filter(
            Institution.id == payment.institution_id
        ).first()
        
        if institution and payment.paid_at:
            time_diff = today - payment.paid_at
            hours_ago = int(time_diff.total_seconds() / 3600)
            days_ago = time_diff.days
            
            time_str = f"{hours_ago} hours ago" if days_ago == 0 else f"{days_ago} days ago"
            
            recent_activities.append(
                RecentActivity(
                    type='payment',
                    title='Payment Received',
                    description=f'₹{float(payment.amount):,.0f} from {institution.name}',
                    time=time_str,
                    institution_id=institution.id,
                )
            )
    
    # Sort activities by time (this is approximate since we're using string times)
    recent_activities = sorted(recent_activities, key=lambda x: x.time)[:10]
    
    # Institution performance comparison
    institutions = db.query(Institution).filter(Institution.is_active == True).all()
    performance_data: List[InstitutionPerformanceComparison] = []
    
    for inst in institutions:
        # Get subscription
        subscription = db.query(Subscription).filter(
            Subscription.institution_id == inst.id
        ).order_by(desc(Subscription.created_at)).first()
        
        # Count users
        total_users_count = db.query(func.count(User.id)).filter(
            User.institution_id == inst.id
        ).scalar() or 0
        
        active_users_count = db.query(func.count(User.id)).filter(
            and_(
                User.institution_id == inst.id,
                User.is_active == True
            )
        ).scalar() or 0
        
        # Calculate revenue
        total_revenue = db.query(func.sum(Payment.amount)).filter(
            and_(
                Payment.institution_id == inst.id,
                Payment.status == 'paid'
            )
        ).scalar() or Decimal(0)
        
        # Get last activity
        last_user_login = db.query(func.max(User.last_login)).filter(
            User.institution_id == inst.id
        ).scalar()
        
        # Calculate engagement (active users / total users)
        engagement = (active_users_count / total_users_count * 100) if total_users_count > 0 else 0
        
        performance_data.append(
            InstitutionPerformanceComparison(
                id=inst.id,
                name=inst.name,
                total_users=total_users_count,
                active_users=active_users_count,
                subscription_status=subscription.status if subscription else 'none',
                revenue=float(total_revenue),
                last_activity=last_user_login.isoformat() if last_user_login else inst.created_at.isoformat(),
                engagement=round(engagement, 2),
            )
        )
    
    # Sort by revenue
    performance_data = sorted(performance_data, key=lambda x: x.revenue, reverse=True)
    
    # Quick action stats
    trials_expiring_soon = db.query(func.count(Subscription.id)).filter(
        and_(
            Subscription.status == 'trial',
            Subscription.trial_end_date.isnot(None),
            Subscription.trial_end_date <= today + timedelta(days=7)
        )
    ).scalar() or 0
    
    grace_period_ending = db.query(func.count(Subscription.id)).filter(
        and_(
            Subscription.grace_period_end.isnot(None),
            Subscription.grace_period_end <= today + timedelta(days=3)
        )
    ).scalar() or 0
    
    pending_onboarding = db.query(func.count(Institution.id)).filter(
        and_(
            Institution.created_at >= today - timedelta(days=7),
            ~Institution.subscriptions.any()
        )
    ).scalar() or 0
    
    quick_actions = QuickActionStats(
        trials_expiring_soon=trials_expiring_soon,
        grace_period_ending=grace_period_ending,
        pending_onboarding=pending_onboarding,
    )
    
    metrics_summary = InstitutionMetricsSummary(
        total_institutions=total_institutions or 0,
        active_subscriptions=active_subscriptions or 0,
        mrr=round(mrr, 2),
        arr=round(arr, 2),
        institution_growth_trend=round(institution_trend, 2),
    )
    
    return SuperAdminDashboardResponse(
        metrics_summary=metrics_summary,
        subscription_distribution=status_distribution,
        platform_usage=platform_usage,
        revenue_trends=revenue_trends,
        recent_activities=recent_activities,
        institution_performance=performance_data,
        quick_actions=quick_actions,
    )


@router.get("/institutions/{institution_id}/details")
async def get_institution_details(
    institution_id: int,
    current_user: User = Depends(require_super_admin),
    db: Session = Depends(get_db),
):
    """Get detailed information about a specific institution."""
    institution = db.query(Institution).filter(Institution.id == institution_id).first()
    
    if not institution:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Institution not found"
        )
    
    # Get subscription
    subscription = db.query(Subscription).filter(
        Subscription.institution_id == institution_id
    ).order_by(desc(Subscription.created_at)).first()
    
    # Get user counts
    total_users = db.query(func.count(User.id)).filter(
        User.institution_id == institution_id
    ).scalar()
    
    active_users = db.query(func.count(User.id)).filter(
        and_(
            User.institution_id == institution_id,
            User.is_active == True
        )
    ).scalar()
    
    # Get student/teacher counts
    student_count = db.query(func.count(Student.id)).filter(
        Student.institution_id == institution_id
    ).scalar()
    
    teacher_count = db.query(func.count(Teacher.id)).filter(
        Teacher.institution_id == institution_id
    ).scalar()
    
    # Get revenue
    total_revenue = db.query(func.sum(Payment.amount)).filter(
        and_(
            Payment.institution_id == institution_id,
            Payment.status == 'paid'
        )
    ).scalar() or Decimal(0)
    
    # Get usage records
    recent_usage = db.query(UsageRecord).filter(
        UsageRecord.institution_id == institution_id
    ).order_by(desc(UsageRecord.recorded_at)).limit(10).all()
    
    return {
        "institution": {
            "id": institution.id,
            "name": institution.name,
            "slug": institution.slug,
            "domain": institution.domain,
            "description": institution.description,
            "is_active": institution.is_active,
            "max_users": institution.max_users,
            "created_at": institution.created_at,
            "updated_at": institution.updated_at,
        },
        "subscription": {
            "id": subscription.id,
            "plan_name": subscription.plan_name,
            "status": subscription.status,
            "billing_cycle": subscription.billing_cycle,
            "price": float(subscription.price),
            "start_date": subscription.start_date,
            "end_date": subscription.end_date,
            "trial_end_date": subscription.trial_end_date,
        } if subscription else None,
        "stats": {
            "total_users": total_users,
            "active_users": active_users,
            "student_count": student_count,
            "teacher_count": teacher_count,
            "total_revenue": float(total_revenue),
        },
        "recent_usage": [
            {
                "metric_name": ur.metric_name,
                "metric_value": float(ur.metric_value),
                "recorded_at": ur.recorded_at,
            }
            for ur in recent_usage
        ],
    }


@router.get("/statistics/revenue-breakdown")
async def get_revenue_breakdown(
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    current_user: User = Depends(require_super_admin),
    db: Session = Depends(get_db),
):
    """Get detailed revenue breakdown by plan, billing cycle, etc."""
    query = db.query(
        Subscription.plan_name,
        Subscription.billing_cycle,
        func.count(Subscription.id).label('subscription_count'),
        func.sum(Subscription.price).label('total_revenue')
    ).filter(Subscription.status == 'active')
    
    if start_date:
        query = query.filter(Subscription.start_date >= start_date)
    if end_date:
        query = query.filter(Subscription.start_date <= end_date)
    
    results = query.group_by(
        Subscription.plan_name,
        Subscription.billing_cycle
    ).all()
    
    breakdown = []
    for plan_name, billing_cycle, count, revenue in results:
        breakdown.append({
            "plan_name": plan_name,
            "billing_cycle": billing_cycle,
            "subscription_count": count,
            "total_revenue": float(revenue or 0),
        })
    
    return {"revenue_breakdown": breakdown}


@router.get("/statistics/user-growth")
async def get_user_growth_statistics(
    days: int = Query(30, ge=1, le=365),
    current_user: User = Depends(require_super_admin),
    db: Session = Depends(get_db),
):
    """Get user growth statistics over time."""
    today = datetime.utcnow()
    start_date = today - timedelta(days=days)
    
    # Get daily user registrations
    daily_registrations = db.query(
        func.date(User.created_at).label('date'),
        func.count(User.id).label('count')
    ).filter(
        User.created_at >= start_date
    ).group_by(
        func.date(User.created_at)
    ).order_by(
        func.date(User.created_at)
    ).all()
    
    return {
        "daily_registrations": [
            {"date": str(date), "count": count}
            for date, count in daily_registrations
        ],
        "total_new_users": sum(count for _, count in daily_registrations),
    }


@router.get("/institutions", response_model=InstitutionListResponse)
async def list_institutions(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    plan: Optional[str] = Query(None),
    sort_by: str = Query("created_at", regex="^(name|created_at|total_users|revenue)$"),
    sort_order: str = Query("desc", regex="^(asc|desc)$"),
    current_user: User = Depends(require_super_admin),
    db: Session = Depends(get_db),
):
    """Get paginated list of institutions with filtering and sorting."""
    query = db.query(Institution)
    
    if search:
        query = query.filter(
            or_(
                Institution.name.ilike(f"%{search}%"),
                Institution.slug.ilike(f"%{search}%"),
                Institution.domain.ilike(f"%{search}%")
            )
        )
    
    if status:
        if status == "active":
            query = query.filter(Institution.is_active == True)
        elif status == "inactive":
            query = query.filter(Institution.is_active == False)
    
    total = query.count()
    
    if sort_order == "desc":
        order_col = desc(getattr(Institution, sort_by))
    else:
        order_col = getattr(Institution, sort_by)
    
    institutions = query.order_by(order_col).offset((page - 1) * page_size).limit(page_size).all()
    
    items = []
    for inst in institutions:
        subscription = db.query(Subscription).filter(
            Subscription.institution_id == inst.id
        ).order_by(desc(Subscription.created_at)).first()
        
        if plan and subscription and subscription.plan_name != plan:
            continue
        
        total_users = db.query(func.count(User.id)).filter(
            User.institution_id == inst.id
        ).scalar() or 0
        
        active_users = db.query(func.count(User.id)).filter(
            and_(
                User.institution_id == inst.id,
                User.is_active == True
            )
        ).scalar() or 0
        
        total_revenue = db.query(func.sum(Payment.amount)).filter(
            and_(
                Payment.institution_id == inst.id,
                Payment.status == 'paid'
            )
        ).scalar() or Decimal(0)
        
        items.append(InstitutionListItem(
            id=inst.id,
            name=inst.name,
            slug=inst.slug,
            domain=inst.domain,
            is_active=inst.is_active,
            max_users=inst.max_users,
            created_at=inst.created_at,
            subscription_status=subscription.status if subscription else None,
            subscription_plan=subscription.plan_name if subscription else None,
            total_users=total_users,
            active_users=active_users,
            total_revenue=float(total_revenue),
        ))
    
    total_pages = math.ceil(total / page_size) if total > 0 else 0
    
    return InstitutionListResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.post("/institutions", status_code=status.HTTP_201_CREATED)
async def create_institution(
    institution_data: InstitutionCreate,
    current_user: User = Depends(require_super_admin),
    db: Session = Depends(get_db),
):
    """Create a new institution with admin user and optional subscription."""
    existing = db.query(Institution).filter(
        or_(
            Institution.slug == institution_data.slug,
            Institution.domain == institution_data.domain
        )
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Institution with this slug or domain already exists"
        )
    
    existing_user = db.query(User).filter(User.email == institution_data.admin_user.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email already exists"
        )
    
    institution = Institution(
        name=institution_data.name,
        slug=institution_data.slug,
        domain=institution_data.domain,
        description=institution_data.description,
        max_users=institution_data.max_users,
        is_active=True,
    )
    db.add(institution)
    db.flush()
    
    admin_role = db.query(Role).filter(Role.name == "institution_admin").first()
    if not admin_role:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Admin role not found"
        )
    
    admin_user = User(
        email=institution_data.admin_user.email,
        first_name=institution_data.admin_user.first_name,
        last_name=institution_data.admin_user.last_name,
        phone=institution_data.admin_user.phone,
        password_hash=hash_password(institution_data.admin_user.password),
        institution_id=institution.id,
        role_id=admin_role.id,
        is_active=True,
        email_verified=True,
    )
    db.add(admin_user)
    
    if institution_data.subscription:
        sub_data = institution_data.subscription
        start_date = datetime.utcnow()
        trial_end_date = None
        
        if sub_data.trial_days and sub_data.trial_days > 0:
            trial_end_date = start_date + timedelta(days=sub_data.trial_days)
            subscription_status = "trial"
        else:
            subscription_status = "active"
        
        if sub_data.billing_cycle == "monthly":
            end_date = start_date + timedelta(days=30)
        elif sub_data.billing_cycle == "quarterly":
            end_date = start_date + timedelta(days=90)
        elif sub_data.billing_cycle == "yearly":
            end_date = start_date + timedelta(days=365)
        else:
            end_date = start_date + timedelta(days=30)
        
        subscription = Subscription(
            institution_id=institution.id,
            plan_name=sub_data.plan_name,
            status=subscription_status,
            billing_cycle=sub_data.billing_cycle,
            price=Decimal(str(sub_data.price)),
            max_users=sub_data.max_users,
            max_storage_gb=sub_data.max_storage_gb,
            features=sub_data.features,
            start_date=start_date,
            end_date=end_date,
            trial_end_date=trial_end_date,
            next_billing_date=trial_end_date if trial_end_date else end_date,
            auto_renew=True,
        )
        db.add(subscription)
    
    db.commit()
    db.refresh(institution)
    
    return {
        "id": institution.id,
        "name": institution.name,
        "slug": institution.slug,
        "message": "Institution created successfully"
    }


@router.put("/institutions/{institution_id}")
async def update_institution(
    institution_id: int,
    institution_data: InstitutionUpdate,
    current_user: User = Depends(require_super_admin),
    db: Session = Depends(get_db),
):
    """Update institution details."""
    institution = db.query(Institution).filter(Institution.id == institution_id).first()
    
    if not institution:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Institution not found"
        )
    
    if institution_data.slug and institution_data.slug != institution.slug:
        existing = db.query(Institution).filter(
            and_(
                Institution.slug == institution_data.slug,
                Institution.id != institution_id
            )
        ).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Institution with this slug already exists"
            )
    
    if institution_data.domain and institution_data.domain != institution.domain:
        existing = db.query(Institution).filter(
            and_(
                Institution.domain == institution_data.domain,
                Institution.id != institution_id
            )
        ).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Institution with this domain already exists"
            )
    
    update_data = institution_data.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(institution, key, value)
    
    db.commit()
    db.refresh(institution)
    
    return {
        "id": institution.id,
        "name": institution.name,
        "message": "Institution updated successfully"
    }


@router.put("/institutions/{institution_id}/subscription")
async def update_institution_subscription(
    institution_id: int,
    subscription_data: SubscriptionUpdate,
    current_user: User = Depends(require_super_admin),
    db: Session = Depends(get_db),
):
    """Update or upgrade/downgrade institution subscription."""
    institution = db.query(Institution).filter(Institution.id == institution_id).first()
    
    if not institution:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Institution not found"
        )
    
    subscription = db.query(Subscription).filter(
        Subscription.institution_id == institution_id
    ).order_by(desc(Subscription.created_at)).first()
    
    if not subscription:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No subscription found for this institution"
        )
    
    update_data = subscription_data.dict(exclude_unset=True)
    for key, value in update_data.items():
        if key == "price" and value is not None:
            setattr(subscription, key, Decimal(str(value)))
        else:
            setattr(subscription, key, value)
    
    db.commit()
    db.refresh(subscription)
    
    return {
        "id": subscription.id,
        "plan_name": subscription.plan_name,
        "status": subscription.status,
        "message": "Subscription updated successfully"
    }


@router.get("/institutions/{institution_id}/billing-history")
async def get_billing_history(
    institution_id: int,
    current_user: User = Depends(require_super_admin),
    db: Session = Depends(get_db),
):
    """Get billing history for an institution."""
    institution = db.query(Institution).filter(Institution.id == institution_id).first()
    
    if not institution:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Institution not found"
        )
    
    payments = db.query(Payment).filter(
        Payment.institution_id == institution_id
    ).order_by(desc(Payment.created_at)).all()
    
    invoices = db.query(Invoice).filter(
        Invoice.institution_id == institution_id
    ).order_by(desc(Invoice.created_at)).all()
    
    billing_items = []
    
    for payment in payments:
        billing_items.append(BillingHistoryItem(
            id=payment.id,
            payment_id=payment.id,
            amount=float(payment.amount),
            status=payment.status,
            payment_method=payment.payment_method,
            paid_at=payment.paid_at,
            created_at=payment.created_at,
        ))
    
    for invoice in invoices:
        billing_items.append(BillingHistoryItem(
            id=invoice.id,
            invoice_number=invoice.invoice_number,
            amount=float(invoice.total_amount),
            status=invoice.status,
            paid_at=invoice.paid_at,
            created_at=invoice.created_at,
        ))
    
    billing_items.sort(key=lambda x: x.created_at, reverse=True)
    
    return {"billing_history": billing_items}


@router.get("/institutions/{institution_id}/usage")
async def get_institution_usage(
    institution_id: int,
    current_user: User = Depends(require_super_admin),
    db: Session = Depends(get_db),
):
    """Get current usage metrics for an institution."""
    institution = db.query(Institution).filter(Institution.id == institution_id).first()
    
    if not institution:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Institution not found"
        )
    
    subscription = db.query(Subscription).filter(
        Subscription.institution_id == institution_id
    ).order_by(desc(Subscription.created_at)).first()
    
    today = datetime.utcnow()
    period_start = today.replace(day=1)
    period_end = (period_start + timedelta(days=32)).replace(day=1) - timedelta(days=1)
    
    total_users = db.query(func.count(User.id)).filter(
        User.institution_id == institution_id
    ).scalar() or 0
    
    max_users = subscription.max_users if subscription and subscription.max_users else None
    
    usage_metrics = []
    
    usage_metrics.append(UsageMetric(
        metric_name="Active Users",
        current_value=float(total_users),
        limit=float(max_users) if max_users else None,
        percentage_used=(total_users / max_users * 100) if max_users else None,
        period_start=period_start,
        period_end=period_end,
    ))
    
    recent_usage = db.query(UsageRecord).filter(
        UsageRecord.institution_id == institution_id
    ).order_by(desc(UsageRecord.recorded_at)).limit(20).all()
    
    for record in recent_usage:
        usage_metrics.append(UsageMetric(
            metric_name=record.metric_name,
            current_value=float(record.metric_value),
            period_start=record.period_start,
            period_end=record.period_end,
        ))
    
    return {"usage_metrics": usage_metrics}


@router.get("/institutions/{institution_id}/analytics")
async def get_institution_analytics(
    institution_id: int,
    days: int = Query(30, ge=1, le=365),
    current_user: User = Depends(require_super_admin),
    db: Session = Depends(get_db),
):
    """Get detailed analytics for an institution."""
    institution = db.query(Institution).filter(Institution.id == institution_id).first()
    
    if not institution:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Institution not found"
        )
    
    today = datetime.utcnow()
    start_date = today - timedelta(days=days)
    
    total_users = db.query(func.count(User.id)).filter(
        User.institution_id == institution_id
    ).scalar() or 0
    
    active_users = db.query(func.count(User.id)).filter(
        and_(
            User.institution_id == institution_id,
            User.is_active == True
        )
    ).scalar() or 0
    
    new_users = db.query(func.count(User.id)).filter(
        and_(
            User.institution_id == institution_id,
            User.created_at >= start_date
        )
    ).scalar() or 0
    
    students_count = db.query(func.count(Student.id)).filter(
        Student.institution_id == institution_id
    ).scalar() or 0
    
    teachers_count = db.query(func.count(Teacher.id)).filter(
        Teacher.institution_id == institution_id
    ).scalar() or 0
    
    daily_active = db.query(func.count(func.distinct(User.id))).filter(
        and_(
            User.institution_id == institution_id,
            User.last_login >= today - timedelta(days=1)
        )
    ).scalar() or 0
    
    weekly_active = db.query(func.count(func.distinct(User.id))).filter(
        and_(
            User.institution_id == institution_id,
            User.last_login >= today - timedelta(days=7)
        )
    ).scalar() or 0
    
    monthly_active = db.query(func.count(func.distinct(User.id))).filter(
        and_(
            User.institution_id == institution_id,
            User.last_login >= today - timedelta(days=30)
        )
    ).scalar() or 0
    
    total_revenue = db.query(func.sum(Payment.amount)).filter(
        and_(
            Payment.institution_id == institution_id,
            Payment.status == 'paid'
        )
    ).scalar() or Decimal(0)
    
    recent_revenue = db.query(func.sum(Payment.amount)).filter(
        and_(
            Payment.institution_id == institution_id,
            Payment.status == 'paid',
            Payment.paid_at >= start_date
        )
    ).scalar() or Decimal(0)
    
    usage_trends = []
    daily_users = db.query(
        func.date(User.last_login).label('date'),
        func.count(func.distinct(User.id)).label('count')
    ).filter(
        and_(
            User.institution_id == institution_id,
            User.last_login >= start_date
        )
    ).group_by(func.date(User.last_login)).order_by(func.date(User.last_login)).all()
    
    for date, count in daily_users:
        usage_trends.append({
            "date": str(date),
            "active_users": count
        })
    
    analytics = InstitutionAnalytics(
        institution_id=institution.id,
        institution_name=institution.name,
        user_metrics={
            "total_users": total_users,
            "active_users": active_users,
            "new_users": new_users,
            "students": students_count,
            "teachers": teachers_count,
        },
        engagement_metrics={
            "daily_active_users": daily_active,
            "weekly_active_users": weekly_active,
            "monthly_active_users": monthly_active,
            "engagement_rate": (active_users / total_users * 100) if total_users > 0 else 0,
        },
        usage_trends=usage_trends,
        revenue_metrics={
            "total_revenue": float(total_revenue),
            "recent_revenue": float(recent_revenue),
            "currency": "INR",
        }
    )
    
    return analytics
