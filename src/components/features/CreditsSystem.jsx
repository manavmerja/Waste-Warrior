import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Coins, Gift, History, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';

export default function CreditsSystem() {
  const { user, userProfile } = useAuth();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [redeemCode, setRedeemCode] = useState('');
  const [creditsHistory, setCreditsHistory] = useState([]);
  const [redeemHistory, setRedeemHistory] = useState([]);

  useEffect(() => {
    if (user) {
      fetchCreditsHistory();
      fetchRedeemHistory();
    }
  }, [user]);

  const fetchCreditsHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('credits_log')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setCreditsHistory(data || []);
    } catch (error) {
      console.error('Error fetching credits history:', error);
    }
  };

  const fetchRedeemHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('redeems')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setRedeemHistory(data || []);
    } catch (error) {
      console.error('Error fetching redeem history:', error);
    }
  };

  const generateRedeemCode = async (creditsToRedeem) => {
    if (creditsToRedeem > userProfile?.credits) {
      toast({
        title: t('credits.insufficient') || 'Insufficient credits',
        description: t('credits.insufficientDesc') || "You don't have enough credits for this redemption",
        variant: "destructive"
      });
      return;
    }

    if (creditsToRedeem < 50) {
      toast({
        title: t('credits.minimum') || 'Minimum redemption',
        description: t('credits.minimumDesc') || 'Minimum 50 credits required for redemption',
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      // Generate unique redeem code
      const code = `GC${Date.now().toString().slice(-6)}${Math.random().toString(36).substring(2, 5).toUpperCase()}`;

      // Create redeem record
      const { data, error } = await supabase
        .from('redeems')
        .insert({
          user_id: user.id,
          code: code,
          credits_used: creditsToRedeem,
          status: 'active'
        })
        .select()
        .single();

      if (error) throw error;

      // Deduct credits from user
      await supabase
        .from('users')
        .update({ credits: userProfile.credits - creditsToRedeem })
        .eq('id', user.id);

      // Log the credit usage
      await supabase
        .from('credits_log')
        .insert({
          user_id: user.id,
          amount: -creditsToRedeem,
          reason: 'Credits redeemed for coupon',
          reference_id: data.id
        });

      toast({
        title: t('credits.redeemSuccessTitle') || 'Redeem code generated!',
        description: t('credits.redeemSuccessDesc', { code }) || `Your redeem code: ${code}. Save this code to use at participating stores.`
      });

      // Refresh data
      fetchCreditsHistory();
      fetchRedeemHistory();

    } catch (error) {
      console.error('Error generating redeem code:', error);
      toast({
        title: t('common.error') || 'Error',
        description: error.message || t('credits.redeemError') || "Failed to generate redeem code",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'used': return 'bg-blue-500';
      case 'expired': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      {/* Credits Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-primary" />
            {t('credits.title')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center">
            <div className="text-4xl font-bold text-primary mb-2">
              {userProfile?.credits || 0}
            </div>
            <p className="text-muted-foreground">{t('credits.available')}</p>
          </div>
        </CardContent>
      </Card>

      {/* Redeem Credits */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-primary" />
            {t('credits.redeem')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {t('credits.redeemDesc')}
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              onClick={() => generateRedeemCode(50)}
              disabled={loading || (userProfile?.credits || 0) < 50}
              variant="outline"
              className="flex flex-col h-auto py-4"
            >
              <div className="font-semibold">{t('credits.tier50')}</div>
              <div className="text-xs text-muted-foreground">{t('credits.tier50Desc')}</div>
            </Button>
            
            <Button
              onClick={() => generateRedeemCode(100)}
              disabled={loading || (userProfile?.credits || 0) < 100}
              variant="outline"
              className="flex flex-col h-auto py-4"
            >
              <div className="font-semibold">{t('credits.tier100')}</div>
              <div className="text-xs text-muted-foreground">{t('credits.tier100Desc')}</div>
            </Button>
            
            <Button
              onClick={() => generateRedeemCode(200)}
              disabled={loading || (userProfile?.credits || 0) < 200}
              variant="outline"
              className="flex flex-col h-auto py-4"
            >
              <div className="font-semibold">{t('credits.tier200')}</div>
              <div className="text-xs text-muted-foreground">{t('credits.tier200Desc')}</div>
            </Button>
          </div>

          {loading && (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              {t('credits.generating')}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5 text-primary" />
            {t('credits.recentTransactions')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {creditsHistory.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">
                {t('credits.noTransactions')}
              </p>
            ) : (
              creditsHistory.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between border-b pb-2">
                  <div>
                    <p className="font-medium">{transaction.reason}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(transaction.created_at)}
                    </p>
                  </div>
                  <div className={`font-semibold ${transaction.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {transaction.amount > 0 ? '+' : ''}{transaction.amount}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Redeem Codes */}
      <Card>
        <CardHeader>
          <CardTitle>{t('credits.myRedeemCodes')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {redeemHistory.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">
                {t('credits.noRedeems')}
              </p>
            ) : (
              redeemHistory.map((redeem) => (
                <div key={redeem.id} className="flex items-center justify-between border border-border rounded-lg p-3">
                  <div>
                    <div className="font-mono font-bold text-lg">{redeem.code}</div>
                    <p className="text-sm text-muted-foreground">
                      {redeem.credits_used} credits • {formatDate(redeem.created_at)}
                    </p>
                    {redeem.expires_at && (
                      <p className="text-xs text-muted-foreground">
                        Expires: {formatDate(redeem.expires_at)}
                      </p>
                    )}
                  </div>
                  <Badge className={getStatusColor(redeem.status)}>
                    {redeem.status}
                  </Badge>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}