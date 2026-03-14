# Student Credentials - Quick Start Guide

## Files Created

```
frontend/src/
├── lib/
│   └── axios.ts                      # HTTP client configuration
├── types/
│   └── credential.ts                 # TypeScript type definitions
├── api/
│   └── credentials.ts                # API client for credentials
└── pages/
    └── StudentCredentials.tsx        # Main credential wallet page
```

## Quick Setup

### 1. Add Route to Your Router

```typescript
// In your router configuration (e.g., App.tsx or routes.tsx)
import StudentCredentials from '@/pages/StudentCredentials';

// Add this route
{
  path: '/student/credentials',
  element: <StudentCredentials />,
}
```

### 2. Add Navigation Link

```typescript
// In your student navigation menu
<MenuItem component={Link} to="/student/credentials">
  <ListItemIcon>
    <WorkspacePremiumIcon />
  </ListItemIcon>
  <ListItemText>My Credentials</ListItemText>
</MenuItem>
```

### 3. Environment Configuration

Ensure your `.env` file has:
```env
VITE_API_URL=http://localhost:8000/api/v1
```

## Features Overview

### Digital Wallet
- View all your earned credentials
- Filter by type (certificates, badges)
- See blockchain verification status
- Check credential validity and expiration

### Share Credentials
- Generate shareable links
- Share on LinkedIn and Twitter
- QR code display
- Copy verification URLs

### Download Options
- Download as JSON (verifiable format)
- Download as PDF certificate
- Export with all metadata

### Privacy Controls
- **Public**: Visible to everyone
- **Private**: Only you can see
- **Selective**: Share via links only

### Embed in Portfolio
- Get HTML embed code
- Add to personal websites
- Include in digital resumes

### Blockchain Verification
- View blockchain transaction details
- Check authenticity
- See issuance history
- Transaction hash verification

## Usage Flow

### 1. View Credentials
```
Navigate to /student/credentials
→ See all your credentials in a grid layout
→ Click tabs to filter by type
```

### 2. View Details
```
Click "View Details" on any credential
→ See complete information
→ Check skills, dates, scores
→ View verification count
```

### 3. Share a Credential
```
Click share icon on credential card
→ Generate share link (optional)
→ Share on social media
→ Copy verification URL
```

### 4. Download
```
Click download icon
→ Downloads JSON immediately
→ Can also download PDF (if available)
```

### 5. Check Blockchain
```
Click blockchain icon (if credential is on blockchain)
→ View transaction details
→ See authenticity status
→ Check transaction history
```

### 6. Adjust Privacy
```
Click privacy icon (lock/public)
→ Select privacy level
→ Save settings
```

### 7. Embed in Portfolio
```
Click "..." menu on credential
→ Select "Embed"
→ Copy embed code
→ Paste in your website
```

## Component Details

### Main Page Components

**StudentCredentials** (Main)
- Manages all credential data
- Handles API calls
- Controls all dialogs

**CredentialGrid**
- Displays credential cards
- Responsive 3-column layout
- Hover effects and interactions

**Dialogs** (5 total)
- DetailDialog - Full credential info
- ShareDialog - Sharing options
- BlockchainDialog - Verification details
- PrivacyDialog - Privacy settings
- EmbedDialog - Embed code

## API Endpoints Used

```typescript
GET  /credentials/my-credentials           # List user's credentials
GET  /credentials/{id}                     # Get credential details
POST /credentials/{id}/share               # Create share link
POST /credentials/verify                   # Verify credential
GET  /credentials/verify/certificate/{num} # Public verification
GET  /employer/credential/{num}/history    # Blockchain history
```

## State Management

The component manages these states:
- `credentials` - List of all credentials
- `loading` - Loading indicator
- `error` - Error messages
- `selectedCredential` - Currently selected credential
- `privacySettings` - Privacy level per credential
- Dialog open/close states
- Share URL state
- Blockchain data

## Styling

Uses Material-UI (MUI) components with:
- Responsive grid layout
- Card hover effects
- Color-coded status chips
- Icon-based actions
- Dialog modals
- Smooth transitions

## Error Handling

```typescript
// Graceful error handling
try {
  const data = await credentialsApi.getMyCredentials();
  setCredentials(data);
} catch (err) {
  setError('Failed to load credentials');
}
```

## Common Tasks

### Add New Credential Type Icon
```typescript
const getCredentialIcon = (credential: Credential) => {
  if (credential.credential_type === CredentialType.NEW_TYPE) {
    return <NewIcon sx={{ fontSize: 48, color: 'primary.main' }} />;
  }
  // ... existing code
};
```

### Customize Share Text
```typescript
const handleShareToLinkedIn = () => {
  const text = `Custom message: ${selectedCredential.title}!`;
  // ... rest of code
};
```

### Add New Privacy Level
```typescript
// In types/credential.ts
export enum CredentialPrivacy {
  // ... existing
  FRIENDS_ONLY = 'friends_only',
}

// Update PrivacyDialog to include new option
```

## Testing

### Manual Testing Checklist
- [ ] Load credentials successfully
- [ ] Filter by tabs works
- [ ] View details dialog opens
- [ ] Share link generates
- [ ] Social sharing works
- [ ] JSON download works
- [ ] Privacy settings save
- [ ] Blockchain viewer loads
- [ ] Embed code copies
- [ ] Error states display

### Browser Testing
- [ ] Chrome
- [ ] Firefox
- [ ] Safari
- [ ] Edge

### Responsive Testing
- [ ] Desktop (1920x1080)
- [ ] Tablet (768x1024)
- [ ] Mobile (375x667)

## Troubleshooting

### Issue: Credentials not loading
**Solution**: Check API endpoint and authentication token

### Issue: Share link not generating
**Solution**: Verify backend endpoint `/credentials/{id}/share`

### Issue: Download not working
**Solution**: Check browser permissions for downloads

### Issue: Blockchain data not showing
**Solution**: Ensure credential has `blockchain_credential_id`

### Issue: Icons not displaying
**Solution**: Verify MUI icons package is installed

## Performance Tips

1. **Pagination**: For large credential lists, implement pagination
2. **Lazy Loading**: Dialogs render only when opened
3. **Memoization**: Consider memoizing credential cards
4. **Image Optimization**: Lazy load QR codes

## Security Considerations

1. **Authentication**: All API calls require valid token
2. **Privacy**: Client-side privacy settings
3. **Share Links**: Use tokens for security
4. **Data Validation**: TypeScript ensures type safety

## Next Steps

1. **Add to Navigation**: Link from student dashboard
2. **Notifications**: Alert on new credentials
3. **Analytics**: Track credential views
4. **Customization**: Allow credential templates
5. **Export**: Bulk export functionality

## Support

For issues or questions:
1. Check browser console for errors
2. Verify API responses in Network tab
3. Ensure all dependencies installed
4. Check environment variables

## Summary

The Student Credentials page provides:
- ✅ Complete digital wallet
- ✅ All sharing capabilities
- ✅ Download options
- ✅ Privacy controls
- ✅ Blockchain verification
- ✅ Portfolio embedding

Ready to use with no additional configuration needed!
