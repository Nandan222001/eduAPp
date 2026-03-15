import React, { useState, useMemo } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Stack,
  Chip,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Grid,
  Paper,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Divider,
} from '@mui/material';
import {
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Assignment as AssignmentIcon,
  Event as EventIcon,
  School as SchoolIcon,
  MeetingRoom as MeetingIcon,
  BeachAccess as HolidayIcon,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { parentsApi } from '@/api/parents';
import type { ChildOverview } from '@/types/parent';
import type { FamilyCalendarEvent } from '@/types/parent';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  addMonths,
  subMonths,
} from 'date-fns';

interface FamilyCalendarProps {
  selectedChildren?: ChildOverview[];
  allChildren: ChildOverview[];
}

const CHILD_COLORS = [
  '#1976d2',
  '#9c27b0',
  '#f57c00',
  '#388e3c',
  '#d32f2f',
  '#0288d1',
  '#7b1fa2',
  '#5d4037',
];

const EVENT_TYPE_ICONS = {
  assignment: AssignmentIcon,
  exam: SchoolIcon,
  event: EventIcon,
  meeting: MeetingIcon,
  holiday: HolidayIcon,
};

export const FamilyCalendar: React.FC<FamilyCalendarProps> = ({
  selectedChildren: _selectedChildren,
  allChildren,
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedFilters, setSelectedFilters] = useState<Record<number, boolean>>(
    Object.fromEntries(allChildren.map((child) => [child.id, true]))
  );
  const [selectedEvent, setSelectedEvent] = useState<FamilyCalendarEvent | null>(null);

  const startDate = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
  const endDate = format(endOfMonth(currentMonth), 'yyyy-MM-dd');

  const filteredChildIds = useMemo(
    () =>
      Object.entries(selectedFilters)
        .filter(([_, enabled]) => enabled)
        .map(([id]) => Number(id)),
    [selectedFilters]
  );

  const { data: events = [] } = useQuery({
    queryKey: ['family-calendar-events', startDate, endDate, filteredChildIds],
    queryFn: () => parentsApi.getFamilyCalendarEvents(startDate, endDate, filteredChildIds),
  });

  const childColorMap = useMemo(
    () =>
      Object.fromEntries(
        allChildren.map((child, idx) => [child.id, CHILD_COLORS[idx % CHILD_COLORS.length]])
      ),
    [allChildren]
  );

  const calendarDays = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const eventsByDay = useMemo(() => {
    const byDay: Record<string, FamilyCalendarEvent[]> = {};
    events.forEach((event) => {
      const dateKey = format(new Date(event.start_date), 'yyyy-MM-dd');
      if (!byDay[dateKey]) byDay[dateKey] = [];
      byDay[dateKey].push(event);
    });
    return byDay;
  }, [events]);

  const handleFilterToggle = (childId: number) => {
    setSelectedFilters((prev) => ({ ...prev, [childId]: !prev[childId] }));
  };

  const handlePreviousMonth = () => {
    setCurrentMonth((prev) => subMonths(prev, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth((prev) => addMonths(prev, 1));
  };

  const handleEventClick = (event: FamilyCalendarEvent) => {
    setSelectedEvent(event);
  };

  const handleCloseDialog = () => {
    setSelectedEvent(null);
  };

  return (
    <Box>
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">Filter by Child</Typography>
          </Box>
          <FormGroup row>
            {allChildren.map((child) => (
              <FormControlLabel
                key={child.id}
                control={
                  <Checkbox
                    checked={selectedFilters[child.id] || false}
                    onChange={() => handleFilterToggle(child.id)}
                    sx={{
                      color: childColorMap[child.id],
                      '&.Mui-checked': {
                        color: childColorMap[child.id],
                      },
                    }}
                  />
                }
                label={
                  <Box display="flex" alignItems="center" gap={1}>
                    <Box
                      sx={{
                        width: 12,
                        height: 12,
                        borderRadius: '50%',
                        bgcolor: childColorMap[child.id],
                      }}
                    />
                    {child.first_name} {child.last_name}
                  </Box>
                }
              />
            ))}
          </FormGroup>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <IconButton onClick={handlePreviousMonth} aria-label="Previous month">
              <ChevronLeftIcon />
            </IconButton>
            <Typography variant="h5" fontWeight="bold">
              {format(currentMonth, 'MMMM yyyy')}
            </Typography>
            <IconButton onClick={handleNextMonth} aria-label="Next month">
              <ChevronRightIcon />
            </IconButton>
          </Box>

          <Grid container spacing={1}>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <Grid item xs key={day}>
                <Typography
                  variant="subtitle2"
                  align="center"
                  fontWeight="bold"
                  color="text.secondary"
                >
                  {day}
                </Typography>
              </Grid>
            ))}

            {calendarDays.map((day) => {
              const dateKey = format(day, 'yyyy-MM-dd');
              const dayEvents = eventsByDay[dateKey] || [];
              const isToday = isSameDay(day, new Date());

              return (
                <Grid item xs key={dateKey}>
                  <Paper
                    elevation={isToday ? 3 : 1}
                    sx={{
                      minHeight: 100,
                      p: 1,
                      bgcolor: isToday ? 'primary.lighter' : 'background.paper',
                      border: isToday ? 2 : 0,
                      borderColor: 'primary.main',
                      cursor: dayEvents.length > 0 ? 'pointer' : 'default',
                    }}
                  >
                    <Typography
                      variant="caption"
                      fontWeight={isToday ? 'bold' : 'normal'}
                      color={isToday ? 'primary' : 'text.secondary'}
                    >
                      {format(day, 'd')}
                    </Typography>
                    <Stack spacing={0.5} mt={0.5}>
                      {dayEvents.slice(0, 3).map((event) => {
                        const EventTypeIcon = EVENT_TYPE_ICONS[event.event_type] || EventIcon;
                        return (
                          <Tooltip key={event.id} title={`${event.child_name}: ${event.title}`}>
                            <Chip
                              size="small"
                              icon={<EventTypeIcon fontSize="small" />}
                              label={
                                event.title.length > 15
                                  ? `${event.title.slice(0, 15)}...`
                                  : event.title
                              }
                              onClick={() => handleEventClick(event)}
                              sx={{
                                bgcolor: event.color || childColorMap[event.child_id],
                                color: 'white',
                                fontSize: '0.65rem',
                                height: 20,
                                '& .MuiChip-icon': {
                                  color: 'white',
                                },
                              }}
                            />
                          </Tooltip>
                        );
                      })}
                      {dayEvents.length > 3 && (
                        <Typography variant="caption" color="text.secondary" align="center">
                          +{dayEvents.length - 3} more
                        </Typography>
                      )}
                    </Stack>
                  </Paper>
                </Grid>
              );
            })}
          </Grid>
        </CardContent>
      </Card>

      <Dialog open={!!selectedEvent} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        {selectedEvent && (
          <>
            <DialogTitle>
              <Box display="flex" alignItems="center" gap={2}>
                {React.createElement(EVENT_TYPE_ICONS[selectedEvent.event_type] || EventIcon, {
                  fontSize: 'large',
                  sx: { color: childColorMap[selectedEvent.child_id] },
                })}
                <Box>
                  <Typography variant="h6">{selectedEvent.title}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {selectedEvent.child_name}
                  </Typography>
                </Box>
              </Box>
            </DialogTitle>
            <Divider />
            <DialogContent>
              <Stack spacing={2}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Type
                  </Typography>
                  <Typography variant="body1" textTransform="capitalize">
                    {selectedEvent.event_type}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Date
                  </Typography>
                  <Typography variant="body1">
                    {format(new Date(selectedEvent.start_date), 'MMMM d, yyyy')}
                    {selectedEvent.end_date !== selectedEvent.start_date &&
                      ` - ${format(new Date(selectedEvent.end_date), 'MMMM d, yyyy')}`}
                  </Typography>
                </Box>
                {selectedEvent.location && (
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Location
                    </Typography>
                    <Typography variant="body1">{selectedEvent.location}</Typography>
                  </Box>
                )}
                {selectedEvent.description && (
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Description
                    </Typography>
                    <Typography variant="body1">{selectedEvent.description}</Typography>
                  </Box>
                )}
                {selectedEvent.status && (
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Status
                    </Typography>
                    <Chip label={selectedEvent.status} size="small" color="primary" />
                  </Box>
                )}
              </Stack>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseDialog}>Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};
