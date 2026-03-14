# Cross-Institution Analytics - Quick Start Guide

## Overview
The Cross-Institution Analytics Dashboard allows super admins to compare performance metrics across all institutions, identify best practices, detect anomalies, and analyze trends.

## Accessing the Dashboard

### Navigation
1. Log in as a super admin user
2. Navigate to **Analytics** > **Cross-Institution Analytics** in the sidebar
3. Or visit directly: `/super-admin/analytics/cross-institution`

## Using the Dashboard

### 1. Filters

Apply filters to focus your analysis:
- **Region**: Filter institutions by geographic region
- **Plan**: Filter by subscription plan (Basic, Pro, Enterprise)
- **Size**: Filter by institution size (Small <100, Medium 100-500, Large >500 users)
- **Date Range**: Automatically set to last 90 days (customizable in code)

Click **Refresh** to apply filters and reload data.

### 2. Benchmark Summary

The top cards show platform-wide averages:
- **Average Attendance**: Overall attendance rate across all institutions
- **Average Exam Pass Rate**: Overall exam success rate
- **Average Engagement**: Overall student engagement score
- **Average Teacher Effectiveness**: Overall teacher performance score

Each card also shows the 75th percentile for context.

### 3. Tabs

#### Rankings Tab
- View top 20 institutions by composite performance score
- See overall rank, percentile, and individual metric ranks
- Click the info icon to view detailed institution metrics
- Color-coded rank badges (green for top 3)

**Columns:**
- Rank (overall position)
- Institution name
- Composite Score (weighted performance metric)
- Percentile (top X%)
- Individual rankings for: Attendance, Exams, Engagement, Teacher Effectiveness

#### Trends Tab
- **Performance Trends Chart**: Line chart showing monthly trends for key metrics
- **Trend Cards**: Show percentage change in metrics over the analysis period
  - Green upward arrow = improvement
  - Red downward arrow = decline
- **Institution Counts**: Number of improving vs. declining institutions

#### Anomalies Tab
- Lists institutions with unusual performance (>2 standard deviations from average)
- Color-coded alerts:
  - Red (Error): High severity anomaly
  - Yellow (Warning): Medium severity anomaly
- Shows expected vs. actual values with deviation percentage
- Empty state if no anomalies detected

#### Best Practices Tab
- Showcases top-performing institutions in each category
- Categories:
  - Attendance (≥85%)
  - Exam Performance (≥85%)
  - Student Engagement (≥75%)
  - Teacher Effectiveness (≥80%)
- Each card includes:
  - Category and impact level badges
  - Description of achievement
  - Actionable recommendation for other institutions
  - Metric value

#### Cohort Analysis Tab
- **By Plan**: Compare performance across subscription plans
- **By Size**: Compare performance across institution sizes
- Bar charts show attendance, exam pass rate, and engagement side-by-side
- Useful for identifying trends by institution characteristics

### 4. Institution Details

Click the info icon (ℹ) in the Rankings tab to view detailed metrics for any institution:
- Region, plan, and size
- Student and teacher counts
- Performance metrics with color coding:
  - **Green**: Above average (>110% of benchmark)
  - **Yellow**: Near average (90-110% of benchmark)
  - **Red**: Below average (<90% of benchmark)

### 5. Data Export

Click the **Export** button to download analytics data:
- **CSV Format**: For Excel/spreadsheet analysis
- Downloads automatically with timestamp in filename
- Includes all filtered data with all metrics

## Understanding the Metrics

### Attendance Rate
Percentage of student attendance marked as "Present" vs. total attendance records.

### Exam Pass Rate
Percentage of students who passed exams vs. total students who took exams.

### Average Exam Score
Mean percentage score across all exam results.

### Student Engagement Score
Composite metric (0-100):
- 60% based on assignment submission rate
- 40% based on gamification points

### Teacher Effectiveness Score
Composite metric (0-100):
- 50% grading rate (how many submissions are graded)
- 30% grading speed (average time to grade)
- 20% student performance contribution

### Assignment Completion Rate
Percentage of assignments submitted vs. expected submissions (total assignments × active students).

### Average Grading Time
Mean number of days between assignment submission and grading.

### Composite Score
Weighted average used for overall ranking:
- 25% Attendance
- 30% Exam Performance
- 25% Student Engagement
- 20% Teacher Effectiveness

## Interpreting Results

### Rankings
- **Top Percentile (90-100%)**: Exceptional performance, potential best practice source
- **Upper Quartile (75-90%)**: Strong performance, above average
- **Middle Range (25-75%)**: Average performance, opportunities for improvement
- **Lower Quartile (0-25%)**: Below average, requires attention

### Anomalies
- **High Severity**: >3 standard deviations from average - investigate immediately
- **Medium Severity**: 2-3 standard deviations - monitor closely
- Both positive and negative anomalies are flagged

### Trends
- **Positive Trend**: Increasing percentage over time - improving performance
- **Negative Trend**: Decreasing percentage over time - declining performance
- **Stable**: Little change - consistent performance

## Use Cases

### 1. Identify High Performers
1. Go to **Rankings** tab
2. Review top 10 institutions
3. Click info icon to see their detailed metrics
4. Switch to **Best Practices** tab to see what they're doing well

### 2. Find Institutions Needing Support
1. Apply filters if needed (e.g., by plan or size)
2. Sort rankings by lowest scores
3. Check **Anomalies** tab for struggling institutions
4. Review their detailed metrics to identify issues

### 3. Compare Plans/Sizes
1. Go to **Cohort Analysis** tab
2. Review performance by subscription plan
3. Review performance by institution size
4. Identify which cohorts perform best

### 4. Track Platform Trends
1. Go to **Trends** tab
2. Review monthly trend charts
3. Check trend percentage cards
4. Monitor improving vs. declining counts

### 5. Share Insights
1. Apply desired filters
2. Click **Export** button
3. Share CSV file with stakeholders
4. Use for presentations or reports

## Tips for Best Results

1. **Regular Reviews**: Check analytics weekly or monthly for trends
2. **Filter Strategically**: Use filters to compare similar institutions
3. **Investigate Anomalies**: Both high and low performers can provide insights
4. **Share Best Practices**: Use the Best Practices tab to guide improvement initiatives
5. **Monitor Trends**: Watch for declining trends early to provide support
6. **Export Data**: Download data for deeper analysis in Excel or BI tools

## Troubleshooting

### No Data Showing
- Ensure there are active institutions with data in the selected date range
- Check that filters aren't too restrictive
- Verify institutions have attendance, exam, and assignment records

### Unexpected Results
- Review filter settings
- Check date range (default is last 90 days)
- Verify data quality in individual institutions
- Ensure adequate data exists for statistical analysis (need at least 3 institutions)

### Export Not Working
- Check browser download permissions
- Ensure stable internet connection
- Try refreshing the page and exporting again

## API Endpoints

For programmatic access:

```
GET /api/v1/super-admin/analytics/cross-institution
Parameters:
  - region: string (optional)
  - plan: string (optional)
  - size: string (optional)
  - start_date: datetime (optional)
  - end_date: datetime (optional)

GET /api/v1/super-admin/analytics/export
Parameters:
  - format: csv|json|excel
  - region: string (optional)
  - plan: string (optional)
  - size: string (optional)
  - start_date: datetime (optional)
  - end_date: datetime (optional)
```

## Support

For issues or questions about the Cross-Institution Analytics Dashboard:
1. Check this documentation
2. Review the implementation guide (CROSS_INSTITUTION_ANALYTICS_IMPLEMENTATION.md)
3. Contact the development team
