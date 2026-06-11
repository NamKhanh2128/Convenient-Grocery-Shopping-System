const { createClient } = require('@supabase/supabase-js');

let supabaseAdminClient;

function getSupabaseAdmin() {
  if (!supabaseAdminClient) {
    const url = process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !serviceRoleKey) {
      throw new Error('SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY is not configured');
    }

    supabaseAdminClient = createClient(url, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }

  return supabaseAdminClient;
}

const oauthService = {
  // Verifies a Supabase access token by asking Supabase itself, so we never
  // need to track which signing key/algorithm the project currently uses.
  async verifyGoogleAccessToken(accessToken) {
    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin.auth.getUser(accessToken);

    if (error || !data?.user) {
      throw new Error('Token Google không hợp lệ hoặc đã hết hạn');
    }

    return data.user;
  },
};

module.exports = { oauthService };
