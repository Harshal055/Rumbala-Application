import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const REVENUECAT_WEBHOOK_SECRET = Deno.env.get('REVENUECAT_WEBHOOK_SECRET') || '';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

serve(async (req) => {
    if (req.method !== 'POST') {
        return new Response('Method not allowed', { status: 405 });
    }

    try {
        const bodyText = await req.text();
        const authHeader = req.headers.get('Authorization');

        if (!REVENUECAT_WEBHOOK_SECRET) {
            console.error("REVENUECAT_WEBHOOK_SECRET is not set.");
            return new Response("Internal Server Error", { status: 500 });
        }

        if (authHeader !== `Bearer ${REVENUECAT_WEBHOOK_SECRET}` && authHeader !== REVENUECAT_WEBHOOK_SECRET) {
            console.error("Unauthorized request.");
            return new Response("Unauthorized", { status: 401 });
        }

        let payload;
        try {
            payload = JSON.parse(bodyText);
        } catch (e) {
            return new Response("Invalid JSON", { status: 400 });
        }

        const event = payload?.event;
        if (!event || !event.app_user_id) {
            return new Response("Invalid event payload", { status: 400 });
        }

        const userId = event.app_user_id;
        const eventType = event.type; // INITIAL_PURCHASE, RENEWAL, CANCELLATION, EXPIRATION, NON_RENEWING_PURCHASE
        const productId = event.product_id || '';
        
        console.log(`Processing ${eventType} for user ${userId} and product ${productId}`);

        // Consumable dare-card packs (NON_RENEWING_PURCHASE) are granted CLIENT-SIDE
        // via the add_purchased_cards RPC right after purchase. To avoid double-
        // granting, the webhook intentionally does NOT add cards here. It only
        // handles subscriptions / Pro below. (Lifetime Pro also arrives as
        // NON_RENEWING_PURCHASE and is handled by the entitlement check below.)
        //
        // If you later switch to webhook-only card grants (receipt-verified), move
        // the card-granting here and REVOKE EXECUTE on add_purchased_cards from
        // `authenticated` so the client can no longer self-grant.

        // Handle Subscriptions (Pro)
        const entitlementIds = event.entitlement_ids || [];
        const isProEntitlement = entitlementIds.some((e: string) => 
            e.toLowerCase().includes('pro') || e.toLowerCase() === 'rumbala pro' || e.toLowerCase() === 'rumbale pro'
        );

        if (isProEntitlement) {
            let isPro = false;
            let expiresAt = null;

            if (eventType === 'INITIAL_PURCHASE' || eventType === 'RENEWAL' || eventType === 'UNCANCELLATION') {
                isPro = true;
                expiresAt = event.expiration_at_ms ? new Date(event.expiration_at_ms).toISOString() : null;
            } else if (eventType === 'EXPIRATION') {
                isPro = false;
                expiresAt = null;
            } else if (eventType === 'NON_RENEWING_PURCHASE') {
                // Lifetime Pro purchase
                isPro = true;
                expiresAt = null;
            } else {
                // Other events (like CANCELLATION) don't immediately revoke access
                return new Response("Event acknowledged, no action needed", { status: 200 });
            }

            console.log(`Setting user ${userId} Pro status to ${isPro} with expiry ${expiresAt}`);
            
            // First, get the user's profile to check for a partner_email
            const { data: profile } = await supabase
                .from('profiles')
                .select('partner_email')
                .eq('id', userId)
                .single();
            
            const partnerEmail = profile?.partner_email;

            const { error } = await supabase
                .from('profiles')
                .update({ 
                    is_pro: isPro, 
                    pro_expires_at: expiresAt,
                    updated_at: new Date().toISOString()
                })
                .eq('id', userId);

            if (error) {
                console.error('Error updating Pro status:', error);
                return new Response("Error updating database", { status: 500 });
            }

            // If a partner email is set, also grant them Pro
            if (partnerEmail) {
                console.log(`Granting Pro to partner: ${partnerEmail}`);
                const { error: partnerError } = await supabase
                    .from('profiles')
                    .update({ 
                        is_pro: isPro, 
                        pro_expires_at: expiresAt,
                        updated_at: new Date().toISOString()
                    })
                    .eq('email', partnerEmail);
                
                if (partnerError) {
                    console.error('Error updating partner Pro status:', partnerError);
                    // Do not fail the whole request just because partner failed
                }
            }
        }

        return new Response("Success", { status: 200 });

    } catch (err: any) {
        console.error('Unhandled webhook error:', err);
        return new Response("Internal Server Error", { status: 500 });
    }
})
