import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Recycle, DollarSign, Package, Store } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

export default function ScrapDealerDashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [dealerProfile, setDealerProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rates, setRates] = useState({
    plastic: '',
    paper: '',
    metal: '',
    glass: '',
    electronics: ''
  });

  useEffect(() => {
    if (user?.id) {
      fetchDealerData();
    }
  }, [user]);

  const fetchDealerData = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('scrap_dealers')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setDealerProfile(data);
        if (data.rates) {
          setRates({
            plastic: data.rates.plastic || '',
            paper: data.rates.paper || '',
            metal: data.rates.metal || '',
            glass: data.rates.glass || '',
            electronics: data.rates.electronics || ''
          });
        }
      }
    } catch (error) {
      console.error('Error fetching dealer data:', error);
      toast.error('Failed to load dealer data');
    } finally {
      setLoading(false);
    }
  };

  const handleRateChange = (material, value) => {
    setRates(prev => ({
      ...prev,
      [material]: value
    }));
  };

  const saveRates = async () => {
    try {
      const ratesData = Object.fromEntries(
        Object.entries(rates).filter(([_, value]) => value !== '')
      );

      if (dealerProfile) {
        const { error } = await supabase
          .from('scrap_dealers')
          .update({ rates: ratesData })
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('scrap_dealers')
          .insert({
            user_id: user.id,
            business_name: 'New Dealer',
            rates: ratesData
          });

        if (error) throw error;
      }

      toast.success('Rates updated successfully!');
      fetchDealerData();
    } catch (error) {
      console.error('Error saving rates:', error);
      toast.error('Failed to save rates');
    }
  };

  const updateProfile = async (updates) => {
    try {
      if (!dealerProfile) {
        const { error } = await supabase
          .from('scrap_dealers')
          .insert({
            user_id: user.id,
            ...updates
          });

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('scrap_dealers')
          .update(updates)
          .eq('user_id', user.id);

        if (error) throw error;
      }

      toast.success('Profile updated successfully!');
      fetchDealerData();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-3xl">
            <Recycle className="mr-3 h-8 w-8 text-primary" />
            Scrap Dealer Dashboard
          </CardTitle>
          <CardDescription>Manage your scrap business and rates</CardDescription>
        </CardHeader>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Verification Status</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant={dealerProfile?.is_verified ? "outline" : "secondary"} className={dealerProfile?.is_verified ? "bg-green-500/10" : ""}>
              {dealerProfile?.is_verified ? 'Verified' : 'Pending Verification'}
            </Badge>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Business Name</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-medium">{dealerProfile?.business_name || 'Not set'}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="rates" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="rates">
            <DollarSign className="mr-2 h-4 w-4" />
            Material Rates
          </TabsTrigger>
          <TabsTrigger value="profile">
            <Store className="mr-2 h-4 w-4" />
            Business Profile
          </TabsTrigger>
        </TabsList>

        <TabsContent value="rates">
          <Card>
            <CardHeader>
              <CardTitle>Set Material Rates</CardTitle>
              <CardDescription>Set your buying rates per kg for different materials</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="plastic">Plastic (₹/kg)</Label>
                  <Input
                    id="plastic"
                    type="number"
                    placeholder="e.g., 15"
                    value={rates.plastic}
                    onChange={(e) => handleRateChange('plastic', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="paper">Paper (₹/kg)</Label>
                  <Input
                    id="paper"
                    type="number"
                    placeholder="e.g., 10"
                    value={rates.paper}
                    onChange={(e) => handleRateChange('paper', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="metal">Metal (₹/kg)</Label>
                  <Input
                    id="metal"
                    type="number"
                    placeholder="e.g., 25"
                    value={rates.metal}
                    onChange={(e) => handleRateChange('metal', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="glass">Glass (₹/kg)</Label>
                  <Input
                    id="glass"
                    type="number"
                    placeholder="e.g., 5"
                    value={rates.glass}
                    onChange={(e) => handleRateChange('glass', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="electronics">Electronics (₹/kg)</Label>
                  <Input
                    id="electronics"
                    type="number"
                    placeholder="e.g., 30"
                    value={rates.electronics}
                    onChange={(e) => handleRateChange('electronics', e.target.value)}
                  />
                </div>
              </div>
              <Button onClick={saveRates} className="w-full">
                <Package className="mr-2 h-4 w-4" />
                Save Rates
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Business Profile</CardTitle>
              <CardDescription>Manage your business information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {dealerProfile ? (
                <>
                  <div className="space-y-2">
                    <Label>Business Name</Label>
                    <p className="text-lg font-medium">{dealerProfile.business_name}</p>
                  </div>
                  <div className="space-y-2">
                    <Label>License Number</Label>
                    <p className="text-lg">{dealerProfile.license_number || 'Not provided'}</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Contact Phone</Label>
                    <p className="text-lg">{dealerProfile.contact_phone || 'Not provided'}</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Working Hours</Label>
                    <p className="text-lg">{dealerProfile.working_hours}</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Service Area</Label>
                    <p className="text-lg">{dealerProfile.service_area || 'Not specified'}</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Verification Status</Label>
                    <Badge variant={dealerProfile.is_verified ? "outline" : "secondary"}>
                      {dealerProfile.is_verified ? 'Verified Dealer' : 'Awaiting Verification'}
                    </Badge>
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">Complete your business profile to start accepting pickups</p>
                  <Button onClick={() => updateProfile({ business_name: 'New Dealer' })}>
                    Create Profile
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
