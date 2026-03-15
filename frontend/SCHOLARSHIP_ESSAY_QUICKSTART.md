# Scholarship Essay Platform - Quick Start Guide

## Getting Started

### 1. Installation

No additional dependencies required. The feature uses existing Material-UI and React dependencies.

### 2. Enable Mock Data (Development)

Add to `.env.development`:

```bash
VITE_USE_MOCK_DATA=true
```

### 3. Add Routes

Add these routes to your router configuration:

```typescript
import ScholarshipEssayCenter from '@/pages/ScholarshipEssayCenter';
import EssayPeerReview from '@/pages/EssayPeerReview';
import {
  CounselorReviewPortal,
  EssayTemplateLibrary,
  EssayAnalyticsDashboard,
  EssayFeedbackDashboard
} from '@/components/scholarshipEssay';

// In your routes:
{
  path: '/scholarship-essays',
  element: <ScholarshipEssayCenter />,
},
{
  path: '/essay-peer-review',
  element: <EssayPeerReview />,
},
{
  path: '/counselor/essay-review',
  element: <CounselorReviewPortal />,
},
{
  path: '/essay-templates',
  element: <EssayTemplateLibrary />,
},
```

### 4. Navigation Links

Add to your student navigation:

```typescript
{
  title: 'Essay Center',
  path: '/scholarship-essays',
  icon: <EditIcon />,
},
{
  title: 'Peer Review',
  path: '/essay-peer-review',
  icon: <RateReviewIcon />,
},
{
  title: 'Essay Templates',
  path: '/essay-templates',
  icon: <LibraryBooksIcon />,
},
```

Add to counselor navigation:

```typescript
{
  title: 'Essay Review',
  path: '/counselor/essay-review',
  icon: <RateReviewIcon />,
},
```

## Student Workflow

### Writing an Essay

1. **Browse Prompts**
   - Navigate to Scholarship Essay Center
   - Go to "Prompt Library" tab
   - Filter by category or search
   - Click "Start Essay" on desired prompt

2. **Create Essay**
   - Enter essay title
   - Click "Create Essay"
   - Automatically redirected to editor

3. **Write & Edit**
   - Use rich text formatting tools
   - Monitor word count progress bar
   - Click "Check Grammar" for spelling/grammar issues
   - Click "AI Suggestions" for writing improvements
   - Click "Save" to create version snapshot

4. **Review Suggestions**
   - View AI suggestions in right sidebar
   - Read grammar issues with replacements
   - Review version history

5. **Request Peer Review**
   - Complete essay to minimum word count
   - Change status to "In Review"
   - System assigns peer reviewers

6. **View Feedback**
   - Navigate to "My Essays" tab
   - Click essay to see feedback summary
   - Review aggregated scores
   - Read common strengths/improvements
   - Apply actionable suggestions

### Peer Reviewing

1. **View Assignments**
   - Navigate to Essay Peer Review page
   - See "Assigned Essays" queue
   - Note due dates

2. **Start Review**
   - Click "Start Review" on essay
   - Read full essay content

3. **Score with Rubric**
   - Use sliders for each criterion:
     - Content & Relevance (0-10)
     - Structure & Organization (0-10)
     - Writing Quality (0-10)
     - Personal Voice & Authenticity (0-10)
     - Impact & Persuasiveness (0-10)
   - Add comments for each criterion

4. **Provide Feedback**
   - Rate overall (1-5 stars)
   - Write strengths (be specific and encouraging)
   - Write improvements (constructive criticism)
   - Add grammar corrections
   - Check "Would recommend" if applicable

5. **Submit Review**
   - Click "Submit Review"
   - Status changes to "Completed"

## Counselor Workflow

### Reviewing Essays

1. **Access Queue**
   - Navigate to Counselor Review Portal
   - See all pending essays

2. **Select Essay**
   - Click essay from queue
   - Read full content

3. **Provide Rating**
   - Give 1-5 star rating

4. **Add Feedback**
   - List strengths (click Add for each)
   - List improvements (click Add for each)
   - Add suggested revisions
   - Write overall comments

5. **Make Decision**
   - Click "Approve for Submission" if ready
   - Click "Needs Revision" if changes required
   - Student receives notification

## Template Library

### Browsing Templates

1. **Navigate to Templates**
   - Go to Essay Template Library

2. **Search & Filter**
   - Use search bar for keywords
   - Filter by approach:
     - Narrative
     - Analytical
     - Reflective
     - Creative
     - Hybrid

3. **View Template**
   - Click "View Template"
   - Read description and highlights
   - See author background
   - Review full essay content
   - Note the outcome/results

4. **Learn & Apply**
   - Identify techniques used
   - Note structure and flow
   - Adapt (don't copy) to your essay

## Analytics Dashboard

### Viewing Progress

1. **Access Analytics**
   - Open essay in editor
   - Analytics shown in sidebar

2. **Review Metrics**
   - Total revisions
   - Time spent writing
   - Number of peer reviews
   - Average rating

3. **Track Improvement**
   - See readability score trend
   - Monitor grammar issue reduction
   - Check structure improvements
   - View impact score growth

4. **Compare Versions**
   - View version comparison table
   - See scores for each version
   - Identify areas of improvement

## Tips for Success

### Writing Tips

1. **Start Early**: Give yourself time for multiple revisions
2. **Be Specific**: Use concrete examples and details
3. **Show Growth**: Demonstrate learning and development
4. **Be Authentic**: Write in your genuine voice
5. **Proofread**: Use grammar checker and peer reviews
6. **Revise**: Create multiple versions based on feedback

### Peer Review Tips

1. **Be Constructive**: Provide helpful, actionable feedback
2. **Be Specific**: Point to exact areas, not generalizations
3. **Be Balanced**: Mention both strengths and improvements
4. **Be Timely**: Complete reviews before deadline
5. **Be Respectful**: Remember someone's hard work

### Counselor Review Tips

1. **Be Thorough**: Read entire essay carefully
2. **Be Detailed**: Provide specific, actionable feedback
3. **Be Encouraging**: Balance criticism with praise
4. **Be Realistic**: Set appropriate expectations
5. **Be Supportive**: Guide students to success

## Common Issues & Solutions

### Issue: Word count not updating

**Solution**: The word count updates on each keystroke. Make sure you're typing in the editor field.

### Issue: Grammar check not working

**Solution**: Ensure you have internet connection. In mock mode, it returns sample issues.

### Issue: Can't save essay

**Solution**: Check that you've entered a title. The save button is disabled until title is set.

### Issue: AI suggestions not loading

**Solution**: Click "AI Suggestions" button. In mock mode, there's a 1-second delay to simulate API call.

### Issue: Peer review not assigned

**Solution**: Ensure essay status is "In Review" and word count meets minimum requirement.

## Keyboard Shortcuts

- `Ctrl/Cmd + B`: Bold selected text
- `Ctrl/Cmd + I`: Italic selected text
- `Ctrl/Cmd + U`: Underline selected text
- `Ctrl/Cmd + S`: Save essay
- `Ctrl/Cmd + Z`: Undo
- `Ctrl/Cmd + Y`: Redo

## Next Steps

1. Write your first essay using a prompt
2. Use AI suggestions to improve writing
3. Request peer reviews
4. Review feedback and revise
5. Submit for counselor approval
6. Apply to scholarships!

## Support

For questions or issues:

- Check the full documentation: `SCHOLARSHIP_ESSAY_IMPLEMENTATION.md`
- Review mock data examples: `frontend/src/data/mockScholarshipEssayData.ts`
- Examine component source code for detailed functionality
