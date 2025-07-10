import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface UpdatePhoneRequest {
  userId: string;
  phoneNumber: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { userId, phoneNumber }: UpdatePhoneRequest = await req.json();

    if (!userId || !phoneNumber) {
      return new Response(
        JSON.stringify({ error: 'User ID and phone number are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client with service role key
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Mettre à jour les métadonnées utilisateur
    const { data: userData, error: userError } = await supabase.auth.admin.updateUserById(
      userId,
      { user_metadata: { phone_number: phoneNumber } }
    );

    if (userError) {
      console.error('Error updating user metadata:', userError);
      return new Response(
        JSON.stringify({ error: 'Failed to update user metadata', details: userError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Mettre à jour également dans user_preferences
    const { error: prefError } = await supabase
      .from('user_preferences')
      .upsert({
        user_id: userId,
        phone_number: phoneNumber,
        updated_at: new Date().toISOString()
      });

    if (prefError) {
      console.error('Error updating user preferences:', prefError);
      // On continue malgré l'erreur car la mise à jour des métadonnées a réussi
    }

    console.log('User phone number updated successfully for user:', userId);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Numéro de téléphone mis à jour avec succès',
        userId,
        phoneNumber
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in update user phone function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});