import { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  IconButton,
  Menu,
  MenuItem,
  Tooltip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  CircularProgress,
  Alert,
} from '@mui/material';
import { Refresh as RefreshIcon, MoreVert as MoreVertIcon } from '@mui/icons-material';
import {
  DndContext,
  closestCenter,
  DragEndEvent,
  useSensor,
  useSensors,
  PointerSensor,
} from '@dnd-kit/core';
import { SortableContext, rectSortingStrategy } from '@dnd-kit/sortable';
import dashboardWidgetsApi, { DashboardWidget } from '@/api/dashboardWidgets';
import DraggableWidget from './DraggableWidget';
import WidgetFactory from './WidgetFactory';

interface DashboardWidgetsProps {
  customizeMode?: boolean;
  onCustomizeModeChange?: (mode: boolean) => void;
}

export default function DashboardWidgets({
  customizeMode = false,
  onCustomizeModeChange,
}: DashboardWidgetsProps) {
  const [widgets, setWidgets] = useState<DashboardWidget[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [isCustomizing, setIsCustomizing] = useState(customizeMode);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  useEffect(() => {
    loadWidgets();
  }, []);

  useEffect(() => {
    setIsCustomizing(customizeMode);
  }, [customizeMode]);

  const loadWidgets = async () => {
    try {
      setLoading(true);
      setError(null);
      let widgetData = await dashboardWidgetsApi.getWidgets();

      if (widgetData.length === 0) {
        widgetData = await dashboardWidgetsApi.initializeDefaultWidgets();
      }

      setWidgets(widgetData.filter((w) => w.is_visible));
    } catch (err: unknown) {
      const errorMessage =
        err &&
        typeof err === 'object' &&
        'response' in err &&
        typeof err.response === 'object' &&
        err.response &&
        'data' in err.response &&
        typeof err.response.data === 'object' &&
        err.response.data &&
        'detail' in err.response.data
          ? String(err.response.data.detail)
          : 'Failed to load widgets';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = widgets.findIndex((w) => w.id === active.id);
    const newIndex = widgets.findIndex((w) => w.id === over.id);

    const newWidgets = [...widgets];
    const [movedWidget] = newWidgets.splice(oldIndex, 1);
    newWidgets.splice(newIndex, 0, movedWidget);

    const updates = newWidgets.map((widget, index) => ({
      widget_id: widget.id,
      position: index,
    }));

    setWidgets(newWidgets);

    try {
      await dashboardWidgetsApi.updatePositions({ updates });
    } catch (err) {
      setWidgets(widgets);
      setError('Failed to update widget positions');
    }
  };

  const handleRefresh = () => {
    loadWidgets();
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleCustomizeToggle = () => {
    const newMode = !isCustomizing;
    setIsCustomizing(newMode);
    onCustomizeModeChange?.(newMode);
    handleMenuClose();
  };

  const handleResetDialogOpen = () => {
    setResetDialogOpen(true);
    handleMenuClose();
  };

  const handleResetDialogClose = () => {
    setResetDialogOpen(false);
  };

  const handleReset = async () => {
    try {
      const resetWidgets = await dashboardWidgetsApi.resetToDefaults();
      setWidgets(resetWidgets.filter((w) => w.is_visible));
      handleResetDialogClose();
    } catch (err) {
      setError('Failed to reset widgets');
    }
  };

  const handleToggleVisibility = async (widgetId: number) => {
    try {
      const widget = widgets.find((w) => w.id === widgetId);
      if (widget) {
        await dashboardWidgetsApi.updateWidget(widgetId, { is_visible: false });
        setWidgets(widgets.filter((w) => w.id !== widgetId));
      }
    } catch (err) {
      setError('Failed to update widget');
    }
  };

  const handleEditWidget = async (widgetId: number, updates: Record<string, unknown>) => {
    try {
      const updatedWidget = await dashboardWidgetsApi.updateWidget(widgetId, updates);
      setWidgets(widgets.map((w) => (w.id === widgetId ? updatedWidget : w)));
    } catch (err) {
      setError('Failed to update widget');
    }
  };

  const getGridSize = (size: string) => {
    switch (size) {
      case 'small':
        return { xs: 12, sm: 6, md: 4, lg: 3 };
      case 'medium':
        return { xs: 12, sm: 6, md: 6, lg: 4 };
      case 'large':
        return { xs: 12, sm: 12, md: 8, lg: 6 };
      case 'full':
        return { xs: 12, sm: 12, md: 12, lg: 12 };
      default:
        return { xs: 12, sm: 6, md: 6, lg: 4 };
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" fontWeight={600}>
          Dashboard
        </Typography>
        <Box display="flex" gap={1}>
          <Tooltip title="Refresh">
            <IconButton onClick={handleRefresh} size="small">
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Settings">
            <IconButton onClick={handleMenuOpen} size="small">
              <MoreVertIcon />
            </IconButton>
          </Tooltip>
          <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
            <MenuItem onClick={handleCustomizeToggle}>
              {isCustomizing ? 'Exit Customize Mode' : 'Customize Dashboard'}
            </MenuItem>
            <MenuItem onClick={handleResetDialogOpen}>Reset to Defaults</MenuItem>
          </Menu>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={widgets.map((w) => w.id)} strategy={rectSortingStrategy}>
          <Grid container spacing={3}>
            {widgets.map((widget) => (
              <Grid key={widget.id} item {...getGridSize(widget.size)}>
                <DraggableWidget
                  widget={widget}
                  customizeMode={isCustomizing}
                  onToggleVisibility={handleToggleVisibility}
                  onEdit={handleEditWidget}
                >
                  <WidgetFactory widget={widget} />
                </DraggableWidget>
              </Grid>
            ))}
          </Grid>
        </SortableContext>
      </DndContext>

      <Dialog open={resetDialogOpen} onClose={handleResetDialogClose}>
        <DialogTitle>Reset Dashboard</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to reset your dashboard to default settings? This will remove all
            customizations.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleResetDialogClose}>Cancel</Button>
          <Button onClick={handleReset} color="error" variant="contained">
            Reset
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
