import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  CircularProgress,
  Alert,
  Paper,
  Tabs,
  Tab,
  Avatar,
  Chip,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  useTheme,
  alpha,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Divider,
  IconButton,
} from '@mui/material';
import {
  AccountBalanceWallet as WalletIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  EmojiEvents as TrophyIcon,
  Star as StarIcon,
  LocalFireDepartment as FireIcon,
  MonetizationOn as CoinIcon,
  Download as DownloadIcon,
  Upload as UploadIcon,
  CardGiftcard as BonusIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import {
  contentMarketplaceApi,
  CreditBalance,
  CreditTransaction,
  LeaderboardEntry,
} from '@/api/contentMarketplace';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index } = props;
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <Box sx={{ mt: 3 }}>{children}</Box>}
    </div>
  );
}

export default function ContentCreditsEconomy() {
  const theme = useTheme();
  const [currentTab, setCurrentTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creditBalance, setCreditBalance] = useState<CreditBalance | null>(null);
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [balance, txns, leaders] = await Promise.all([
        contentMarketplaceApi.getCreditBalance(),
        contentMarketplaceApi.getCreditTransactions(50),
        contentMarketplaceApi.getLeaderboard(50),
      ]);
      setCreditBalance(balance);
      setTransactions(txns);
      setLeaderboard(leaders);
      setError(null);
    } catch (err) {
      setError('Failed to load credit data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'earned':
        return <TrendingUpIcon sx={{ color: 'success.main' }} />;
      case 'spent':
        return <TrendingDownIcon sx={{ color: 'error.main' }} />;
      case 'bonus':
        return <BonusIcon sx={{ color: 'warning.main' }} />;
      default:
        return <CoinIcon />;
    }
  };

  const getRankColor = (rank: number) => {
    if (rank === 1) return theme.palette.warning.main;
    if (rank === 2) return alpha(theme.palette.warning.main, 0.7);
    if (rank === 3) return alpha(theme.palette.warning.main, 0.5);
    return theme.palette.text.secondary;
  };

  const getRankIcon = (rank: number) => {
    if (rank <= 3) {
      return <TrophyIcon sx={{ color: getRankColor(rank), fontSize: 32 }} />;
    }
    return null;
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Credits Economy
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Earn credits by creating content and redeem them for purchases
          </Typography>
        </Box>
        <IconButton onClick={loadData}>
          <RefreshIcon />
        </IconButton>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {creditBalance && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={3}>
            <Card
              elevation={0}
              sx={{
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                color: 'white',
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <WalletIcon sx={{ fontSize: 32 }} />
                  <Typography variant="h6" fontWeight={700}>
                    Total Balance
                  </Typography>
                </Box>
                <Typography variant="h3" fontWeight={700}>
                  {creditBalance.total_credits.toLocaleString()}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9, mt: 1 }}>
                  Credits Available
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={3}>
            <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}` }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <TrendingUpIcon sx={{ fontSize: 32, color: 'success.main' }} />
                  <Typography variant="h6" fontWeight={700}>
                    Earned
                  </Typography>
                </Box>
                <Typography variant="h4" fontWeight={700} color="success.main">
                  {creditBalance.earned_credits.toLocaleString()}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  From Content Sales
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={3}>
            <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}` }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <TrendingDownIcon sx={{ fontSize: 32, color: 'error.main' }} />
                  <Typography variant="h6" fontWeight={700}>
                    Spent
                  </Typography>
                </Box>
                <Typography variant="h4" fontWeight={700} color="error.main">
                  {creditBalance.spent_credits.toLocaleString()}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  On Purchases
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={3}>
            <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}` }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <BonusIcon sx={{ fontSize: 32, color: 'warning.main' }} />
                  <Typography variant="h6" fontWeight={700}>
                    Bonus
                  </Typography>
                </Box>
                <Typography variant="h4" fontWeight={700} color="warning.main">
                  {creditBalance.bonus_credits.toLocaleString()}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Reward Credits
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={currentTab} onChange={(_e, v) => setCurrentTab(v)}>
          <Tab label="Transactions" />
          <Tab label="Leaderboard" />
          <Tab label="How It Works" />
        </Tabs>
      </Box>

      <TabPanel value={currentTab} index={0}>
        <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}` }}>
          <CardContent>
            <Typography variant="h6" fontWeight={700} gutterBottom>
              Recent Transactions
            </Typography>
            <List>
              {transactions.map((txn) => (
                <ListItem key={txn.id} divider>
                  <ListItemAvatar>
                    <Avatar
                      sx={{
                        bgcolor:
                          txn.type === 'earned'
                            ? alpha(theme.palette.success.main, 0.1)
                            : txn.type === 'spent'
                              ? alpha(theme.palette.error.main, 0.1)
                              : alpha(theme.palette.warning.main, 0.1),
                      }}
                    >
                      {getTransactionIcon(txn.type)}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={txn.description}
                    secondary={
                      <>
                        {new Date(txn.created_at).toLocaleString()}
                        {txn.content_title && (
                          <>
                            {' • '}
                            {txn.content_title}
                          </>
                        )}
                      </>
                    }
                  />
                  <Typography
                    variant="h6"
                    fontWeight={700}
                    color={
                      txn.type === 'earned' || txn.type === 'bonus' ? 'success.main' : 'error.main'
                    }
                  >
                    {txn.type === 'spent' ? '-' : '+'}
                    {txn.amount}
                  </Typography>
                </ListItem>
              ))}
              {transactions.length === 0 && (
                <Box sx={{ textAlign: 'center', py: 6 }}>
                  <CoinIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    No transactions yet
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Start creating or purchasing content to see your transaction history
                  </Typography>
                </Box>
              )}
            </List>
          </CardContent>
        </Card>
      </TabPanel>

      <TabPanel value={currentTab} index={1}>
        <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}` }}>
          <CardContent>
            <Box
              sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}
            >
              <Typography variant="h6" fontWeight={700}>
                Top Content Creators
              </Typography>
              <Chip
                label="This Month"
                icon={<FireIcon />}
                color="warning"
                sx={{ fontWeight: 600 }}
              />
            </Box>

            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Rank</TableCell>
                    <TableCell>Creator</TableCell>
                    <TableCell align="right">Content</TableCell>
                    <TableCell align="right">Sales</TableCell>
                    <TableCell align="right">Credits Earned</TableCell>
                    <TableCell align="right">Rating</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {leaderboard.map((entry) => (
                    <TableRow key={entry.user_id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {getRankIcon(entry.rank)}
                          <Typography
                            variant="h6"
                            fontWeight={700}
                            color={getRankColor(entry.rank)}
                          >
                            #{entry.rank}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar src={entry.user_photo_url}>{entry.user_name.charAt(0)}</Avatar>
                          <Box>
                            <Typography variant="body2" fontWeight={600}>
                              {entry.user_name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {entry.grade}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell align="right">
                        <Chip label={entry.total_content} size="small" variant="outlined" />
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight={600}>
                          {entry.total_sales.toLocaleString()}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'flex-end',
                            gap: 0.5,
                          }}
                        >
                          <CoinIcon sx={{ fontSize: 16, color: 'warning.main' }} />
                          <Typography variant="body2" fontWeight={700} color="warning.main">
                            {entry.credits_earned.toLocaleString()}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="right">
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'flex-end',
                            gap: 0.5,
                          }}
                        >
                          <StarIcon sx={{ fontSize: 16, color: 'warning.main' }} />
                          <Typography variant="body2" fontWeight={600}>
                            {entry.average_rating.toFixed(1)}
                          </Typography>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                  {leaderboard.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                        <TrophyIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                        <Typography variant="h6" color="text.secondary" gutterBottom>
                          Leaderboard coming soon
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Start creating content to compete for the top spot!
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </TabPanel>

      <TabPanel value={currentTab} index={2}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card
              elevation={0}
              sx={{ border: `1px solid ${theme.palette.divider}`, height: '100%' }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                  <Avatar
                    sx={{ bgcolor: alpha(theme.palette.success.main, 0.1), width: 56, height: 56 }}
                  >
                    <UploadIcon sx={{ fontSize: 32, color: 'success.main' }} />
                  </Avatar>
                  <Typography variant="h5" fontWeight={700}>
                    Earn Credits
                  </Typography>
                </Box>
                <Typography variant="body1" paragraph>
                  Create high-quality educational content and earn credits when other students
                  purchase your materials.
                </Typography>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                  Ways to Earn:
                </Typography>
                <List dense>
                  <ListItem>
                    <ListItemText primary="• Create and sell study materials" />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="• Get high ratings and reviews" />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="• Achieve top rankings on the leaderboard" />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="• Receive bonus credits for popular content" />
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card
              elevation={0}
              sx={{ border: `1px solid ${theme.palette.divider}`, height: '100%' }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                  <Avatar
                    sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), width: 56, height: 56 }}
                  >
                    <DownloadIcon sx={{ fontSize: 32, color: 'primary.main' }} />
                  </Avatar>
                  <Typography variant="h5" fontWeight={700}>
                    Redeem Credits
                  </Typography>
                </Box>
                <Typography variant="body1" paragraph>
                  Use your earned credits to purchase study materials created by other students or
                  unlock premium platform features.
                </Typography>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                  Redeem For:
                </Typography>
                <List dense>
                  <ListItem>
                    <ListItemText primary="• Purchase study materials from other creators" />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="• Unlock premium content and resources" />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="• Access exclusive platform features" />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="• Get priority support and assistance" />
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                background: `linear-gradient(135deg, ${alpha(theme.palette.warning.main, 0.1)} 0%, ${alpha(theme.palette.primary.main, 0.1)} 100%)`,
                border: `1px solid ${theme.palette.divider}`,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <TrophyIcon sx={{ fontSize: 40, color: 'warning.main' }} />
                <Typography variant="h5" fontWeight={700}>
                  Compete on the Leaderboard
                </Typography>
              </Box>
              <Typography variant="body1" paragraph>
                Climb the ranks by creating popular content with high ratings. Top creators receive
                bonus credits, recognition badges, and exclusive perks!
              </Typography>
              <Button
                variant="contained"
                startIcon={<UploadIcon />}
                href="/student/content-creator-studio"
              >
                Start Creating Content
              </Button>
            </Paper>
          </Grid>
        </Grid>
      </TabPanel>
    </Box>
  );
}
