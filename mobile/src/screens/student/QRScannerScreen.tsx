import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Text, Icon, Button } from '@rneui/themed';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '@constants';
import { QRScanner } from '@components/shared';
import { qrScannerService } from '@utils';
import { StudentTabScreenProps } from '@types';

type Props = StudentTabScreenProps<'QRScanner'>;

export const QRScannerScreen: React.FC<Props> = ({ navigation }) => {
  const [showScanner, setShowScanner] = useState(false);
  const [scanHistory, setScanHistory] = useState<any[]>([]);

  const handleScan = (data: string, type: string) => {
    const parsed = qrScannerService.parseQRData({ data, type, bounds: undefined });

    setScanHistory([
      {
        data: parsed.data,
        type: parsed.type,
        raw: parsed.raw,
        timestamp: new Date(),
      },
      ...scanHistory.slice(0, 9),
    ]);

    setShowScanner(false);

    qrScannerService.handleScanResult({ data, type, bounds: undefined }, navigation);
  };

  const handleQuickAction = (_action: string) => {
    setShowScanner(true);
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Icon name="maximize" type="feather" size={64} color={COLORS.primary} />
          <Text h3 style={styles.title}>
            QR Code Scanner
          </Text>
          <Text style={styles.subtitle}>
            Scan QR codes for quick access to assignments, attendance, and more
          </Text>
        </View>

        <Button
          title="Scan QR Code"
          icon={<Icon name="camera" type="feather" color={COLORS.background} size={24} />}
          onPress={() => setShowScanner(true)}
          buttonStyle={styles.scanButton}
          titleStyle={styles.scanButtonTitle}
        />

        <View style={styles.quickActions}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => handleQuickAction('attendance')}
            >
              <Icon name="check-circle" type="feather" size={32} color={COLORS.primary} />
              <Text style={styles.actionTitle}>Attendance</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => handleQuickAction('assignment')}
            >
              <Icon name="file-text" type="feather" size={32} color={COLORS.primary} />
              <Text style={styles.actionTitle}>Assignment</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => handleQuickAction('schedule')}
            >
              <Icon name="calendar" type="feather" size={32} color={COLORS.primary} />
              <Text style={styles.actionTitle}>Schedule</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => handleQuickAction('general')}
            >
              <Icon name="grid" type="feather" size={32} color={COLORS.primary} />
              <Text style={styles.actionTitle}>General</Text>
            </TouchableOpacity>
          </View>
        </View>

        {scanHistory.length > 0 && (
          <View style={styles.historySection}>
            <Text style={styles.sectionTitle}>Recent Scans</Text>
            {scanHistory.map((item, index) => (
              <View key={index} style={styles.historyItem}>
                <View style={styles.historyIcon}>
                  <Icon
                    name={
                      item.type === 'url'
                        ? 'link'
                        : item.type === 'assignment'
                          ? 'file-text'
                          : 'grid'
                    }
                    type="feather"
                    size={20}
                    color={COLORS.primary}
                  />
                </View>
                <View style={styles.historyContent}>
                  <Text style={styles.historyType}>{item.type.toUpperCase()}</Text>
                  <Text style={styles.historyData} numberOfLines={1}>
                    {item.raw}
                  </Text>
                  <Text style={styles.historyTime}>
                    {new Date(item.timestamp).toLocaleString()}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <QRScanner
        visible={showScanner}
        onClose={() => setShowScanner(false)}
        onScan={handleScan}
        title="Scan QR Code"
        showInstructions={true}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  content: {
    padding: SPACING.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  title: {
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
    color: COLORS.text,
  },
  subtitle: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    paddingHorizontal: SPACING.lg,
  },
  scanButton: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: SPACING.lg,
    marginBottom: SPACING.xl,
  },
  scanButtonTitle: {
    fontSize: FONT_SIZES.lg,
    marginLeft: SPACING.sm,
  },
  quickActions: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  actionCard: {
    width: '48%',
    backgroundColor: COLORS.background,
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  actionTitle: {
    marginTop: SPACING.sm,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  historySection: {
    marginTop: SPACING.lg,
  },
  historyItem: {
    flexDirection: 'row',
    backgroundColor: COLORS.background,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.sm,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  historyIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  historyContent: {
    flex: 1,
  },
  historyType: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: 2,
  },
  historyData: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    marginBottom: 2,
  },
  historyTime: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
  },
});
