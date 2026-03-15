import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Button,
  CircularProgress,
  Alert,
  Chip,
  Rating,
  IconButton,
  useTheme,
  alpha,
  TextField,
  InputAdornment,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Download as DownloadIcon,
  Visibility as VisibilityIcon,
  MoreVert as MoreIcon,
  Search as SearchIcon,
  Folder as FolderIcon,
  AccessTime as TimeIcon,
  FileDownload as FileDownloadIcon,
} from '@mui/icons-material';
import { contentMarketplaceApi, PurchasedContent } from '@/api/contentMarketplace';

interface PurchasedContentCardProps {
  purchase: PurchasedContent;
  onDownload: (purchase: PurchasedContent) => void;
  onView: (purchase: PurchasedContent) => void;
}

function PurchasedContentCard({ purchase, onDownload, onView }: PurchasedContentCardProps) {
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  return (
    <Card
      elevation={0}
      sx={{
        height: '100%',
        border: `1px solid ${theme.palette.divider}`,
        transition: 'all 0.3s',
        '&:hover': {
          boxShadow: theme.shadows[4],
        },
      }}
    >
      <Box sx={{ position: 'relative' }}>
        {purchase.content.thumbnail_url ? (
          <CardMedia
            component="img"
            height="160"
            image={purchase.content.thumbnail_url}
            alt={purchase.content.title}
          />
        ) : (
          <Box
            sx={{
              height: 160,
              bgcolor: alpha(theme.palette.primary.main, 0.1),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <FolderIcon sx={{ fontSize: 64, color: 'text.secondary' }} />
          </Box>
        )}
        <Chip
          label={purchase.content.content_type.toUpperCase()}
          size="small"
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            bgcolor: alpha('#000', 0.7),
            color: 'white',
            fontWeight: 600,
          }}
        />
      </Box>
      <CardContent>
        <Box
          sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}
        >
          <Typography variant="h6" fontWeight={700} sx={{ flex: 1 }} noWrap>
            {purchase.content.title}
          </Typography>
          <IconButton size="small" onClick={(e) => setAnchorEl(e.currentTarget)}>
            <MoreIcon />
          </IconButton>
          <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
            <MenuItem
              onClick={() => {
                onView(purchase);
                setAnchorEl(null);
              }}
            >
              <ListItemIcon>
                <VisibilityIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>View Details</ListItemText>
            </MenuItem>
            <MenuItem
              onClick={() => {
                onDownload(purchase);
                setAnchorEl(null);
              }}
            >
              <ListItemIcon>
                <FileDownloadIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Download</ListItemText>
            </MenuItem>
          </Menu>
        </Box>

        <Box sx={{ mb: 2 }}>
          <Chip label={purchase.content.subject} size="small" variant="outlined" sx={{ mr: 0.5 }} />
          <Chip label={purchase.content.grade} size="small" variant="outlined" />
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <Rating value={purchase.content.rating} precision={0.1} size="small" readOnly />
          <Typography variant="body2" fontWeight={600}>
            {purchase.content.rating.toFixed(1)}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <TimeIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
            <Typography variant="caption" color="text.secondary">
              Purchased {new Date(purchase.purchased_at).toLocaleDateString()}
            </Typography>
          </Box>
          <Typography variant="caption" color="text.secondary">
            {purchase.download_count} downloads
          </Typography>
        </Box>

        <Button
          variant="contained"
          fullWidth
          startIcon={<DownloadIcon />}
          onClick={() => onDownload(purchase)}
        >
          Download
        </Button>
      </CardContent>
    </Card>
  );
}

export default function MyContentPurchases() {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [purchases, setPurchases] = useState<PurchasedContent[]>([]);
  const [filteredPurchases, setFilteredPurchases] = useState<PurchasedContent[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadPurchases();
  }, []);

  useEffect(() => {
    applyFilters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [purchases, searchQuery]);

  const loadPurchases = async () => {
    try {
      setLoading(true);
      const data = await contentMarketplaceApi.getMyPurchases();
      setPurchases(data);
      setError(null);
    } catch (err) {
      setError('Failed to load purchases');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = purchases;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.content.title.toLowerCase().includes(query) ||
          p.content.subject.toLowerCase().includes(query) ||
          p.content.topic.toLowerCase().includes(query)
      );
    }

    setFilteredPurchases(filtered);
  };

  const handleDownload = async (purchase: PurchasedContent) => {
    try {
      const blob = await contentMarketplaceApi.downloadContent(purchase.content.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = purchase.content.title;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Failed to download content:', err);
    }
  };

  const handleView = (purchase: PurchasedContent) => {
    window.open(`/student/content-marketplace/${purchase.content.id}`, '_blank');
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          My Purchased Content
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Access and download all your purchased study materials
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Search your purchases..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      <Box sx={{ mb: 2 }}>
        <Typography variant="body2" color="text.secondary">
          {filteredPurchases.length} item{filteredPurchases.length !== 1 ? 's' : ''} in your library
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {filteredPurchases.map((purchase) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={purchase.id}>
            <PurchasedContentCard
              purchase={purchase}
              onDownload={handleDownload}
              onView={handleView}
            />
          </Grid>
        ))}
        {filteredPurchases.length === 0 && (
          <Grid item xs={12}>
            <Box
              sx={{
                textAlign: 'center',
                py: 8,
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 2,
              }}
            >
              <FolderIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No purchases yet
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Browse the marketplace to find helpful study materials
              </Typography>
              <Button variant="contained" href="/student/content-marketplace">
                Browse Content
              </Button>
            </Box>
          </Grid>
        )}
      </Grid>
    </Box>
  );
}
