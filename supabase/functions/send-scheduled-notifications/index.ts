import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const now = new Date().toISOString();

    const { data: scheduledNotifications, error: fetchError } = await supabase
      .from('scheduled_notifications')
      .select(`
        id,
        discussion_id,
        user_id,
        notify_at,
        discussions (
          title,
          prompt,
          deadline_at
        )
      `)
      .eq('sent', false)
      .lte('notify_at', now);

    if (fetchError) {
      throw fetchError;
    }

    if (!scheduledNotifications || scheduledNotifications.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No notifications to send', count: 0 }),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const notificationInserts = scheduledNotifications.map((sn: any) => {
      const discussion = sn.discussions;
      const deadlineDate = new Date(discussion.deadline_at);
      const timeRemaining = Math.ceil((deadlineDate.getTime() - Date.now()) / (1000 * 60));
      const timeText = timeRemaining > 60 
        ? `${Math.ceil(timeRemaining / 60)} hours`
        : `${timeRemaining} minutes`;

      return {
        user_id: sn.user_id,
        discussion_id: sn.discussion_id,
        message: `⏰ Reminder: "${discussion.title}" deadline in ${timeText}`,
        read: false,
      };
    });

    const { error: insertError } = await supabase
      .from('notifications')
      .insert(notificationInserts);

    if (insertError) {
      throw insertError;
    }

    const scheduledIds = scheduledNotifications.map((sn: any) => sn.id);
    const { error: updateError } = await supabase
      .from('scheduled_notifications')
      .update({ sent: true })
      .in('id', scheduledIds);

    if (updateError) {
      throw updateError;
    }

    return new Response(
      JSON.stringify({
        message: 'Notifications sent successfully',
        count: scheduledNotifications.length,
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error: any) {
    console.error('Error sending scheduled notifications:', error);
    return new Response(
      JSON.stringify({
        error: error.message || 'Failed to send scheduled notifications',
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});