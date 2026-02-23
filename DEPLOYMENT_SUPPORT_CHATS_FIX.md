# Deployment Instructions - Support Chats Fix

## Summary of Changes
This fix restores support chats that were incorrectly being filtered out. The system now properly separates active and archived chats.

## Files Modified
1. `telegram-bot/src/api.ts` - Backend API fixes
2. `crm/src/lib/api.ts` - New API client function
3. `crm/src/components/pages/Support.tsx` - UI component updates

## Deployment Steps

### Step 1: Backend Deployment
```bash
cd telegram-bot
npm install  # Ensure all dependencies are installed
npm run build  # Compile TypeScript if applicable

# Restart the bot service (adjust for your deployment method)
# Examples:
pm2 restart telegram-bot
# OR
docker restart telegram-bot-container
# OR
systemctl restart telegram-bot
```

### Step 2: Frontend Deployment
```bash
cd crm
npm install  # Re-install to ensure dependencies are up to date
npm run build  # Build the React app

# Deploy built files to your hosting
# Examples:
npm run deploy
# OR
vercel deploy
# OR
docker rebuild and push
```

### Step 3: Verification
After deployment, verify the fix works:

1. **Check API Endpoints**
   ```bash
   # Should return only non-archived chats
   curl -H "Authorization: Bearer <token>" \
     "http://your-api.com/api/admin/support/chats"
   
   # Should return only archived chats
   curl -H "Authorization: Bearer <token>" \
     "http://your-api.com/api/admin/support/chats/archive"
   ```

2. **Check CRM UI**
   - Navigate to Support section in CRM
   - You should see 3 tabs: "New", "Accepted", "Archive"
   - "Archive" tab should now display archived conversations
   - Old conversations from 16.02 should be visible in "Archive" tab

3. **Test Archive/Unarchive**
   - Select an active chat
   - Archive it
   - Verify it appears in "Archive" tab
   - Unarchive it
   - Verify it returns to active list

## Rollback Plan (if needed)
If issues arise, you can rollback by reverting these specific file changes:

1. **Revert telegram-bot/src/api.ts**
   - Remove the new `/api/admin/support/chats/archive` endpoint
   - Remove the `status: { not: 'ARCHIVE' }` filter from `/api/admin/support/chats`

2. **Revert crm/src/lib/api.ts**
   - Remove the `fetchSupportArchivedChats` function

3. **Revert crm/src/components/pages/Support.tsx**
   - Remove the `archivedChatsData` query
   - Remove the `isChatDataLoading` variable
   - Revert usage back to `isChatsLoading`

Then redeploy both backend and frontend.

## Performance Considerations
- The archived chats query runs in parallel with the active chats query (no sequential delay)
- Pagination limit is 50 chats per page (adjustable if needed)
- Auto-refresh interval is 5 seconds (same as active chats)
- No additional database queries beyond what was previously needed

## Data Integrity
- No data migration required
- No database schema changes
- Existing archived chats keep their `status='ARCHIVE'`
- No data loss or corruption risk

## Monitoring
After deployment, monitor for:
- Increased API response times (should be minimal - only 1 extra query max)
- Error logs for `/api/admin/support/chats/archive` endpoint
- CRM error logs for new `fetchSupportArchivedChats` calls
- User reports of missing chats (should resolve)

## Testing Checklist
- [ ] Backend API returns active chats (without archived)
- [ ] Backend API returns archived chats on `/archive` endpoint
- [ ] CRM loads without errors
- [ ] "Archive" tab displays archived chats
- [ ] Search works in archive tab
- [ ] Pagination works for archived chats (if > 50)
- [ ] Unarchive functionality still works
- [ ] Re-archiving works
- [ ] Old conversations from 16.02 are visible

## Support
If you encounter issues:
1. Check the error logs in both backend and frontend
2. Verify the API endpoints are responding correctly
3. Clear browser cache and reload CRM
4. Restart the backend service if API doesn't respond
5. Review the `SUPPORT_CHATS_FIX.md` documentation for technical details

## Timeline
- **Development**: Bug identified in API query filtering
- **Fix**: Separated active and archived chat endpoints
- **Testing**: Verified archive functionality
- **Deployment**: Ready for production
- **Expected Results**: All historical chats (16.02+) now visible in Archive tab
