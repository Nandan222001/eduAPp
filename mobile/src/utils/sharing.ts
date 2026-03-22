import { Platform, Alert } from 'react-native';

// Lazy load sharing modules only on native platforms
let Sharing: any = null;
let Print: any = null;

if (Platform.OS !== 'web') {
  Sharing = require('expo-sharing');
  Print = require('expo-print');
}

export interface ShareOptions {
  title?: string;
  message?: string;
  url?: string;
  dialogTitle?: string;
}

export interface ShareFileOptions {
  mimeType?: string;
  UTI?: string;
  dialogTitle?: string;
}

export const sharingService = {
  async isAvailable(): Promise<boolean> {
    if (Platform.OS === 'web') {
      return navigator.share !== undefined;
    }
    return await Sharing.isAvailableAsync();
  },

  async shareText(text: string, options: ShareOptions = {}): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        if (navigator.share) {
          await navigator.share({
            title: options.title,
            text: text,
          });
        } else {
          // Fallback for browsers without share API
          await navigator.clipboard.writeText(text);
          Alert.alert('Copied', 'Text copied to clipboard');
        }
        return;
      }

      const RN = require('react-native');
      await RN.Share.share(
        {
          message: text,
          title: options.title,
        },
        {
          dialogTitle: options.dialogTitle,
        }
      );
    } catch (error) {
      console.error('Error sharing text:', error);
      throw error;
    }
  },

  async shareUrl(url: string, options: ShareOptions = {}): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        if (navigator.share) {
          await navigator.share({
            title: options.title,
            text: options.message,
            url: url,
          });
        } else {
          window.open(url, '_blank');
        }
        return;
      }

      const RN = require('react-native');

      if (Platform.OS === 'ios') {
        await RN.Share.share(
          {
            url,
            title: options.title,
            message: options.message,
          },
          {
            dialogTitle: options.dialogTitle,
          }
        );
      } else {
        await RN.Share.share(
          {
            message: `${options.message || ''}\n${url}`,
            title: options.title,
          },
          {
            dialogTitle: options.dialogTitle,
          }
        );
      }
    } catch (error) {
      console.error('Error sharing URL:', error);
      throw error;
    }
  },

  async shareFile(fileUri: string, options: ShareFileOptions = {}): Promise<void> {
    if (Platform.OS === 'web') {
      Alert.alert('Not Available', 'File sharing is not available on web platform');
      return;
    }

    try {
      const isAvailable = await this.isAvailable();

      if (!isAvailable) {
        Alert.alert('Error', 'Sharing is not available on this device');
        return;
      }

      await Sharing.shareAsync(fileUri, {
        mimeType: options.mimeType,
        UTI: options.UTI,
        dialogTitle: options.dialogTitle,
      });
    } catch (error) {
      console.error('Error sharing file:', error);
      throw error;
    }
  },

  async shareGrades(grades: any[], studentName: string): Promise<void> {
    try {
      const gradesText = this.formatGradesForSharing(grades, studentName);
      await this.shareText(gradesText, {
        title: 'My Grades',
        dialogTitle: 'Share Grades',
      });
    } catch (error) {
      console.error('Error sharing grades:', error);
      Alert.alert('Error', 'Failed to share grades');
    }
  },

  async shareGradesAsPDF(grades: any[], studentName: string): Promise<void> {
    if (Platform.OS === 'web') {
      Alert.alert('Not Available', 'PDF sharing is not available on web platform');
      return;
    }

    try {
      const html = this.generateGradesHTML(grades, studentName);
      const { uri } = await Print.printToFileAsync({ html });

      await this.shareFile(uri, {
        mimeType: 'application/pdf',
        dialogTitle: 'Share Grades Report',
      });
    } catch (error) {
      console.error('Error sharing grades as PDF:', error);
      Alert.alert('Error', 'Failed to share grades as PDF');
    }
  },

  async shareAchievement(achievement: any): Promise<void> {
    try {
      const achievementText = this.formatAchievementForSharing(achievement);
      await this.shareText(achievementText, {
        title: 'My Achievement',
        dialogTitle: 'Share Achievement',
      });
    } catch (error) {
      console.error('Error sharing achievement:', error);
      Alert.alert('Error', 'Failed to share achievement');
    }
  },

  async shareAttendanceReport(attendanceData: any, studentName: string): Promise<void> {
    try {
      const reportText = this.formatAttendanceForSharing(attendanceData, studentName);
      await this.shareText(reportText, {
        title: 'Attendance Report',
        dialogTitle: 'Share Attendance',
      });
    } catch (error) {
      console.error('Error sharing attendance:', error);
      Alert.alert('Error', 'Failed to share attendance report');
    }
  },

  async shareSchedule(schedule: any[], date: string): Promise<void> {
    try {
      const scheduleText = this.formatScheduleForSharing(schedule, date);
      await this.shareText(scheduleText, {
        title: 'My Schedule',
        dialogTitle: 'Share Schedule',
      });
    } catch (error) {
      console.error('Error sharing schedule:', error);
      Alert.alert('Error', 'Failed to share schedule');
    }
  },

  formatGradesForSharing(grades: any[], studentName: string): string {
    let text = `📊 Grades Report for ${studentName}\n\n`;

    grades.forEach((grade, index) => {
      text += `${index + 1}. ${grade.subject || grade.courseName}\n`;
      text += `   Score: ${grade.obtainedMarks}/${grade.totalMarks} (${grade.percentage}%)\n`;
      text += `   Grade: ${grade.grade}\n\n`;
    });

    text += `Generated by EDU Mobile on ${new Date().toLocaleDateString()}`;
    return text;
  },

  formatAchievementForSharing(achievement: any): string {
    return (
      `🏆 Achievement Unlocked!\n\n` +
      `${achievement.title}\n` +
      `${achievement.description}\n\n` +
      `Earned: ${new Date(achievement.earnedAt).toLocaleDateString()}\n\n` +
      `Shared from EDU Mobile`
    );
  },

  formatAttendanceForSharing(attendanceData: any, studentName: string): string {
    return (
      `📅 Attendance Report for ${studentName}\n\n` +
      `Period: ${attendanceData.period}\n` +
      `Present: ${attendanceData.present} days\n` +
      `Absent: ${attendanceData.absent} days\n` +
      `Attendance Rate: ${attendanceData.percentage}%\n\n` +
      `Generated by EDU Mobile on ${new Date().toLocaleDateString()}`
    );
  },

  formatScheduleForSharing(schedule: any[], date: string): string {
    let text = `📅 Schedule for ${date}\n\n`;

    schedule.forEach((item) => {
      text += `${item.startTime} - ${item.endTime}\n`;
      text += `${item.subject || item.title}\n`;
      if (item.teacher) text += `Teacher: ${item.teacher}\n`;
      if (item.room) text += `Room: ${item.room}\n`;
      text += `\n`;
    });

    text += `Generated by EDU Mobile`;
    return text;
  },

  generateGradesHTML(grades: any[], studentName: string): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Grades Report</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 20px;
            }
            h1 {
              color: #2089dc;
              text-align: center;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
            }
            th, td {
              border: 1px solid #ddd;
              padding: 12px;
              text-align: left;
            }
            th {
              background-color: #2089dc;
              color: white;
            }
            tr:nth-child(even) {
              background-color: #f2f2f2;
            }
            .footer {
              margin-top: 30px;
              text-align: center;
              color: #666;
              font-size: 12px;
            }
          </style>
        </head>
        <body>
          <h1>Grades Report</h1>
          <h2>${studentName}</h2>
          <table>
            <thead>
              <tr>
                <th>Subject</th>
                <th>Score</th>
                <th>Percentage</th>
                <th>Grade</th>
              </tr>
            </thead>
            <tbody>
              ${grades
                .map(
                  grade => `
                <tr>
                  <td>${grade.subject || grade.courseName}</td>
                  <td>${grade.obtainedMarks}/${grade.totalMarks}</td>
                  <td>${grade.percentage}%</td>
                  <td>${grade.grade}</td>
                </tr>
              `
                )
                .join('')}
            </tbody>
          </table>
          <div class="footer">
            Generated by EDU Mobile on ${new Date().toLocaleDateString()}
          </div>
        </body>
      </html>
    `;
  },

  async shareMultipleFiles(fileUris: string[], options: ShareFileOptions = {}): Promise<void> {
    if (Platform.OS === 'web') {
      Alert.alert('Not Available', 'File sharing is not available on web platform');
      return;
    }

    try {
      for (const uri of fileUris) {
        await this.shareFile(uri, options);
      }
    } catch (error) {
      console.error('Error sharing multiple files:', error);
      throw error;
    }
  },

  async createShareableLink(data: any, type: string): Promise<string> {
    return `edumobile://share/${type}?data=${encodeURIComponent(JSON.stringify(data))}`;
  },
};
