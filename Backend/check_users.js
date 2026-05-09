import 'dotenv/config';
import { supabaseAdmin } from './lib/supabaseAdmin.js';

async function checkUsers() {
    try {
        const { data, error } = await supabaseAdmin.from('users').select('id, email, name');
        if (error) throw error;
        console.log('USERS IN DB:');
        console.log(JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('ERROR CHECKING USERS:', error);
    }
}

checkUsers();
