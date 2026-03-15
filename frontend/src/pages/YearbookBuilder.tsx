import { useState, useRef } from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Button,
  IconButton,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Drawer,
  Tabs,
  Tab,
  Card,
  CardContent,
  CardMedia,
  Stack,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Tooltip,
  AppBar,
  Toolbar,
  List,
  ListItem,
  ListItemText,
  Badge,
  useTheme,
  ToggleButtonGroup,
  ToggleButton,
  Slider,
  Avatar,
} from '@mui/material';
import {
  Image as ImageIcon,
  TextFields as TextIcon,
  FormatQuote as QuoteIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Undo as UndoIcon,
  Redo as RedoIcon,
  GridOn as GridIcon,
  ViewModule as LayoutIcon,
  AutoAwesome as TemplateIcon,
  CheckCircle as CheckIcon,
  Pending as PendingIcon,
  FormatAlignLeft,
  FormatAlignCenter,
  FormatAlignRight,
  FormatBold,
  FormatItalic,
} from '@mui/icons-material';
import { PageElement, YearbookTemplate, PhotoSubmission, MemorySubmission } from '@/types/yearbook';

const mockTemplates: YearbookTemplate[] = [
  {
    id: '1',
    name: 'Classic Grid',
    description: '4-photo grid layout',
    category: 'class-photo',
    thumbnailUrl: 'https://via.placeholder.com/300x400/1976d2/ffffff?text=Classic+Grid',
    layout: [],
  },
  {
    id: '2',
    name: 'Hero Layout',
    description: 'Large featured photo with smaller photos',
    category: 'sports',
    thumbnailUrl: 'https://via.placeholder.com/300x400/2e7d32/ffffff?text=Hero+Layout',
    layout: [],
  },
  {
    id: '3',
    name: 'Mosaic',
    description: 'Creative mixed-size layout',
    category: 'candid',
    thumbnailUrl: 'https://via.placeholder.com/300x400/9c27b0/ffffff?text=Mosaic',
    layout: [],
  },
];

const mockPhotoSubmissions: PhotoSubmission[] = [
  {
    id: 1,
    studentId: 1,
    studentName: 'John Doe',
    photoUrl: 'https://via.placeholder.com/400x400/1976d2/ffffff?text=Photo+1',
    caption: 'Senior Class 2024',
    category: 'class',
    uploadDate: '2024-03-15',
    status: 'pending',
    tags: ['senior', 'class'],
  },
  {
    id: 2,
    studentId: 2,
    studentName: 'Jane Smith',
    photoUrl: 'https://via.placeholder.com/400x400/2e7d32/ffffff?text=Photo+2',
    caption: 'Basketball Championship',
    category: 'sports',
    uploadDate: '2024-03-14',
    status: 'approved',
    tags: ['basketball', 'championship'],
  },
];

const mockMemories: MemorySubmission[] = [
  {
    id: 1,
    studentId: 1,
    studentName: 'Sarah Johnson',
    title: 'Best Day Ever',
    content: 'The day we won the state championship was unforgettable!',
    category: 'favorite-moment',
    submittedDate: '2024-03-10',
    status: 'approved',
    likes: 45,
  },
];

