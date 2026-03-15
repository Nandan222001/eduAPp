import { useState, useRef } from 'react';
import {
  Box,
  Typography,
  Container,
  Grid,
  Paper,
  Card,
  CardContent,
  Button,
  TextField,
  IconButton,
  Avatar,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  Chip,
  InputAdornment,
  Divider,
  ToggleButtonGroup,
  ToggleButton,
  useTheme,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  FormControlLabel,
  Switch,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Create as CreateIcon,
  Keyboard as KeyboardIcon,
  EmojiEmotions as EmojiIcon,
  Gif as GifIcon,
  Send as SendIcon,
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
  Close as CloseIcon,
  Download as DownloadIcon,
  Share as ShareIcon,
} from '@mui/icons-material';
import { YearbookSignature } from '@/types/yearbook';

const mockSignatures: YearbookSignature[] = [
  {
    id: 1,
    fromStudentId: 2,
    fromStudentName: 'Sarah Johnson',
    fromStudentAvatar: '',
    toStudentId: 1,
    message: 'Best friends forever! Remember our crazy adventures in chemistry lab? 😄',
    signatureType: 'typed',
    timestamp: '2024-05-15T10:30:00',
    isPublic: true,
  },
  {
    id: 2,
    fromStudentId: 3,
    fromStudentName: 'Mike Chen',
    toStudentId: 1,
    message: "You're an awesome teammate! Good luck at college!",
    signatureType: 'handwritten',
    signatureData: 'data:image/png;base64,handwritten-signature-data',
    timestamp: '2024-05-14T14:20:00',
    isPublic: true,
  },
  {
    id: 3,
    fromStudentId: 4,
    fromStudentName: 'Emma Davis',
    toStudentId: 1,
    message: 'Thanks for being such a great friend! Stay awesome!',
    signatureType: 'sticker',
    stickers: ['🌟', '💫', '🎓', '🎉'],
    timestamp: '2024-05-13T09:15:00',
    isPublic: true,
  },
];

const popularStickers = [
  '❤️',
  '😊',
  '🎓',
  '🎉',
  '🌟',
  '💫',
  '🏆',
  '📚',
  '✨',
  '🎨',
  '🎵',
  '⚡',
  '🌈',
  '🔥',
  '💪',
  '👏',
];

const popularGifs = [
  'https://media.giphy.com/media/3o6Zt481isNVuQI1l6/giphy.gif',
  'https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif',
  'https://media.giphy.com/media/3o7abKhOpu0NwenH3O/giphy.gif',
];

