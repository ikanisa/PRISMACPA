#!/bin/bash
source .env.local
echo "Testing: $SUPABASE_URL"

# Test Root (OpenAPI)
echo "--- Root /rest/v1/ ---"
curl -s -o /dev/null -w "%{http_code}" -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" "$SUPABASE_URL/rest/v1/"
echo ""

# Test Entities Table
echo "--- Entities Table ---"
curl -s -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" "$SUPABASE_URL/rest/v1/entities?select=count"
echo ""

# Test Cases Table
echo "--- Cases Table ---"
curl -s -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" "$SUPABASE_URL/rest/v1/cases?select=count"
echo ""