export default function YearbookBuilder() {
  const theme = useTheme();
  const [selectedTab, setSelectedTab] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageElements, setPageElements] = useState<PageElement[]>([]);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [photoSubmissionsOpen, setPhotoSubmissionsOpen] = useState(false);
  const [memorySubmissionsOpen, setMemorySubmissionsOpen] = useState(false);
  const [photoSubmissions, setPhotoSubmissions] = useState(mockPhotoSubmissions);
  const [memorySubmissions] = useState(mockMemories);
  const canvasRef = useRef<HTMLDivElement>(null);

  const textProperties = {
    fontFamily: 'Arial',
    fontSize: 16,
    color: '#000000',
    fontWeight: 'normal' as 'normal' | 'bold',
    fontStyle: 'normal' as 'normal' | 'italic',
    textAlign: 'left' as 'left' | 'center' | 'right',
  };

  const addElement = (type: PageElement['type']) => {
    const newElement: PageElement = {
      id: `element-${Date.now()}`,
      type,
      position: {
        x: 50,
        y: 50,
        width: type === 'photo' ? 200 : 300,
        height: type === 'photo' ? 200 : 100,
      },
      content:
        type === 'text'
          ? 'Double-click to edit'
          : type === 'quote'
            ? 'Add your quote here'
            : undefined,
      imageUrl: type === 'photo' ? 'https://via.placeholder.com/200' : undefined,
      zIndex: pageElements.length,
      style: type === 'text' || type === 'quote' ? textProperties : undefined,
    };
    setPageElements([...pageElements, newElement]);
    setSelectedElement(newElement.id);
  };

  const updateElement = (id: string, updates: Partial<PageElement>) => {
    setPageElements(pageElements.map((el) => (el.id === id ? { ...el, ...updates } : el)));
  };

  const deleteElement = (id: string) => {
    setPageElements(pageElements.filter((el) => el.id !== id));
    if (selectedElement === id) setSelectedElement(null);
  };

  const applyTemplate = (template: YearbookTemplate) => {
    setPageElements(template.layout);
    setTemplateDialogOpen(false);
  };

  const handlePhotoApproval = (photoId: number) => {
    setPhotoSubmissions(
      photoSubmissions.map((photo) =>
        photo.id === photoId ? { ...photo, status: 'approved' as const } : photo
      )
    );
  };

  const handlePhotoReject = (photoId: number) => {
    setPhotoSubmissions(
      photoSubmissions.map((photo) =>
        photo.id === photoId ? { ...photo, status: 'rejected' as const } : photo
      )
    );
  };

  const selectedElementData = pageElements.find((el) => el.id === selectedElement);

  return (
    <Box sx={{ display: 'flex', height: 'calc(100vh - 64px)', overflow: 'hidden' }}>
      <Drawer
        variant="permanent"
        sx={{
          width: 280,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: 280,
            boxSizing: 'border-box',
            position: 'relative',
            border: 'none',
            borderRight: `1px solid ${theme.palette.divider}`,
          },
        }}
      >
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Yearbook Builder
          </Typography>
          <FormControl fullWidth size="small" sx={{ mb: 2 }}>
            <InputLabel>Page</InputLabel>
            <Select
              value={currentPage}
              onChange={(e) => setCurrentPage(e.target.value as number)}
              label="Page"
            >
              {Array.from({ length: 20 }, (_, i) => (
                <MenuItem key={i + 1} value={i + 1}>
                  Page {i + 1}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Tabs
            value={selectedTab}
            onChange={(_, newValue) => setSelectedTab(newValue)}
            variant="fullWidth"
            sx={{ mb: 2 }}
          >
            <Tab label="Elements" />
            <Tab label="Properties" />
          </Tabs>

          {selectedTab === 0 && (
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Add Elements
              </Typography>
              <Stack spacing={1}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<ImageIcon />}
                  onClick={() => addElement('photo')}
                >
                  Add Photo
                </Button>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<TextIcon />}
                  onClick={() => addElement('text')}
                >
                  Add Text
                </Button>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<QuoteIcon />}
                  onClick={() => addElement('quote')}
                >
                  Add Quote
                </Button>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<TemplateIcon />}
                  onClick={() => setTemplateDialogOpen(true)}
                >
                  Templates
                </Button>
              </Stack>

              <Divider sx={{ my: 2 }} />

              <Typography variant="subtitle2" gutterBottom>
                Submissions
              </Typography>
              <Stack spacing={1}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<ImageIcon />}
                  onClick={() => setPhotoSubmissionsOpen(true)}
                  endIcon={
                    <Badge
                      badgeContent={photoSubmissions.filter((p) => p.status === 'pending').length}
                      color="primary"
                    >
                      <span />
                    </Badge>
                  }
                >
                  Photo Submissions
                </Button>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<QuoteIcon />}
                  onClick={() => setMemorySubmissionsOpen(true)}
                  endIcon={
                    <Badge
                      badgeContent={memorySubmissions.filter((m) => m.status === 'pending').length}
                      color="primary"
                    >
                      <span />
                    </Badge>
                  }
                >
                  Memories & Quotes
                </Button>
              </Stack>

              <Divider sx={{ my: 2 }} />

              <Typography variant="subtitle2" gutterBottom>
                Layers
              </Typography>
              <List dense>
                {pageElements.map((element, index) => (
                  <ListItem
                    key={element.id}
                    selected={selectedElement === element.id}
                    onClick={() => setSelectedElement(element.id)}
                    secondaryAction={
                      <IconButton edge="end" size="small" onClick={() => deleteElement(element.id)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    }
                  >
                    <ListItemText
                      primary={`${element.type} ${index + 1}`}
                      secondary={`z-index: ${element.zIndex}`}
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}

          {selectedTab === 1 && selectedElementData && (
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Element Properties
              </Typography>

              {(selectedElementData.type === 'text' || selectedElementData.type === 'quote') && (
                <Stack spacing={2}>
                  <TextField
                    label="Content"
                    multiline
                    rows={3}
                    value={selectedElementData.content || ''}
                    onChange={(e) =>
                      updateElement(selectedElementData.id, { content: e.target.value })
                    }
                    fullWidth
                  />

                  <FormControl fullWidth size="small">
                    <InputLabel>Font Family</InputLabel>
                    <Select
                      value={selectedElementData.style?.fontFamily || 'Arial'}
                      onChange={(e) =>
                        updateElement(selectedElementData.id, {
                          style: { ...selectedElementData.style, fontFamily: e.target.value },
                        })
                      }
                      label="Font Family"
                    >
                      <MenuItem value="Arial">Arial</MenuItem>
                      <MenuItem value="Times New Roman">Times New Roman</MenuItem>
                      <MenuItem value="Georgia">Georgia</MenuItem>
                      <MenuItem value="Courier New">Courier New</MenuItem>
                      <MenuItem value="Verdana">Verdana</MenuItem>
                    </Select>
                  </FormControl>

                  <Box>
                    <Typography variant="caption" gutterBottom>
                      Font Size: {selectedElementData.style?.fontSize || 16}px
                    </Typography>
                    <Slider
                      value={selectedElementData.style?.fontSize || 16}
                      onChange={(_, value) =>
                        updateElement(selectedElementData.id, {
                          style: { ...selectedElementData.style, fontSize: value as number },
                        })
                      }
                      min={8}
                      max={72}
                      valueLabelDisplay="auto"
                    />
                  </Box>

                  <Box>
                    <Typography variant="caption" gutterBottom display="block">
                      Text Color
                    </Typography>
                    <input
                      type="color"
                      value={selectedElementData.style?.color || '#000000'}
                      onChange={(e) =>
                        updateElement(selectedElementData.id, {
                          style: { ...selectedElementData.style, color: e.target.value },
                        })
                      }
                      style={{ width: '100%', height: 40 }}
                    />
                  </Box>

                  <ToggleButtonGroup size="small" exclusive>
                    <ToggleButton
                      value="bold"
                      selected={selectedElementData.style?.fontWeight === 'bold'}
                      onClick={() =>
                        updateElement(selectedElementData.id, {
                          style: {
                            ...selectedElementData.style,
                            fontWeight:
                              selectedElementData.style?.fontWeight === 'bold' ? 'normal' : 'bold',
                          },
                        })
                      }
                    >
                      <FormatBold />
                    </ToggleButton>
                    <ToggleButton
                      value="italic"
                      selected={selectedElementData.style?.fontStyle === 'italic'}
                      onClick={() =>
                        updateElement(selectedElementData.id, {
                          style: {
                            ...selectedElementData.style,
                            fontStyle:
                              selectedElementData.style?.fontStyle === 'italic'
                                ? 'normal'
                                : 'italic',
                          },
                        })
                      }
                    >
                      <FormatItalic />
                    </ToggleButton>
                  </ToggleButtonGroup>

                  <ToggleButtonGroup
                    size="small"
                    value={selectedElementData.style?.textAlign || 'left'}
                    exclusive
                    onChange={(_, value) =>
                      value &&
                      updateElement(selectedElementData.id, {
                        style: { ...selectedElementData.style, textAlign: value },
                      })
                    }
                  >
                    <ToggleButton value="left">
                      <FormatAlignLeft />
                    </ToggleButton>
                    <ToggleButton value="center">
                      <FormatAlignCenter />
                    </ToggleButton>
                    <ToggleButton value="right">
                      <FormatAlignRight />
                    </ToggleButton>
                  </ToggleButtonGroup>
                </Stack>
              )}

              {selectedElementData.type === 'photo' && (
                <Stack spacing={2}>
                  <TextField
                    label="Image URL"
                    value={selectedElementData.imageUrl || ''}
                    onChange={(e) =>
                      updateElement(selectedElementData.id, { imageUrl: e.target.value })
                    }
                    fullWidth
                    size="small"
                  />

                  <Box>
                    <Typography variant="caption" gutterBottom>
                      Rotation: {selectedElementData.rotation || 0}°
                    </Typography>
                    <Slider
                      value={selectedElementData.rotation || 0}
                      onChange={(_, value) =>
                        updateElement(selectedElementData.id, { rotation: value as number })
                      }
                      min={-180}
                      max={180}
                      valueLabelDisplay="auto"
                    />
                  </Box>
                </Stack>
              )}

              <Divider sx={{ my: 2 }} />

              <Typography variant="caption" gutterBottom display="block">
                Position & Size
              </Typography>
              <Grid container spacing={1}>
                <Grid item xs={6}>
                  <TextField
                    label="X"
                    type="number"
                    size="small"
                    value={selectedElementData.position.x}
                    onChange={(e) =>
                      updateElement(selectedElementData.id, {
                        position: { ...selectedElementData.position, x: parseInt(e.target.value) },
                      })
                    }
                    fullWidth
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    label="Y"
                    type="number"
                    size="small"
                    value={selectedElementData.position.y}
                    onChange={(e) =>
                      updateElement(selectedElementData.id, {
                        position: { ...selectedElementData.position, y: parseInt(e.target.value) },
                      })
                    }
                    fullWidth
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    label="Width"
                    type="number"
                    size="small"
                    value={selectedElementData.position.width}
                    onChange={(e) =>
                      updateElement(selectedElementData.id, {
                        position: {
                          ...selectedElementData.position,
                          width: parseInt(e.target.value),
                        },
                      })
                    }
                    fullWidth
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    label="Height"
                    type="number"
                    size="small"
                    value={selectedElementData.position.height}
                    onChange={(e) =>
                      updateElement(selectedElementData.id, {
                        position: {
                          ...selectedElementData.position,
                          height: parseInt(e.target.value),
                        },
                      })
                    }
                    fullWidth
                  />
                </Grid>
              </Grid>
            </Box>
          )}
        </Box>
      </Drawer>

      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <AppBar position="static" color="default" elevation={1}>
          <Toolbar variant="dense">
            <Tooltip title="Undo">
              <IconButton size="small">
                <UndoIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Redo">
              <IconButton size="small">
                <RedoIcon />
              </IconButton>
            </Tooltip>
            <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
            <Tooltip title="Grid">
              <IconButton size="small">
                <GridIcon />
              </IconButton>
            </Tooltip>
            <Box sx={{ flexGrow: 1 }} />
            <Button variant="outlined" size="small" startIcon={<SaveIcon />} sx={{ mr: 1 }}>
              Save Draft
            </Button>
            <Button variant="contained" size="small" startIcon={<SaveIcon />}>
              Publish Page
            </Button>
          </Toolbar>
        </AppBar>

        <Box
          ref={canvasRef}
          sx={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: '#f5f5f5',
            p: 4,
            overflow: 'auto',
          }}
        >
          <Paper
            elevation={3}
            sx={{
              width: 800,
              height: 1000,
              position: 'relative',
              bgcolor: 'white',
              overflow: 'hidden',
            }}
          >
            {pageElements.map((element) => (
              <Box
                key={element.id}
                onClick={() => setSelectedElement(element.id)}
                sx={{
                  position: 'absolute',
                  left: element.position.x,
                  top: element.position.y,
                  width: element.position.width,
                  height: element.position.height,
                  border:
                    selectedElement === element.id
                      ? `2px solid ${theme.palette.primary.main}`
                      : '1px dashed #ccc',
                  cursor: 'move',
                  zIndex: element.zIndex,
                  transform: `rotate(${element.rotation || 0}deg)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundImage:
                    element.type === 'photo' && element.imageUrl
                      ? `url(${element.imageUrl})`
                      : 'none',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  padding: element.type === 'text' || element.type === 'quote' ? 2 : 0,
                }}
              >
                {(element.type === 'text' || element.type === 'quote') && (
                  <Typography
                    sx={{
                      fontFamily: element.style?.fontFamily,
                      fontSize: element.style?.fontSize,
                      color: element.style?.color,
                      fontWeight: element.style?.fontWeight,
                      fontStyle: element.style?.fontStyle,
                      textAlign: element.style?.textAlign,
                      width: '100%',
                    }}
                  >
                    {element.content}
                  </Typography>
                )}
              </Box>
            ))}

            {pageElements.length === 0 && (
              <Box
                sx={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  textAlign: 'center',
                  color: 'text.secondary',
                }}
              >
                <LayoutIcon sx={{ fontSize: 64, mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Start Building Your Page
                </Typography>
                <Typography variant="body2">
                  Add elements from the sidebar or choose a template
                </Typography>
              </Box>
            )}
          </Paper>
        </Box>
      </Box>

      <Dialog
        open={templateDialogOpen}
        onClose={() => setTemplateDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Choose a Template</DialogTitle>
        <DialogContent>
          <Grid container spacing={2}>
            {mockTemplates.map((template) => (
              <Grid item xs={12} sm={6} md={4} key={template.id}>
                <Card
                  sx={{
                    cursor: 'pointer',
                    '&:hover': { boxShadow: theme.shadows[8] },
                  }}
                  onClick={() => applyTemplate(template)}
                >
                  <CardMedia
                    component="img"
                    height="200"
                    image={template.thumbnailUrl}
                    alt={template.name}
                  />
                  <CardContent>
                    <Typography variant="subtitle1" fontWeight={600}>
                      {template.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {template.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTemplateDialogOpen(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={photoSubmissionsOpen}
        onClose={() => setPhotoSubmissionsOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Photo Submissions
          <Typography variant="caption" display="block" color="text.secondary">
            Review and approve student photo submissions
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2}>
            {photoSubmissions.map((photo) => (
              <Grid item xs={12} sm={6} key={photo.id}>
                <Card>
                  <CardMedia
                    component="img"
                    height="200"
                    image={photo.photoUrl}
                    alt={photo.caption}
                  />
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Avatar sx={{ width: 32, height: 32 }}>{photo.studentName[0]}</Avatar>
                      <Typography variant="subtitle2">{photo.studentName}</Typography>
                    </Box>
                    <Typography variant="body2" gutterBottom>
                      {photo.caption}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 0.5, mb: 1 }}>
                      {photo.tags.map((tag) => (
                        <Chip key={tag} label={tag} size="small" />
                      ))}
                    </Box>
                    <Chip
                      label={photo.status}
                      color={
                        photo.status === 'approved'
                          ? 'success'
                          : photo.status === 'rejected'
                            ? 'error'
                            : 'default'
                      }
                      size="small"
                      icon={photo.status === 'approved' ? <CheckIcon /> : <PendingIcon />}
                    />
                  </CardContent>
                  {photo.status === 'pending' && (
                    <Box sx={{ p: 2, pt: 0, display: 'flex', gap: 1 }}>
                      <Button
                        fullWidth
                        variant="contained"
                        color="success"
                        size="small"
                        onClick={() => handlePhotoApproval(photo.id)}
                      >
                        Approve
                      </Button>
                      <Button
                        fullWidth
                        variant="outlined"
                        color="error"
                        size="small"
                        onClick={() => handlePhotoReject(photo.id)}
                      >
                        Reject
                      </Button>
                    </Box>
                  )}
                </Card>
              </Grid>
            ))}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPhotoSubmissionsOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={memorySubmissionsOpen}
        onClose={() => setMemorySubmissionsOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Memory Submissions</DialogTitle>
        <DialogContent>
          <Stack spacing={2}>
            {memorySubmissions.map((memory) => (
              <Card key={memory.id}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Avatar>{memory.studentName[0]}</Avatar>
                      <Box>
                        <Typography variant="subtitle1" fontWeight={600}>
                          {memory.title}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          by {memory.studentName}
                        </Typography>
                      </Box>
                    </Box>
                    <Chip label={memory.category} size="small" color="primary" variant="outlined" />
                  </Box>
                  <Typography variant="body2" paragraph>
                    {memory.content}
                  </Typography>
                  <Box
                    sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                  >
                    <Typography variant="caption" color="text.secondary">
                      {memory.likes} likes
                    </Typography>
                    <Chip
                      label={memory.status}
                      color={memory.status === 'approved' ? 'success' : 'default'}
                      size="small"
                    />
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMemorySubmissionsOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
