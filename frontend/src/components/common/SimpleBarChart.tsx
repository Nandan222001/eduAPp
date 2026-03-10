import { Box, Typography, useTheme } from '@mui/material';

interface DataPoint {
  label: string;
  value: number;
  secondaryValue?: number;
}

interface SimpleBarChartProps {
  data: DataPoint[];
  height?: number;
  primaryColor?: string;
  secondaryColor?: string;
  showSecondary?: boolean;
}

export default function SimpleBarChart({
  data,
  height = 300,
  primaryColor,
  secondaryColor,
  showSecondary = false,
}: SimpleBarChartProps) {
  const theme = useTheme();
  const defaultPrimaryColor = primaryColor || theme.palette.primary.main;
  const defaultSecondaryColor = secondaryColor || theme.palette.secondary.main;

  const maxValue = Math.max(...data.map((d) => Math.max(d.value, d.secondaryValue || 0)));

  return (
    <Box sx={{ width: '100%', height }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-around',
          height: height - 40,
          gap: 1,
        }}
      >
        {data.map((item, index) => {
          const primaryHeight = maxValue > 0 ? (item.value / maxValue) * 100 : 0;
          const secondaryHeight =
            item.secondaryValue && maxValue > 0 ? (item.secondaryValue / maxValue) * 100 : 0;

          return (
            <Box
              key={index}
              sx={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 1,
              }}
            >
              <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'flex-end', width: '100%' }}>
                <Box
                  sx={{
                    flex: showSecondary ? 1 : 2,
                    height: `${Math.max(primaryHeight, 2)}%`,
                    bgcolor: defaultPrimaryColor,
                    borderRadius: 1,
                    transition: 'all 0.3s ease',
                    position: 'relative',
                    '&:hover': {
                      opacity: 0.8,
                      transform: 'scaleY(1.05)',
                    },
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      position: 'absolute',
                      top: -20,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      fontSize: '0.65rem',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {item.value.toLocaleString()}
                  </Typography>
                </Box>

                {showSecondary && item.secondaryValue !== undefined && (
                  <Box
                    sx={{
                      flex: 1,
                      height: `${Math.max(secondaryHeight, 2)}%`,
                      bgcolor: defaultSecondaryColor,
                      borderRadius: 1,
                      transition: 'all 0.3s ease',
                      position: 'relative',
                      '&:hover': {
                        opacity: 0.8,
                        transform: 'scaleY(1.05)',
                      },
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{
                        position: 'absolute',
                        top: -20,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        fontSize: '0.65rem',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {item.secondaryValue.toLocaleString()}
                    </Typography>
                  </Box>
                )}
              </Box>

              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ textAlign: 'center', fontSize: '0.7rem' }}
              >
                {item.label}
              </Typography>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