export default function YearbookSignatures() {
  const theme = useTheme();
  const [signatures, setSignatures] = useState<YearbookSignature[]>(mockSignatures);
  const [selectedTab, setSelectedTab] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [signDialogOpen, setSignDialogOpen] = useState(false);
  const [signatureType, setSignatureType] = useState<'handwritten' | 'typed' | 'sticker' | 'gif'>(
    'typed'
  );
  const [message, setMessage] = useState('');
  const [selectedStickers, setSelectedStickers] = useState<string[]>([]);
  const [selectedGif, setSelectedGif] = useState<string>('');
  const [isDrawing, setIsDrawing] = useState(false);
  const [isPublic, setIsPublic] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const filteredSignatures = signatures.filter(
    (sig) =>
      sig.fromStudentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sig.message.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const favoriteSignatures = filteredSignatures.filter((_, index) => index % 3 === 0);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const handleStickerToggle = (sticker: string) => {
    setSelectedStickers((prev) =>
      prev.includes(sticker) ? prev.filter((s) => s !== sticker) : [...prev, sticker]
    );
  };

  const handleSubmitSignature = () => {
    let signatureData: string | undefined;

    if (signatureType === 'handwritten' && canvasRef.current) {
      signatureData = canvasRef.current.toDataURL();
    }

    const newSignature: YearbookSignature = {
      id: signatures.length + 1,
      fromStudentId: 999,
      fromStudentName: 'You',
      toStudentId: 1,
      message,
      signatureType,
      signatureData: signatureType === 'handwritten' ? signatureData : undefined,
      stickers: signatureType === 'sticker' ? selectedStickers : undefined,
      gifUrl: signatureType === 'gif' ? selectedGif : undefined,
      timestamp: new Date().toISOString(),
      isPublic,
    };

    setSignatures([newSignature, ...signatures]);
    setSignDialogOpen(false);
    resetSignatureForm();
  };

  const resetSignatureForm = () => {
    setMessage('');
    setSelectedStickers([]);
    setSelectedGif('');
    clearCanvas();
    setSignatureType('typed');
    setIsPublic(true);
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom fontWeight={700}>
          My Signature Book
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Collect memories and messages from your classmates
        </Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, mb: 3 }}>
            <Box sx={{ p: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
              <TextField
                fullWidth
                placeholder="Search signatures by name or message..."
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
              <IconButton>
                <FilterIcon />
              </IconButton>
            </Box>

            <Tabs
              value={selectedTab}
              onChange={(_, newValue) => setSelectedTab(newValue)}
              sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}
            >
              <Tab label={`All (${signatures.length})`} />
              <Tab label={`Favorites (${favoriteSignatures.length})`} />
            </Tabs>
          </Paper>

          <Stack spacing={2}>
            {(selectedTab === 0 ? filteredSignatures : favoriteSignatures).map((signature) => (
              <Card
                key={signature.id}
                elevation={0}
                sx={{ border: `1px solid ${theme.palette.divider}` }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar src={signature.fromStudentAvatar} sx={{ width: 48, height: 48 }}>
                        {signature.fromStudentName[0]}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle1" fontWeight={600}>
                          {signature.fromStudentName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(signature.timestamp).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </Typography>
                      </Box>
                    </Box>
                    <Box>
                      <IconButton size="small">
                        {Math.random() > 0.5 ? (
                          <FavoriteIcon color="error" />
                        ) : (
                          <FavoriteBorderIcon />
                        )}
                      </IconButton>
                      <IconButton size="small">
                        <ShareIcon />
                      </IconButton>
                    </Box>
                  </Box>

                  {signature.signatureType === 'typed' && (
                    <Typography variant="body1" sx={{ mb: 2 }}>
                      {signature.message}
                    </Typography>
                  )}

                  {signature.signatureType === 'handwritten' && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        {signature.message}
                      </Typography>
                      <Box
                        component="img"
                        src={signature.signatureData}
                        alt="Signature"
                        sx={{
                          maxWidth: '100%',
                          height: 'auto',
                          border: `1px solid ${theme.palette.divider}`,
                          borderRadius: 1,
                          mt: 1,
                        }}
                      />
                    </Box>
                  )}

                  {signature.signatureType === 'sticker' && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" gutterBottom>
                        {signature.message}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                        {signature.stickers?.map((sticker, index) => (
                          <Typography key={index} sx={{ fontSize: 32 }}>
                            {sticker}
                          </Typography>
                        ))}
                      </Box>
                    </Box>
                  )}

                  {signature.signatureType === 'gif' && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" gutterBottom>
                        {signature.message}
                      </Typography>
                      <Box
                        component="img"
                        src={signature.gifUrl}
                        alt="GIF"
                        sx={{
                          maxWidth: 300,
                          borderRadius: 1,
                          mt: 1,
                        }}
                      />
                    </Box>
                  )}

                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Chip
                      label={signature.signatureType}
                      size="small"
                      variant="outlined"
                      color="primary"
                    />
                    {signature.isPublic && <Chip label="Public" size="small" variant="outlined" />}
                  </Box>
                </CardContent>
              </Card>
            ))}

            {filteredSignatures.length === 0 && (
              <Paper
                elevation={0}
                sx={{
                  border: `1px solid ${theme.palette.divider}`,
                  p: 6,
                  textAlign: 'center',
                }}
              >
                <Typography variant="h6" color="text.secondary">
                  No signatures yet
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Invite your friends to sign your yearbook!
                </Typography>
              </Paper>
            )}
          </Stack>
        </Grid>

        <Grid item xs={12} md={4}>
          <Stack spacing={2}>
            <Button
              fullWidth
              variant="contained"
              size="large"
              startIcon={<AddIcon />}
              onClick={() => setSignDialogOpen(true)}
            >
              Sign Someone&apos;s Yearbook
            </Button>

            <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}` }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Statistics
                </Typography>
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Total Signatures
                    </Typography>
                    <Typography variant="h4" fontWeight={700}>
                      {signatures.length}
                    </Typography>
                  </Box>
                  <Divider />
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Favorites
                    </Typography>
                    <Typography variant="h4" fontWeight={700}>
                      {favoriteSignatures.length}
                    </Typography>
                  </Box>
                  <Divider />
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      This Week
                    </Typography>
                    <Typography variant="h4" fontWeight={700}>
                      {Math.floor(signatures.length / 2)}
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>

            <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}` }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Recent Signers
                </Typography>
                <List dense>
                  {signatures.slice(0, 5).map((sig) => (
                    <ListItem key={sig.id} disablePadding>
                      <ListItemAvatar>
                        <Avatar sx={{ width: 32, height: 32 }}>{sig.fromStudentName[0]}</Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={sig.fromStudentName}
                        secondary={new Date(sig.timestamp).toLocaleDateString()}
                      />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>

            <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}` }}>
              <CardContent>
                <Typography variant="subtitle2" gutterBottom>
                  Quick Actions
                </Typography>
                <Stack spacing={1}>
                  <Button variant="outlined" size="small" startIcon={<DownloadIcon />} fullWidth>
                    Download All
                  </Button>
                  <Button variant="outlined" size="small" startIcon={<ShareIcon />} fullWidth>
                    Share Book
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          </Stack>
        </Grid>
      </Grid>

      <Dialog
        open={signDialogOpen}
        onClose={() => setSignDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Sign a Yearbook
          <IconButton
            onClick={() => setSignDialogOpen(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3}>
            <TextField
              label="Search classmate"
              fullWidth
              placeholder="Type name to find..."
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />

            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Signature Type
              </Typography>
              <ToggleButtonGroup
                value={signatureType}
                exclusive
                onChange={(_, value) => value && setSignatureType(value)}
                fullWidth
              >
                <ToggleButton value="typed">
                  <KeyboardIcon sx={{ mr: 1 }} />
                  Typed
                </ToggleButton>
                <ToggleButton value="handwritten">
                  <CreateIcon sx={{ mr: 1 }} />
                  Draw
                </ToggleButton>
                <ToggleButton value="sticker">
                  <EmojiIcon sx={{ mr: 1 }} />
                  Stickers
                </ToggleButton>
                <ToggleButton value="gif">
                  <GifIcon sx={{ mr: 1 }} />
                  GIF
                </ToggleButton>
              </ToggleButtonGroup>
            </Box>

            {signatureType === 'typed' && (
              <TextField
                label="Your Message"
                multiline
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Write a meaningful message to your classmate..."
                fullWidth
              />
            )}

            {signatureType === 'handwritten' && (
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="subtitle2">Draw Your Signature</Typography>
                  <Button size="small" onClick={clearCanvas}>
                    Clear
                  </Button>
                </Box>
                <canvas
                  ref={canvasRef}
                  width={600}
                  height={200}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  style={{
                    border: `2px solid ${theme.palette.divider}`,
                    borderRadius: 8,
                    cursor: 'crosshair',
                    width: '100%',
                  }}
                />
                <TextField
                  label="Message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Add a text message too..."
                  fullWidth
                  sx={{ mt: 2 }}
                />
              </Box>
            )}

            {signatureType === 'sticker' && (
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Select Stickers
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                  {popularStickers.map((sticker) => (
                    <IconButton
                      key={sticker}
                      onClick={() => handleStickerToggle(sticker)}
                      sx={{
                        fontSize: 32,
                        border: selectedStickers.includes(sticker)
                          ? `2px solid ${theme.palette.primary.main}`
                          : '2px solid transparent',
                        borderRadius: 1,
                      }}
                    >
                      {sticker}
                    </IconButton>
                  ))}
                </Box>
                <TextField
                  label="Message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Add a message with your stickers..."
                  fullWidth
                  multiline
                  rows={3}
                />
              </Box>
            )}

            {signatureType === 'gif' && (
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Choose a GIF
                </Typography>
                <Grid container spacing={2} sx={{ mb: 2 }}>
                  {popularGifs.map((gif, index) => (
                    <Grid item xs={4} key={index}>
                      <Box
                        component="img"
                        src={gif}
                        alt={`GIF ${index + 1}`}
                        onClick={() => setSelectedGif(gif)}
                        sx={{
                          width: '100%',
                          borderRadius: 1,
                          cursor: 'pointer',
                          border:
                            selectedGif === gif
                              ? `3px solid ${theme.palette.primary.main}`
                              : 'none',
                        }}
                      />
                    </Grid>
                  ))}
                </Grid>
                <TextField
                  label="Message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Add a message with your GIF..."
                  fullWidth
                  multiline
                  rows={2}
                />
              </Box>
            )}

            <FormControlLabel
              control={
                <Switch checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} />
              }
              label="Make this signature public"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSignDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            startIcon={<SendIcon />}
            onClick={handleSubmitSignature}
            disabled={!message && signatureType !== 'handwritten'}
          >
            Send Signature
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
