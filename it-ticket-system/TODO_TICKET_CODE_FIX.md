# Ticket Code Fix Plan

## Issue
Ticket codes are not being generated/displayed properly in the ticket card.

## Root Cause
When a ticket is created via Supabase client, the auto-generated `ticket_code` from the database trigger may not be returned immediately in the insert response.

## Fix Plan

### Step 1: Fix New Ticket Page (`app/(dashboard)/dashboard/tickets/new/page.tsx`)
- After inserting the ticket, if `ticket_code` is null, fetch it separately
- Display the ticket code prominently after creation

### Step 2: Enhance Ticket Detail Page (`app/(dashboard)/dashboard/tickets/[id]/page.tsx`)
- Add ticket_code to the header section of the ticket card
- Make it more visible alongside the title and status

### Step 3: Verify Seed Data (Optional)
- Add ticket_code to existing demo tickets if needed

## Implementation Details

### New Ticket Page Fix
```typescript
// After insert, fetch ticket_code if not returned
let { data: ticket, error: ticketError } = await supabase
  .from('tickets')
  .insert({...})
  .select()
  .single();

// If ticket_code is null, fetch it
if (ticket && !ticket.ticket_code) {
  const { data: refreshed } = await supabase
    .from('tickets')
    .select('ticket_code')
    .eq('id', ticket.id)
    .single();
  if (refreshed) {
    ticket.ticket_code = refreshed.ticket_code;
  }
}
```

### Ticket Detail Page Enhancement
Add ticket_code to the header with a copy button for easy sharing.

