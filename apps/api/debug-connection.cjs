const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('Testing connection to:', supabaseUrl);
console.log('Key length:', supabaseKey ? supabaseKey.length : 0);

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing URL or Key');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
    },
});

async function test() {
    console.log('Querying now...');
    const start = Date.now();

    // Try querying audit_log
    try {
        const { data, error } = await supabase.from('audit_log').select('id').limit(1);
        if (error) {
            console.error('Error querying audit_log:', error);
        } else {
            console.log('Success audit_log:', data);
        }
    } catch (e) {
        console.error('Exception querying audit_log:', e);
    }

    // Try querying entities
    try {
        const { data, error } = await supabase.from('entities').select('count', { count: 'exact', head: true });
        if (error) {
            console.error('Error querying entities:', error);
        } else {
            console.log('Success entities count:', data, '(count only)');
        }
    } catch (e) {
        console.error('Exception querying entities:', e);
    }

    console.log('Finished in', Date.now() - start, 'ms');
}

test();
