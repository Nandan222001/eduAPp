import { test, expect } from '@playwright/test';
import { LoginPage } from '../../../e2e/page-objects/LoginPage';
import { waitForNetworkIdle } from '../../../e2e/utils/helpers';

test.describe('Demo User Complete E2E Flow', () => {
  let loginPage: LoginPage;

  const DEMO_CREDENTIALS = {
    email: 'demo@example.com',
    password: 'Demo@123',
  };

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
  });

  test('should complete full demo user journey from login to analytics', async ({ page }) => {
    await loginPage.goto();

    await expect(page).toHaveTitle(/login/i);

    await loginPage.login(DEMO_CREDENTIALS.email, DEMO_CREDENTIALS.password);

    await waitForNetworkIdle(page);

    await expect(page).toHaveURL(/student\/dashboard/);

    const welcomeMessage = page.locator('h4, h5, h6', {
      hasText: /Alex Johnson/i,
    });
    await expect(welcomeMessage).toBeVisible({ timeout: 10000 });

    const attendanceCard = page.locator("text=/Today's Attendance/i").locator('..');
    await expect(attendanceCard).toBeVisible();

    const attendancePercentage = page.locator('text=/80%|80.0%/');
    await expect(attendancePercentage.first()).toBeVisible({ timeout: 5000 });

    const upcomingAssignmentsSection = page.locator('text=/Upcoming Assignments/i').locator('..');
    await expect(upcomingAssignmentsSection).toBeVisible();

    const assignmentItems = upcomingAssignmentsSection.locator(
      '.assignment-item, li, [role="listitem"]'
    );
    const assignmentCount = await assignmentItems.count();
    expect(assignmentCount).toBeGreaterThan(0);

    const recentGradesSection = page.locator('text=/Recent Grades/i').locator('..');
    await expect(recentGradesSection).toBeVisible();

    const gradeItems = recentGradesSection.locator('li, [role="listitem"], .grade-item');
    const gradesCount = await gradeItems.count();
    expect(gradesCount).toBeGreaterThan(0);

    const submissionWithGrade = page.locator('text=/A|B|C|grade/i').first();
    await expect(submissionWithGrade).toBeVisible();

    const pointsDisplay = page.locator('text=/2450|2,450/');
    await expect(pointsDisplay.first()).toBeVisible({ timeout: 5000 });

    const badgesSection = page.locator('text=/badges/i').locator('..');
    await expect(badgesSection).toBeVisible();

    const badgeItems = badgesSection.locator('[role="img"], .badge-item, img, svg');
    const badgesCount = await badgeItems.count();
    expect(badgesCount).toBeGreaterThan(0);

    await page.goto('/student/ai-prediction');
    await waitForNetworkIdle(page);

    await expect(page).toHaveURL(/student\/ai-prediction/);

    const aiPredictionTitle = page.locator('h1, h2, h3, h4', {
      hasText: /AI Prediction|Board Exam Prediction/i,
    });
    await expect(aiPredictionTitle.first()).toBeVisible({ timeout: 10000 });

    const topicProbabilitySection = page.locator('text=/Topic.*Probability|Probability.*Ranking/i');
    await expect(topicProbabilitySection.first()).toBeVisible({ timeout: 10000 });

    const topicRows = page.locator('table tbody tr, .topic-item, [role="row"]');
    const topicsCount = await topicRows.count();
    expect(topicsCount).toBeGreaterThan(0);

    const topicNames = page.locator('text=/Quadratic|Trigonometric|Circle|Probability|Calculus/i');
    await expect(topicNames.first()).toBeVisible();

    await page.goto('/student/analytics');
    await waitForNetworkIdle(page);

    await expect(page).toHaveURL(/student\/analytics/);

    const analyticsTitle = page.locator('h1, h2, h3, h4', {
      hasText: /Performance Analytics|Analytics/i,
    });
    await expect(analyticsTitle.first()).toBeVisible({ timeout: 10000 });

    const examResultsSection = page.locator(
      'text=/Exam.*Performance|Performance|Overall Performance/i'
    );
    await expect(examResultsSection.first()).toBeVisible({ timeout: 10000 });

    const performanceScore = page.locator('text=/86|87|88|89%/');
    await expect(performanceScore.first()).toBeVisible({ timeout: 5000 });

    const chartElements = page.locator('canvas, svg[class*="recharts"], [data-testid*="chart"]');
    const chartsCount = await chartElements.count();
    expect(chartsCount).toBeGreaterThan(0);
  });

  test('should navigate login page and verify page title', async ({ page }) => {
    await loginPage.goto();

    await expect(page).toHaveTitle(/login/i);

    await expect(loginPage.emailInput).toBeVisible();
    await expect(loginPage.passwordInput).toBeVisible();
    await expect(loginPage.loginButton).toBeVisible();
  });

  test('should login with demo credentials and verify redirect', async ({ page }) => {
    await loginPage.goto();

    await loginPage.login(DEMO_CREDENTIALS.email, DEMO_CREDENTIALS.password);

    await waitForNetworkIdle(page);

    await expect(page).toHaveURL(/student\/dashboard/);
  });

  test('should verify welcome message shows Alex Johnson', async ({ page }) => {
    await loginPage.goto();
    await loginPage.login(DEMO_CREDENTIALS.email, DEMO_CREDENTIALS.password);
    await waitForNetworkIdle(page);

    const welcomeMessage = page.locator('h4, h5, h6', {
      hasText: /Alex Johnson/i,
    });
    await expect(welcomeMessage).toBeVisible();
  });

  test('should verify attendance card displays 80%', async ({ page }) => {
    await loginPage.goto();
    await loginPage.login(DEMO_CREDENTIALS.email, DEMO_CREDENTIALS.password);
    await waitForNetworkIdle(page);

    const attendanceCard = page.locator("text=/Today's Attendance/i").locator('..');
    await expect(attendanceCard).toBeVisible();

    const attendancePercentage = page.locator('text=/80%|80.0%/');
    await expect(attendancePercentage.first()).toBeVisible();
  });

  test('should verify upcoming assignments section shows assignments', async ({ page }) => {
    await loginPage.goto();
    await loginPage.login(DEMO_CREDENTIALS.email, DEMO_CREDENTIALS.password);
    await waitForNetworkIdle(page);

    const upcomingAssignmentsSection = page.locator('text=/Upcoming Assignments/i').locator('..');
    await expect(upcomingAssignmentsSection).toBeVisible();

    const assignmentItems = upcomingAssignmentsSection.locator(
      '.assignment-item, li, [role="listitem"]'
    );
    const assignmentCount = await assignmentItems.count();
    expect(assignmentCount).toBeGreaterThan(0);
  });

  test('should verify recent grades section shows submissions with grades', async ({ page }) => {
    await loginPage.goto();
    await loginPage.login(DEMO_CREDENTIALS.email, DEMO_CREDENTIALS.password);
    await waitForNetworkIdle(page);

    const recentGradesSection = page.locator('text=/Recent Grades/i').locator('..');
    await expect(recentGradesSection).toBeVisible();

    const gradeItems = recentGradesSection.locator('li, [role="listitem"], .grade-item');
    const gradesCount = await gradeItems.count();
    expect(gradesCount).toBeGreaterThan(0);

    const submissionWithGrade = page.locator('text=/A|B|C|grade/i').first();
    await expect(submissionWithGrade).toBeVisible();
  });

  test('should verify gamification widgets show points and badges', async ({ page }) => {
    await loginPage.goto();
    await loginPage.login(DEMO_CREDENTIALS.email, DEMO_CREDENTIALS.password);
    await waitForNetworkIdle(page);

    const pointsDisplay = page.locator('text=/2450|2,450/');
    await expect(pointsDisplay.first()).toBeVisible();

    const badgesSection = page.locator('text=/badges/i').locator('..');
    await expect(badgesSection).toBeVisible();

    const badgeItems = badgesSection.locator('[role="img"], .badge-item, img, svg');
    const badgesCount = await badgeItems.count();
    expect(badgesCount).toBeGreaterThan(0);
  });

  test('should navigate to AI prediction and verify dashboard loads with topic probabilities', async ({
    page,
  }) => {
    await loginPage.goto();
    await loginPage.login(DEMO_CREDENTIALS.email, DEMO_CREDENTIALS.password);
    await waitForNetworkIdle(page);

    await page.goto('/student/ai-prediction');
    await waitForNetworkIdle(page);

    await expect(page).toHaveURL(/student\/ai-prediction/);

    const aiPredictionTitle = page.locator('h1, h2, h3, h4', {
      hasText: /AI Prediction|Board Exam Prediction/i,
    });
    await expect(aiPredictionTitle.first()).toBeVisible();

    const topicProbabilitySection = page.locator('text=/Topic.*Probability|Probability.*Ranking/i');
    await expect(topicProbabilitySection.first()).toBeVisible();

    const topicRows = page.locator('table tbody tr, .topic-item, [role="row"]');
    const topicsCount = await topicRows.count();
    expect(topicsCount).toBeGreaterThan(0);

    const topicNames = page.locator('text=/Quadratic|Trigonometric|Circle|Probability|Calculus/i');
    await expect(topicNames.first()).toBeVisible();
  });

  test('should navigate to analytics and verify performance analytics loads with exam results', async ({
    page,
  }) => {
    await loginPage.goto();
    await loginPage.login(DEMO_CREDENTIALS.email, DEMO_CREDENTIALS.password);
    await waitForNetworkIdle(page);

    await page.goto('/student/analytics');
    await waitForNetworkIdle(page);

    await expect(page).toHaveURL(/student\/analytics/);

    const analyticsTitle = page.locator('h1, h2, h3, h4', {
      hasText: /Performance Analytics|Analytics/i,
    });
    await expect(analyticsTitle.first()).toBeVisible();

    const examResultsSection = page.locator(
      'text=/Exam.*Performance|Performance|Overall Performance/i'
    );
    await expect(examResultsSection.first()).toBeVisible();

    const performanceScore = page.locator('text=/86|87|88|89%/');
    await expect(performanceScore.first()).toBeVisible();

    const chartElements = page.locator('canvas, svg[class*="recharts"], [data-testid*="chart"]');
    const chartsCount = await chartElements.count();
    expect(chartsCount).toBeGreaterThan(0);
  });
});
