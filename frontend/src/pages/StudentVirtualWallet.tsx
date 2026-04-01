import { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  LinearProgress,
  Avatar,
  alpha,
  useTheme,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Paper,
  Stack,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  AccountBalance as AccountBalanceIcon,
  Savings as SavingsIcon,
  ShoppingCart as ShoppingIcon,
  Restaurant as RestaurantIcon,
  DirectionsBus as TransportIcon,
  Theaters as EntertainmentIcon,
  School as EducationIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  ShowChart as ChartIcon,
  EmojiEvents as TrophyIcon,
  Star as StarIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
} from '@mui/icons-material';
import { Doughnut, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  ArcElement,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface Transaction {
  id: number;
  date: string;
  description: string;
  category: string;
  amount: number;
  type: 'income' | 'expense';
}

interface SavingsGoal {
  id: number;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
  icon: React.ReactNode;
  color: string;
}

interface Stock {
  id: number;
  symbol: string;
  name: string;
  shares: number;
  purchasePrice: number;
  currentPrice: number;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel({ children, value, index }: TabPanelProps) {
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

export default function StudentVirtualWallet() {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState(0);
  const [transactionDialogOpen, setTransactionDialogOpen] = useState(false);
  const [stockDialogOpen, setStockDialogOpen] = useState(false);
  const [_goalDialogOpen, setGoalDialogOpen] = useState(false);

  const [balance] = useState(2450.75);
  const [monthlyIncome] = useState(500);
  const [monthlyExpenses] = useState(325);

  const [transactions] = useState<Transaction[]>([
    {
      id: 1,
      date: '2024-01-15',
      description: 'Weekly Allowance',
      category: 'Income',
      amount: 50,
      type: 'income',
    },
    {
      id: 2,
      date: '2024-01-14',
      description: 'Movie Tickets',
      category: 'Entertainment',
      amount: -25,
      type: 'expense',
    },
    {
      id: 3,
      date: '2024-01-13',
      description: 'Lunch',
      category: 'Food',
      amount: -12,
      type: 'expense',
    },
    {
      id: 4,
      date: '2024-01-12',
      description: 'Bus Pass',
      category: 'Transportation',
      amount: -30,
      type: 'expense',
    },
    {
      id: 5,
      date: '2024-01-11',
      description: 'Book Purchase',
      category: 'Education',
      amount: -18,
      type: 'expense',
    },
    {
      id: 6,
      date: '2024-01-10',
      description: 'Part-time Job',
      category: 'Income',
      amount: 120,
      type: 'income',
    },
    {
      id: 7,
      date: '2024-01-09',
      description: 'Snacks',
      category: 'Food',
      amount: -8,
      type: 'expense',
    },
    {
      id: 8,
      date: '2024-01-08',
      description: 'Weekly Allowance',
      category: 'Income',
      amount: 50,
      type: 'income',
    },
  ]);

  const [savingsGoals] = useState<SavingsGoal[]>([
    {
      id: 1,
      name: 'New Laptop',
      targetAmount: 1200,
      currentAmount: 750,
      deadline: '2024-06-30',
      icon: <EducationIcon />,
      color: theme.palette.primary.main,
    },
    {
      id: 2,
      name: 'Summer Trip',
      targetAmount: 500,
      currentAmount: 320,
      deadline: '2024-07-15',
      icon: <TrophyIcon />,
      color: theme.palette.warning.main,
    },
    {
      id: 3,
      name: 'Emergency Fund',
      targetAmount: 300,
      currentAmount: 180,
      deadline: '2024-12-31',
      icon: <SavingsIcon />,
      color: theme.palette.success.main,
    },
  ]);

  const [portfolio] = useState<Stock[]>([
    { id: 1, symbol: 'AAPL', name: 'Apple Inc.', shares: 5, purchasePrice: 150, currentPrice: 175 },
    {
      id: 2,
      symbol: 'GOOGL',
      name: 'Alphabet Inc.',
      shares: 3,
      purchasePrice: 120,
      currentPrice: 140,
    },
    {
      id: 3,
      symbol: 'MSFT',
      name: 'Microsoft Corp.',
      shares: 4,
      purchasePrice: 300,
      currentPrice: 350,
    },
  ]);

  const categorySpending = {
    Food: 145,
    Transportation: 80,
    Entertainment: 60,
    Education: 40,
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Food':
        return <RestaurantIcon />;
      case 'Transportation':
        return <TransportIcon />;
      case 'Entertainment':
        return <EntertainmentIcon />;
      case 'Education':
        return <EducationIcon />;
      case 'Shopping':
        return <ShoppingIcon />;
      default:
        return <ShoppingIcon />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Food':
        return theme.palette.success.main;
      case 'Transportation':
        return theme.palette.warning.main;
      case 'Entertainment':
        return theme.palette.secondary.main;
      case 'Education':
        return theme.palette.primary.main;
      case 'Shopping':
        return theme.palette.info.main;
      default:
        return theme.palette.grey[500];
    }
  };

  const doughnutData = {
    labels: Object.keys(categorySpending),
    datasets: [
      {
        data: Object.values(categorySpending),
        backgroundColor: [
          alpha(theme.palette.success.main, 0.8),
          alpha(theme.palette.warning.main, 0.8),
          alpha(theme.palette.secondary.main, 0.8),
          alpha(theme.palette.primary.main, 0.8),
        ],
        borderWidth: 0,
      },
    ],
  };

  const portfolioValue = portfolio.reduce(
    (sum, stock) => sum + stock.shares * stock.currentPrice,
    0
  );
  const portfolioCost = portfolio.reduce(
    (sum, stock) => sum + stock.shares * stock.purchasePrice,
    0
  );
  const portfolioGain = portfolioValue - portfolioCost;
  const portfolioGainPercent = (portfolioGain / portfolioCost) * 100;

  const lineChartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Portfolio Value',
        data: [2000, 2100, 2050, 2200, 2300, portfolioValue],
        borderColor: theme.palette.primary.main,
        backgroundColor: alpha(theme.palette.primary.main, 0.1),
        tension: 0.4,
      },
    ],
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Virtual Wallet
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage your virtual finances and practice real-world money skills
        </Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card
            sx={{
              background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
              color: 'white',
            }}
          >
            <CardContent>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  mb: 2,
                }}
              >
                <Typography variant="h6" sx={{ opacity: 0.9 }}>
                  Account Balance
                </Typography>
                <AccountBalanceIcon sx={{ fontSize: 40, opacity: 0.7 }} />
              </Box>
              <Typography variant="h3" fontWeight={700}>
                ${balance.toFixed(2)}
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
                <Box>
                  <Typography variant="caption" sx={{ opacity: 0.8 }}>
                    Monthly Income
                  </Typography>
                  <Typography variant="h6" fontWeight={600}>
                    +${monthlyIncome}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ opacity: 0.8 }}>
                    Monthly Expenses
                  </Typography>
                  <Typography variant="h6" fontWeight={600}>
                    -${monthlyExpenses}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  mb: 2,
                }}
              >
                <Typography variant="h6">Portfolio Value</Typography>
                <ChartIcon color="primary" sx={{ fontSize: 40 }} />
              </Box>
              <Typography variant="h3" fontWeight={700} color="primary.main">
                ${portfolioValue.toFixed(2)}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2 }}>
                {portfolioGain >= 0 ? (
                  <ArrowUpwardIcon color="success" />
                ) : (
                  <ArrowDownwardIcon color="error" />
                )}
                <Typography
                  variant="h6"
                  color={portfolioGain >= 0 ? 'success.main' : 'error.main'}
                  fontWeight={600}
                >
                  {portfolioGain >= 0 ? '+' : ''}${portfolioGain.toFixed(2)} (
                  {portfolioGainPercent.toFixed(2)}%)
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  mb: 2,
                }}
              >
                <Typography variant="h6">Savings Goals</Typography>
                <SavingsIcon color="success" sx={{ fontSize: 40 }} />
              </Box>
              <Typography variant="h3" fontWeight={700}>
                {savingsGoals.filter((g) => g.currentAmount / g.targetAmount >= 1).length}/
                {savingsGoals.length}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Goals Achieved
              </Typography>
              <Button
                variant="outlined"
                size="small"
                fullWidth
                sx={{ mt: 2 }}
                onClick={() => setGoalDialogOpen(true)}
              >
                View All Goals
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Paper>
            <Tabs
              value={activeTab}
              onChange={(_, v) => setActiveTab(v)}
              sx={{ borderBottom: 1, borderColor: 'divider' }}
            >
              <Tab label="Transactions" />
              <Tab label="Budget Overview" />
              <Tab label="Savings Goals" />
              <Tab label="Stock Portfolio" />
            </Tabs>

            <TabPanel value={activeTab} index={0}>
              <Box sx={{ p: 2 }}>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: 3,
                  }}
                >
                  <Typography variant="h6">Transaction History</Typography>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => setTransactionDialogOpen(true)}
                  >
                    Add Transaction
                  </Button>
                </Box>

                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Date</TableCell>
                        <TableCell>Description</TableCell>
                        <TableCell>Category</TableCell>
                        <TableCell align="right">Amount</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {transactions.map((transaction) => (
                        <TableRow key={transaction.id} hover>
                          <TableCell>{new Date(transaction.date).toLocaleDateString()}</TableCell>
                          <TableCell>{transaction.description}</TableCell>
                          <TableCell>
                            <Chip
                              icon={getCategoryIcon(transaction.category)}
                              label={transaction.category}
                              size="small"
                              sx={{
                                bgcolor: alpha(getCategoryColor(transaction.category), 0.1),
                                color: getCategoryColor(transaction.category),
                              }}
                            />
                          </TableCell>
                          <TableCell align="right">
                            <Typography
                              fontWeight={600}
                              color={transaction.type === 'income' ? 'success.main' : 'error.main'}
                            >
                              {transaction.type === 'income' ? '+' : '-'}$
                              {Math.abs(transaction.amount)}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            </TabPanel>

            <TabPanel value={activeTab} index={1}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Box sx={{ p: 2 }}>
                    <Typography variant="h6" gutterBottom>
                      Spending by Category
                    </Typography>
                    <Box sx={{ maxWidth: 400, mx: 'auto', mt: 3 }}>
                      <Doughnut
                        data={doughnutData}
                        options={{
                          plugins: {
                            legend: {
                              position: 'bottom',
                            },
                          },
                        }}
                      />
                    </Box>
                  </Box>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Box sx={{ p: 2 }}>
                    <Typography variant="h6" gutterBottom>
                      Category Breakdown
                    </Typography>
                    <List>
                      {Object.entries(categorySpending).map(([category, amount]) => {
                        const total = Object.values(categorySpending).reduce((a, b) => a + b, 0);
                        const percentage = (amount / total) * 100;

                        return (
                          <Box key={category}>
                            <ListItem>
                              <ListItemIcon>
                                <Avatar
                                  sx={{
                                    bgcolor: alpha(getCategoryColor(category), 0.1),
                                    color: getCategoryColor(category),
                                  }}
                                >
                                  {getCategoryIcon(category)}
                                </Avatar>
                              </ListItemIcon>
                              <ListItemText
                                primary={category}
                                secondary={
                                  <Box>
                                    <Typography variant="caption" color="text.secondary">
                                      ${amount} ({percentage.toFixed(1)}%)
                                    </Typography>
                                    <LinearProgress
                                      variant="determinate"
                                      value={percentage}
                                      sx={{
                                        mt: 1,
                                        height: 6,
                                        borderRadius: 3,
                                        bgcolor: alpha(getCategoryColor(category), 0.1),
                                        '& .MuiLinearProgress-bar': {
                                          bgcolor: getCategoryColor(category),
                                        },
                                      }}
                                    />
                                  </Box>
                                }
                              />
                              <Typography variant="h6" fontWeight={700}>
                                ${amount}
                              </Typography>
                            </ListItem>
                            <Divider />
                          </Box>
                        );
                      })}
                    </List>
                  </Box>
                </Grid>
              </Grid>
            </TabPanel>

            <TabPanel value={activeTab} index={2}>
              <Box sx={{ p: 2 }}>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: 3,
                  }}
                >
                  <Typography variant="h6">Your Savings Goals</Typography>
                  <Button variant="contained" startIcon={<AddIcon />}>
                    Add Goal
                  </Button>
                </Box>

                <Grid container spacing={3}>
                  {savingsGoals.map((goal) => {
                    const progress = (goal.currentAmount / goal.targetAmount) * 100;
                    const daysRemaining = Math.ceil(
                      (new Date(goal.deadline).getTime() - new Date().getTime()) /
                        (1000 * 60 * 60 * 24)
                    );

                    return (
                      <Grid item xs={12} md={6} key={goal.id}>
                        <Card>
                          <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                              <Avatar
                                sx={{
                                  bgcolor: alpha(goal.color, 0.1),
                                  color: goal.color,
                                  width: 56,
                                  height: 56,
                                }}
                              >
                                {goal.icon}
                              </Avatar>
                              <Box sx={{ flex: 1 }}>
                                <Typography variant="h6" fontWeight={600}>
                                  {goal.name}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {daysRemaining} days remaining
                                </Typography>
                              </Box>
                              {progress >= 100 && (
                                <Chip icon={<StarIcon />} label="Achieved" color="success" />
                              )}
                            </Box>

                            <Box sx={{ mb: 2 }}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                <Typography variant="body2" color="text.secondary">
                                  Progress
                                </Typography>
                                <Typography variant="body2" fontWeight={600}>
                                  ${goal.currentAmount} / ${goal.targetAmount}
                                </Typography>
                              </Box>
                              <LinearProgress
                                variant="determinate"
                                value={Math.min(progress, 100)}
                                sx={{
                                  height: 10,
                                  borderRadius: 5,
                                  bgcolor: alpha(goal.color, 0.1),
                                  '& .MuiLinearProgress-bar': {
                                    bgcolor: goal.color,
                                  },
                                }}
                              />
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{ mt: 1, display: 'block' }}
                              >
                                {progress.toFixed(1)}% complete
                              </Typography>
                            </Box>

                            <Stack direction="row" spacing={1}>
                              <Button
                                variant="outlined"
                                size="small"
                                fullWidth
                                startIcon={<AddIcon />}
                              >
                                Add Funds
                              </Button>
                              <Button
                                variant="outlined"
                                size="small"
                                fullWidth
                                startIcon={<RemoveIcon />}
                              >
                                Withdraw
                              </Button>
                            </Stack>
                          </CardContent>
                        </Card>
                      </Grid>
                    );
                  })}
                </Grid>
              </Box>
            </TabPanel>

            <TabPanel value={activeTab} index={3}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={8}>
                  <Box sx={{ p: 2 }}>
                    <Typography variant="h6" gutterBottom>
                      Portfolio Performance
                    </Typography>
                    <Box sx={{ mt: 3 }}>
                      <Line
                        data={lineChartData}
                        options={{
                          responsive: true,
                          plugins: {
                            legend: {
                              display: false,
                            },
                          },
                          scales: {
                            y: {
                              beginAtZero: false,
                            },
                          },
                        }}
                      />
                    </Box>

                    <Typography variant="h6" sx={{ mt: 4, mb: 2 }}>
                      Holdings
                    </Typography>
                    <TableContainer>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>Symbol</TableCell>
                            <TableCell>Company</TableCell>
                            <TableCell align="right">Shares</TableCell>
                            <TableCell align="right">Purchase Price</TableCell>
                            <TableCell align="right">Current Price</TableCell>
                            <TableCell align="right">Gain/Loss</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {portfolio.map((stock) => {
                            const gain = (stock.currentPrice - stock.purchasePrice) * stock.shares;
                            const gainPercent =
                              ((stock.currentPrice - stock.purchasePrice) / stock.purchasePrice) *
                              100;

                            return (
                              <TableRow key={stock.id} hover>
                                <TableCell>
                                  <Typography fontWeight={700}>{stock.symbol}</Typography>
                                </TableCell>
                                <TableCell>{stock.name}</TableCell>
                                <TableCell align="right">{stock.shares}</TableCell>
                                <TableCell align="right">${stock.purchasePrice}</TableCell>
                                <TableCell align="right">${stock.currentPrice}</TableCell>
                                <TableCell align="right">
                                  <Stack alignItems="flex-end">
                                    <Typography
                                      fontWeight={600}
                                      color={gain >= 0 ? 'success.main' : 'error.main'}
                                    >
                                      {gain >= 0 ? '+' : ''}${gain.toFixed(2)}
                                    </Typography>
                                    <Typography
                                      variant="caption"
                                      color={gain >= 0 ? 'success.main' : 'error.main'}
                                    >
                                      ({gainPercent >= 0 ? '+' : ''}
                                      {gainPercent.toFixed(2)}%)
                                    </Typography>
                                  </Stack>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Box>
                </Grid>

                <Grid item xs={12} md={4}>
                  <Box sx={{ p: 2 }}>
                    <Typography variant="h6" gutterBottom>
                      Portfolio Summary
                    </Typography>

                    <Paper sx={{ p: 2, mb: 2, bgcolor: alpha(theme.palette.success.main, 0.05) }}>
                      <Typography variant="body2" color="text.secondary">
                        Total Value
                      </Typography>
                      <Typography variant="h4" fontWeight={700} color="primary.main">
                        ${portfolioValue.toFixed(2)}
                      </Typography>
                    </Paper>

                    <Paper sx={{ p: 2, mb: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        Total Cost
                      </Typography>
                      <Typography variant="h5" fontWeight={600}>
                        ${portfolioCost.toFixed(2)}
                      </Typography>
                    </Paper>

                    <Paper
                      sx={{
                        p: 2,
                        bgcolor:
                          portfolioGain >= 0
                            ? alpha(theme.palette.success.main, 0.1)
                            : alpha(theme.palette.error.main, 0.1),
                      }}
                    >
                      <Typography variant="body2" color="text.secondary">
                        Total Gain/Loss
                      </Typography>
                      <Typography
                        variant="h5"
                        fontWeight={700}
                        color={portfolioGain >= 0 ? 'success.main' : 'error.main'}
                      >
                        {portfolioGain >= 0 ? '+' : ''}${portfolioGain.toFixed(2)}
                      </Typography>
                      <Typography
                        variant="body2"
                        color={portfolioGain >= 0 ? 'success.main' : 'error.main'}
                      >
                        ({portfolioGainPercent >= 0 ? '+' : ''}
                        {portfolioGainPercent.toFixed(2)}%)
                      </Typography>
                    </Paper>

                    <Button
                      variant="contained"
                      fullWidth
                      sx={{ mt: 3 }}
                      onClick={() => setStockDialogOpen(true)}
                    >
                      Buy/Sell Stocks
                    </Button>

                    <Divider sx={{ my: 3 }} />

                    <Typography variant="subtitle2" gutterBottom>
                      Market Simulation
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Prices update every 5 minutes based on simulated market conditions
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </TabPanel>
          </Paper>
        </Grid>
      </Grid>

      <Dialog
        open={transactionDialogOpen}
        onClose={() => setTransactionDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Add Transaction</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField fullWidth label="Description" placeholder="e.g., Lunch at cafeteria" />
            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select label="Category" defaultValue="">
                <MenuItem value="Food">Food</MenuItem>
                <MenuItem value="Transportation">Transportation</MenuItem>
                <MenuItem value="Entertainment">Entertainment</MenuItem>
                <MenuItem value="Education">Education</MenuItem>
                <MenuItem value="Shopping">Shopping</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Type</InputLabel>
              <Select label="Type" defaultValue="">
                <MenuItem value="income">Income</MenuItem>
                <MenuItem value="expense">Expense</MenuItem>
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Amount"
              type="number"
              InputProps={{ startAdornment: '$' }}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTransactionDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => setTransactionDialogOpen(false)}>
            Add Transaction
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={stockDialogOpen}
        onClose={() => setStockDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Trade Stocks</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>Action</InputLabel>
              <Select label="Action" defaultValue="">
                <MenuItem value="buy">Buy</MenuItem>
                <MenuItem value="sell">Sell</MenuItem>
              </Select>
            </FormControl>
            <TextField fullWidth label="Stock Symbol" placeholder="e.g., AAPL" />
            <TextField fullWidth label="Number of Shares" type="number" />
            <Paper sx={{ p: 2, bgcolor: alpha(theme.palette.info.main, 0.05) }}>
              <Typography variant="caption" color="text.secondary">
                Current Price: $175.00
              </Typography>
              <Typography variant="h6" fontWeight={600} sx={{ mt: 1 }}>
                Estimated Total: $0.00
              </Typography>
            </Paper>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStockDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => setStockDialogOpen(false)}>
            Execute Trade
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
