import { useState } from 'react';
import {
  Box,
  Typography,
  Container,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Paper,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Stepper,
  Step,
  StepLabel,
  Radio,
  RadioGroup,
  FormControlLabel,
  Stack,
  Divider,
  Chip,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  useTheme,
  IconButton,
} from '@mui/material';
import {
  LocalShipping as ShippingIcon,
  CheckCircle as CheckIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
} from '@mui/icons-material';
import { PrintOrder } from '@/types/yearbook';

const mockYearbooks = [
  {
    id: 1,
    year: '2023-2024',
    title: 'Memories Forever',
    coverImage: 'https://via.placeholder.com/300x400/1976d2/ffffff?text=2024',
    basePrice: 45.99,
  },
];

const mockOrders: PrintOrder[] = [
  {
    id: 1,
    studentId: 1,
    studentName: 'John Doe',
    yearbookId: 1,
    yearbookYear: '2022-2023',
    quantity: 1,
    coverOption: 'hardcover',
    paperQuality: 'premium',
    totalPrice: 59.99,
    status: 'delivered',
    orderDate: '2023-06-15',
    estimatedDelivery: '2023-06-25',
    trackingNumber: 'TRACK123456789',
    shippingAddress: {
      name: 'John Doe',
      addressLine1: '123 Main St',
      city: 'Springfield',
      state: 'IL',
      zipCode: '62701',
      country: 'USA',
      phone: '(555) 123-4567',
    },
  },
];

