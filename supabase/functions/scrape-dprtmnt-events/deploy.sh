#!/bin/bash

# Deploy the DPRTMNTS scraper function to Supabase
echo "Deploying DPRTMNTS scraper function..."

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "Error: Supabase CLI is not installed"
    echo "Please install it from: https://supabase.com/docs/guides/cli"
    exit 1
fi

# Deploy the function
supabase functions deploy scrape-dprtmnt-events

echo "Function deployed successfully!"
echo "You can test it by calling:"
echo "curl -X POST 'https://your-project.supabase.co/functions/v1/scrape-dprtmnt-events' \\"
echo "  -H 'Authorization: Bearer YOUR_ANON_KEY'"
