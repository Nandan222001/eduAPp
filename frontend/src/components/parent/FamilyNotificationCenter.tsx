import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Stack,
  Chip,
  IconButton,
  Badge,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  ToggleButtonGroup,
  ToggleButton,
  Alert,
  Button,
  Collapse,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Assignment as AssignmentIcon,
  Grade as GradeIcon,
  EventAvailable as EventIcon,
  Message as MessageIcon,
  School as SchoolIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  MarkEmailRead as MarkReadIcon,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { parentsApi } from '@/api/parents';
import type { ChildOverview, FamilyNotification } from '@/types/parent';
import { format } from 'date-fns';

interface FamilyNotificationCenterProps {
  selectedChildren: ChildOverview[];
}

const NOTIFICATION_ICONS = {
  assignment: AssignmentIcon,
  attendance: SchoolIcon,
  message: MessageIcon,
  grade: GradeIcon,
  exam: SchoolIcon,
  event: EventIcon,
  system: NotificationsIcon,
};

const PRIORITY_COLORS = {
  urgent: 'error' as const,
  high: 'warning' as const,
  medium: 'info' as const,
  low: 'default' as const,
};

export const FamilyNotificationCenter: React.FC<FamilyNotificationCenterProps> = ({
  selectedChildren,
}) => {
  const [viewMode, setViewMode] = useState<'all' | 'digest'>('all');
  const [filterByType, setFilterByType] = useState<string>('');
  const [expandedDays, setExpandedDays] = useState<Record<string, boolean>>({});

  const { data: digest, isLoading } = useQuery({
    queryKey: ['family-notification-digest'],
    queryFn: () => parentsApi.getFamilyNotificationDigest(),
  });

  const handleViewModeChange = (_event: React.MouseEvent<HTMLElement>, newMode: string | null) => {
    if (newMode) {
      setViewMode(newMode as 'all' | 'digest');
    }
  };

  const handleFilterChange = (_event: React.MouseEvent<HTMLElement>, newFilter: string | null) => {
    setFilterByType(newFilter || '');
  };

  const toggleDayExpanded = (day: string) => {
    setExpandedDays((prev) => ({ ...prev, [day]: !prev[day] }));
  };

  const markAllAsRead = async () => {};

  const filteredNotifications = React.useMemo(() => {
    if (!digest) return [];

    let notifications = digest.notifications;

    if (filterByType) {
      notifications = notifications.filter((n) => n.notification_type === filterByType);
    }

    return notifications;
  }, [digest, filterByType]);

  const groupedByDate = React.useMemo(() => {
    const grouped: Record<string, FamilyNotification[]> = {};

    filteredNotifications.forEach((notification) => {
      const date = format(new Date(notification.created_at), 'yyyy-MM-dd');
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(notification);
    });

    return grouped;
  }, [filteredNotifications]);

  if (isLoading) {
    return (
      <Card>
        <CardContent>
          <Typography>Loading notifications...</Typography>
        </CardContent>
      </Card>
    );
  }

  if (!digest) {
    return <Alert severity="info">No notifications available.</Alert>;
  }

  const notificationTypes = Object.keys(digest.summary.by_type);

  return (
    <Box>
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">Family Notifications</Typography>
            <Stack direction="row" spacing={2} alignItems="center">
              <ToggleButtonGroup
                value={viewMode}
                exclusive
                onChange={handleViewModeChange}
                size="small"
              >
                <ToggleButton value="all">All</ToggleButton>
                <ToggleButton value="digest">Digest</ToggleButton>
              </ToggleButtonGroup>
              <Button
                variant="outlined"
                size="small"
                startIcon={<MarkReadIcon />}
                onClick={markAllAsRead}
              >
                Mark All Read
              </Button>
            </Stack>
          </Box>

          <Stack direction="row" spacing={1} mb={2}>
            <Chip label={`Total: ${digest.summary.total_count}`} color="primary" size="small" />
            <Chip label={`Unread: ${digest.summary.unread_count}`} color="error" size="small" />
            {selectedChildren.map((child) => (
              <Chip
                key={child.id}
                label={`${child.first_name}: ${digest.summary.by_child[child.id] || 0}`}
                size="small"
                variant="outlined"
              />
            ))}
          </Stack>

          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Filter by Type
            </Typography>
            <ToggleButtonGroup
              value={filterByType}
              exclusive
              onChange={handleFilterChange}
              size="small"
            >
              <ToggleButton value="">All</ToggleButton>
              {notificationTypes.map((type) => (
                <ToggleButton key={type} value={type}>
                  {type} ({digest.summary.by_type[type]})
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
          </Box>
        </CardContent>
      </Card>

      {viewMode === 'digest' ? (
        <Stack spacing={2}>
          {Object.entries(groupedByDate)
            .sort(([dateA], [dateB]) => new Date(dateB).getTime() - new Date(dateA).getTime())
            .map(([date, notifications]) => {
              const isExpanded = expandedDays[date] || false;
              const unreadCount = notifications.filter((n) => !n.is_read).length;

              return (
                <Card key={date}>
                  <CardContent>
                    <Box
                      display="flex"
                      justifyContent="space-between"
                      alignItems="center"
                      sx={{ cursor: 'pointer' }}
                      onClick={() => toggleDayExpanded(date)}
                    >
                      <Box display="flex" alignItems="center" gap={2}>
                        <Typography variant="h6">
                          {format(new Date(date), 'EEEE, MMMM d, yyyy')}
                        </Typography>
                        <Badge badgeContent={unreadCount} color="error">
                          <Chip label={`${notifications.length} notifications`} size="small" />
                        </Badge>
                      </Box>
                      <IconButton>
                        {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                      </IconButton>
                    </Box>

                    <Collapse in={isExpanded}>
                      <Divider sx={{ my: 2 }} />
                      <List>
                        {notifications.map((notification) => {
                          const NotificationIcon =
                            NOTIFICATION_ICONS[
                              notification.notification_type as keyof typeof NOTIFICATION_ICONS
                            ] || NotificationsIcon;
                          return (
                            <React.Fragment key={notification.id}>
                              <ListItem
                                sx={{
                                  bgcolor: notification.is_read ? 'transparent' : 'action.hover',
                                  borderRadius: 1,
                                  mb: 1,
                                }}
                              >
                                <ListItemIcon>
                                  <NotificationIcon color="primary" />
                                </ListItemIcon>
                                <ListItemText
                                  primary={
                                    <Box display="flex" alignItems="center" gap={1}>
                                      <Typography
                                        variant="subtitle2"
                                        fontWeight={notification.is_read ? 'normal' : 'bold'}
                                      >
                                        {notification.title}
                                      </Typography>
                                      <Chip
                                        label={notification.child_name}
                                        size="small"
                                        color="primary"
                                        variant="outlined"
                                      />
                                      <Chip
                                        label={notification.priority}
                                        size="small"
                                        color={
                                          PRIORITY_COLORS[
                                            notification.priority as keyof typeof PRIORITY_COLORS
                                          ]
                                        }
                                      />
                                    </Box>
                                  }
                                  secondary={
                                    <Box>
                                      <Typography variant="body2" color="text.secondary">
                                        {notification.message}
                                      </Typography>
                                      <Typography variant="caption" color="text.secondary">
                                        {format(new Date(notification.created_at), 'h:mm a')}
                                      </Typography>
                                    </Box>
                                  }
                                />
                              </ListItem>
                            </React.Fragment>
                          );
                        })}
                      </List>
                    </Collapse>
                  </CardContent>
                </Card>
              );
            })}
        </Stack>
      ) : (
        <Card>
          <CardContent>
            <List>
              {filteredNotifications
                .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                .map((notification) => {
                  const NotificationIcon =
                    NOTIFICATION_ICONS[
                      notification.notification_type as keyof typeof NOTIFICATION_ICONS
                    ] || NotificationsIcon;
                  return (
                    <React.Fragment key={notification.id}>
                      <ListItem
                        sx={{
                          bgcolor: notification.is_read ? 'transparent' : 'action.hover',
                          borderRadius: 1,
                          mb: 1,
                        }}
                      >
                        <ListItemIcon>
                          <NotificationIcon color="primary" />
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
                              <Typography
                                variant="subtitle2"
                                fontWeight={notification.is_read ? 'normal' : 'bold'}
                              >
                                {notification.title}
                              </Typography>
                              <Chip
                                label={notification.child_name}
                                size="small"
                                color="primary"
                                variant="outlined"
                              />
                              <Chip
                                label={notification.priority}
                                size="small"
                                color={
                                  PRIORITY_COLORS[
                                    notification.priority as keyof typeof PRIORITY_COLORS
                                  ]
                                }
                              />
                            </Box>
                          }
                          secondary={
                            <Box>
                              <Typography variant="body2" color="text.secondary">
                                {notification.message}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {format(new Date(notification.created_at), 'MMM d, yyyy h:mm a')}
                              </Typography>
                            </Box>
                          }
                        />
                      </ListItem>
                      <Divider />
                    </React.Fragment>
                  );
                })}
            </List>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};