export default function YearbookPrintOrder() {
  const theme = useTheme();
  const [activeStep, setActiveStep] = useState(0);
  const [orders, setOrders] = useState<PrintOrder[]>(mockOrders);
  const [quantity, setQuantity] = useState(1);
  const [coverOption, setCoverOption] = useState<'hardcover' | 'softcover'>('hardcover');
  const [paperQuality, setPaperQuality] = useState<'standard' | 'premium' | 'glossy'>('premium');
  const [promoCode, setPromoCode] = useState('');
  const [promoApplied, setPromoApplied] = useState(false);

  const [shippingInfo, setShippingInfo] = useState({
    name: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'USA',
    phone: '',
  });

  const steps = ['Select Options', 'Shipping Details', 'Payment', 'Confirmation'];

  const selectedYearbook = mockYearbooks[0];

  const calculatePrice = () => {
    let price = selectedYearbook.basePrice;

    if (coverOption === 'hardcover') price += 15;
    if (paperQuality === 'premium') price += 10;
    if (paperQuality === 'glossy') price += 15;

    const subtotal = price * quantity;
    const shipping = 8.99;
    const tax = subtotal * 0.08;
    const discount = promoApplied ? subtotal * 0.1 : 0;
    const total = subtotal + shipping + tax - discount;

    return { price, subtotal, shipping, tax, discount, total };
  };

  const pricing = calculatePrice();

  const handleNext = () => {
    if (activeStep === steps.length - 1) {
      handlePlaceOrder();
    } else {
      setActiveStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const handleApplyPromo = () => {
    if (promoCode.toUpperCase() === 'SENIOR2024') {
      setPromoApplied(true);
    }
  };

  const handlePlaceOrder = () => {
    const newOrder: PrintOrder = {
      id: orders.length + 1,
      studentId: 1,
      studentName: 'Current User',
      yearbookId: selectedYearbook.id,
      yearbookYear: selectedYearbook.year,
      quantity,
      coverOption,
      paperQuality,
      totalPrice: pricing.total,
      status: 'pending',
      orderDate: new Date().toISOString().split('T')[0],
      estimatedDelivery: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0],
      shippingAddress: shippingInfo,
    };

    setOrders([newOrder, ...orders]);
  };

  const getStatusColor = (status: PrintOrder['status']) => {
    switch (status) {
      case 'delivered':
        return 'success';
      case 'shipped':
        return 'info';
      case 'processing':
      case 'printing':
        return 'warning';
      default:
        return 'default';
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom fontWeight={700}>
          Order Print Yearbook
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Get a physical copy of your yearbook delivered to your door
        </Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, p: 3, mb: 3 }}>
            <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>

            {activeStep === 0 && (
              <Stack spacing={3}>
                <Box>
                  <Typography variant="h6" gutterBottom fontWeight={600}>
                    Select Your Yearbook
                  </Typography>
                  <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}` }}>
                    <CardContent>
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={4}>
                          <CardMedia
                            component="img"
                            image={selectedYearbook.coverImage}
                            alt={selectedYearbook.title}
                            sx={{ borderRadius: 1 }}
                          />
                        </Grid>
                        <Grid item xs={12} sm={8}>
                          <Typography variant="h6" gutterBottom>
                            {selectedYearbook.title}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            Academic Year {selectedYearbook.year}
                          </Typography>
                          <Typography variant="h5" color="primary" sx={{ mt: 2 }}>
                            ${selectedYearbook.basePrice.toFixed(2)}
                          </Typography>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Box>

                <Box>
                  <Typography variant="h6" gutterBottom fontWeight={600}>
                    Quantity
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <IconButton
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      disabled={quantity <= 1}
                    >
                      <RemoveIcon />
                    </IconButton>
                    <Typography variant="h5" sx={{ minWidth: 40, textAlign: 'center' }}>
                      {quantity}
                    </Typography>
                    <IconButton onClick={() => setQuantity(quantity + 1)} disabled={quantity >= 10}>
                      <AddIcon />
                    </IconButton>
                  </Box>
                </Box>

                <Box>
                  <Typography variant="h6" gutterBottom fontWeight={600}>
                    Cover Option
                  </Typography>
                  <RadioGroup
                    value={coverOption}
                    onChange={(e) => setCoverOption(e.target.value as 'hardcover' | 'softcover')}
                  >
                    <Paper
                      elevation={0}
                      sx={{ border: `1px solid ${theme.palette.divider}`, p: 2, mb: 1 }}
                    >
                      <FormControlLabel
                        value="hardcover"
                        control={<Radio />}
                        label={
                          <Box
                            sx={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              width: '100%',
                              alignItems: 'center',
                            }}
                          >
                            <Box>
                              <Typography variant="body1" fontWeight={600}>
                                Hardcover
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                Durable with premium finish
                              </Typography>
                            </Box>
                            <Typography variant="body1" fontWeight={600}>
                              +$15.00
                            </Typography>
                          </Box>
                        }
                      />
                    </Paper>
                    <Paper
                      elevation={0}
                      sx={{ border: `1px solid ${theme.palette.divider}`, p: 2 }}
                    >
                      <FormControlLabel
                        value="softcover"
                        control={<Radio />}
                        label={
                          <Box
                            sx={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              width: '100%',
                              alignItems: 'center',
                            }}
                          >
                            <Box>
                              <Typography variant="body1" fontWeight={600}>
                                Softcover
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                Lightweight and flexible
                              </Typography>
                            </Box>
                            <Typography variant="body1" fontWeight={600}>
                              Included
                            </Typography>
                          </Box>
                        }
                      />
                    </Paper>
                  </RadioGroup>
                </Box>

                <Box>
                  <Typography variant="h6" gutterBottom fontWeight={600}>
                    Paper Quality
                  </Typography>
                  <RadioGroup
                    value={paperQuality}
                    onChange={(e) =>
                      setPaperQuality(e.target.value as 'standard' | 'premium' | 'glossy')
                    }
                  >
                    <Paper
                      elevation={0}
                      sx={{ border: `1px solid ${theme.palette.divider}`, p: 2, mb: 1 }}
                    >
                      <FormControlLabel
                        value="standard"
                        control={<Radio />}
                        label={
                          <Box
                            sx={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              width: '100%',
                              alignItems: 'center',
                            }}
                          >
                            <Box>
                              <Typography variant="body1" fontWeight={600}>
                                Standard
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                Good quality for everyday use
                              </Typography>
                            </Box>
                            <Typography variant="body1" fontWeight={600}>
                              Included
                            </Typography>
                          </Box>
                        }
                      />
                    </Paper>
                    <Paper
                      elevation={0}
                      sx={{ border: `1px solid ${theme.palette.divider}`, p: 2, mb: 1 }}
                    >
                      <FormControlLabel
                        value="premium"
                        control={<Radio />}
                        label={
                          <Box
                            sx={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              width: '100%',
                              alignItems: 'center',
                            }}
                          >
                            <Box>
                              <Typography variant="body1" fontWeight={600}>
                                Premium
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                Thicker, higher quality paper
                              </Typography>
                            </Box>
                            <Typography variant="body1" fontWeight={600}>
                              +$10.00
                            </Typography>
                          </Box>
                        }
                      />
                    </Paper>
                    <Paper
                      elevation={0}
                      sx={{ border: `1px solid ${theme.palette.divider}`, p: 2 }}
                    >
                      <FormControlLabel
                        value="glossy"
                        control={<Radio />}
                        label={
                          <Box
                            sx={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              width: '100%',
                              alignItems: 'center',
                            }}
                          >
                            <Box>
                              <Typography variant="body1" fontWeight={600}>
                                Glossy Premium
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                Photo-quality glossy finish
                              </Typography>
                            </Box>
                            <Typography variant="body1" fontWeight={600}>
                              +$15.00
                            </Typography>
                          </Box>
                        }
                      />
                    </Paper>
                  </RadioGroup>
                </Box>
              </Stack>
            )}

            {activeStep === 1 && (
              <Stack spacing={3}>
                <Typography variant="h6" gutterBottom fontWeight={600}>
                  Shipping Address
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      label="Full Name"
                      value={shippingInfo.name}
                      onChange={(e) => setShippingInfo({ ...shippingInfo, name: e.target.value })}
                      fullWidth
                      required
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      label="Address Line 1"
                      value={shippingInfo.addressLine1}
                      onChange={(e) =>
                        setShippingInfo({ ...shippingInfo, addressLine1: e.target.value })
                      }
                      fullWidth
                      required
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      label="Address Line 2 (Optional)"
                      value={shippingInfo.addressLine2}
                      onChange={(e) =>
                        setShippingInfo({ ...shippingInfo, addressLine2: e.target.value })
                      }
                      fullWidth
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="City"
                      value={shippingInfo.city}
                      onChange={(e) => setShippingInfo({ ...shippingInfo, city: e.target.value })}
                      fullWidth
                      required
                    />
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <TextField
                      label="State"
                      value={shippingInfo.state}
                      onChange={(e) => setShippingInfo({ ...shippingInfo, state: e.target.value })}
                      fullWidth
                      required
                    />
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <TextField
                      label="ZIP Code"
                      value={shippingInfo.zipCode}
                      onChange={(e) =>
                        setShippingInfo({ ...shippingInfo, zipCode: e.target.value })
                      }
                      fullWidth
                      required
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel>Country</InputLabel>
                      <Select
                        value={shippingInfo.country}
                        onChange={(e) =>
                          setShippingInfo({ ...shippingInfo, country: e.target.value })
                        }
                        label="Country"
                      >
                        <MenuItem value="USA">United States</MenuItem>
                        <MenuItem value="CAN">Canada</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Phone Number"
                      value={shippingInfo.phone}
                      onChange={(e) => setShippingInfo({ ...shippingInfo, phone: e.target.value })}
                      fullWidth
                      required
                    />
                  </Grid>
                </Grid>
              </Stack>
            )}

            {activeStep === 2 && (
              <Stack spacing={3}>
                <Typography variant="h6" gutterBottom fontWeight={600}>
                  Payment Information
                </Typography>
                <Alert severity="info">
                  Payment processing is handled securely through our payment partner
                </Alert>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      label="Card Number"
                      placeholder="1234 5678 9012 3456"
                      fullWidth
                      required
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField label="Expiry Date" placeholder="MM/YY" fullWidth required />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField label="CVV" placeholder="123" fullWidth required />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField label="Cardholder Name" fullWidth required />
                  </Grid>
                </Grid>
              </Stack>
            )}

            {activeStep === 3 && (
              <Stack spacing={3} alignItems="center" sx={{ py: 4 }}>
                <CheckIcon sx={{ fontSize: 80, color: 'success.main' }} />
                <Typography variant="h5" fontWeight={600}>
                  Order Confirmed!
                </Typography>
                <Typography variant="body1" color="text.secondary" align="center">
                  Your yearbook order has been placed successfully. You&apos;ll receive an email
                  confirmation shortly.
                </Typography>
                <Alert severity="success" sx={{ width: '100%' }}>
                  Order Number: #YB-{Math.floor(Math.random() * 100000)}
                </Alert>
              </Stack>
            )}

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
              <Button onClick={handleBack} disabled={activeStep === 0 || activeStep === 3}>
                Back
              </Button>
              <Button variant="contained" onClick={handleNext}>
                {activeStep === steps.length - 1 ? 'Go to Orders' : 'Continue'}
              </Button>
            </Box>
          </Paper>

          {orders.length > 0 && (
            <Paper elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, p: 3 }}>
              <Typography variant="h6" gutterBottom fontWeight={600}>
                Order History
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Order #</TableCell>
                      <TableCell>Yearbook</TableCell>
                      <TableCell>Date</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Total</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {orders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell>#{order.id}</TableCell>
                        <TableCell>{order.yearbookYear}</TableCell>
                        <TableCell>{new Date(order.orderDate).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Chip
                            label={order.status}
                            size="small"
                            color={getStatusColor(order.status)}
                          />
                        </TableCell>
                        <TableCell>${order.totalPrice.toFixed(2)}</TableCell>
                        <TableCell>
                          {order.trackingNumber && (
                            <Button size="small" startIcon={<ShippingIcon />}>
                              Track
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          )}
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper
            elevation={0}
            sx={{ border: `1px solid ${theme.palette.divider}`, p: 3, position: 'sticky', top: 16 }}
          >
            <Typography variant="h6" gutterBottom fontWeight={600}>
              Order Summary
            </Typography>
            <Stack spacing={2}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2">Base Price ({quantity}x)</Typography>
                <Typography variant="body2">
                  ${(selectedYearbook.basePrice * quantity).toFixed(2)}
                </Typography>
              </Box>
              {coverOption === 'hardcover' && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">Hardcover</Typography>
                  <Typography variant="body2">+${(15 * quantity).toFixed(2)}</Typography>
                </Box>
              )}
              {paperQuality !== 'standard' && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">
                    {paperQuality === 'premium' ? 'Premium' : 'Glossy'} Paper
                  </Typography>
                  <Typography variant="body2">
                    +${((paperQuality === 'premium' ? 10 : 15) * quantity).toFixed(2)}
                  </Typography>
                </Box>
              )}

              <Divider />

              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2">Subtotal</Typography>
                <Typography variant="body2">${pricing.subtotal.toFixed(2)}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2">Shipping</Typography>
                <Typography variant="body2">${pricing.shipping.toFixed(2)}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2">Tax</Typography>
                <Typography variant="body2">${pricing.tax.toFixed(2)}</Typography>
              </Box>
              {promoApplied && (
                <Box
                  sx={{ display: 'flex', justifyContent: 'space-between', color: 'success.main' }}
                >
                  <Typography variant="body2">Discount</Typography>
                  <Typography variant="body2">-${pricing.discount.toFixed(2)}</Typography>
                </Box>
              )}

              <Divider />

              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="h6" fontWeight={600}>
                  Total
                </Typography>
                <Typography variant="h6" fontWeight={600} color="primary.main">
                  ${pricing.total.toFixed(2)}
                </Typography>
              </Box>

              <Box>
                <TextField
                  size="small"
                  label="Promo Code"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  fullWidth
                  disabled={promoApplied}
                  InputProps={{
                    endAdornment: (
                      <Button size="small" onClick={handleApplyPromo} disabled={promoApplied}>
                        Apply
                      </Button>
                    ),
                  }}
                />
                {promoApplied && (
                  <Alert severity="success" sx={{ mt: 1 }}>
                    Promo code applied: 10% off!
                  </Alert>
                )}
              </Box>

              <Alert severity="info">
                <Typography variant="caption">Estimated delivery: 10-14 business days</Typography>
              </Alert>
            </Stack>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}
