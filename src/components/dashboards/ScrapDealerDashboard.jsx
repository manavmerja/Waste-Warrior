import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import {
  Package, TrendingUp, DollarSign, MapPin, Phone, Mail, Clock, 
  CheckCircle, AlertCircle, LogOut, User, FileText
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';

export default function ScrapDealerDashboard() {
  const { t, i18n } = useTranslation();
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [activeSection, setActiveSection] = useState('dashboard');
  const [dealerProfile, setDealerProfile] = useState(null);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalPickups: 0,
    completedToday: 0,
    totalEarnings: 0,
  });

  const [editedRates, setEditedRates] = useState({
    plastic: '',
    paper: '',
    metal: '',
    glass: '',
    electronics: '',
  });

  const menuItems = [
    { id: 'dashboard', label: t('dealer.dashboard'), icon: TrendingUp },
    { id: 'pickups', label: t('dealer.availablePickups'), icon: Package },
    { id: 'rates', label: t('dealer.ratesServices'), icon: DollarSign },
    { id: 'history', label: t('dealer.history'), icon: FileText },
    { id: 'profile', label: t('dealer.profile'), icon: User },
  ];

  useEffect(() => {
    fetchDealerData();
    fetchRequests();
    fetchStats();
  }, [user]);

  const fetchDealerData = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('scrap_dealers')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      
      setDealerProfile(data);
      if (data?.rates) {
        setEditedRates({
          plastic: data.rates.plastic || '',
          paper: data.rates.paper || '',
          metal: data.rates.metal || '',
          glass: data.rates.glass || '',
          electronics: data.rates.electronics || '',
        });
      }
    } catch (error) {
      console.error('Error fetching dealer data:', error);
    }
  };

  const fetchRequests = async () => {
    if (!user || !dealerProfile) return;

    try {
      const { data, error } = await supabase
        .from('scrap_pickup_requests')
        .select('*')
        .or(`status.eq.pending,dealer_id.eq.${dealerProfile?.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    if (!user || !dealerProfile) return;

    try {
      const today = new Date().toISOString().split('T')[0];

      const { data: allPickups } = await supabase
        .from('scrap_pickup_requests')
        .select('*')
        .eq('dealer_id', dealerProfile.id);

      const { data: todayPickups } = await supabase
        .from('scrap_pickup_requests')
        .select('*')
        .eq('dealer_id', dealerProfile.id)
        .eq('status', 'completed')
        .gte('completed_at', `${today}T00:00:00`);

      const { data: userCredits } = await supabase
        .from('users')
        .select('credits')
        .eq('id', user.id)
        .single();

      setStats({
        totalPickups: allPickups?.length || 0,
        completedToday: todayPickups?.length || 0,
        totalEarnings: userCredits?.credits || 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleAcceptRequest = async (requestId) => {
    try {
      const { error } = await supabase
        .from('scrap_pickup_requests')
        .update({
          status: 'accepted',
          dealer_id: dealerProfile.id,
        })
        .eq('id', requestId);

      if (error) throw error;

      toast({
        title: t('common.success'),
        description: t('dealer.requestAccepted'),
      });

      fetchRequests();
      fetchStats();
    } catch (error) {
      toast({
        title: t('common.error'),
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleCompletePickup = async (requestId) => {
    try {
      const { error } = await supabase
        .from('scrap_pickup_requests')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
        })
        .eq('id', requestId);

      if (error) throw error;

      toast({
        title: t('common.success'),
        description: t('dealer.pickupCompleted'),
      });

      fetchRequests();
      fetchStats();
    } catch (error) {
      toast({
        title: t('common.error'),
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleUpdateRates = async () => {
    try {
      const { error } = await supabase
        .from('scrap_dealers')
        .update({ rates: editedRates })
        .eq('id', dealerProfile.id);

      if (error) throw error;

      toast({
        title: t('common.success'),
        description: t('dealer.ratesUpdated'),
      });

      fetchDealerData();
    } catch (error) {
      toast({
        title: t('common.error'),
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleLogout = async () => {
    await signOut();
  };

  const getStatusBadge = (status) => {
    const variants = {
      pending: 'secondary',
      accepted: 'default',
      in_progress: 'default',
      completed: 'success',
      cancelled: 'destructive',
    };
    return <Badge variant={variants[status] || 'secondary'}>{status}</Badge>;
  };

  // Dashboard Section
  const DashboardSection = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div>
        <h2 className="text-3xl font-bold">{t('dealer.welcome')}, {dealerProfile?.business_name}!</h2>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-muted-foreground">{t('dealer.verificationStatus')}:</span>
          {dealerProfile?.is_verified ? 
            <Badge variant="success">{t('dealer.verified')}</Badge> :
            <Badge variant="secondary">{t('dealer.pending')}</Badge>
          }
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('dealer.totalPickups')}</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPickups}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('dealer.completedToday')}</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completedToday}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('dealer.totalEarnings')}</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalEarnings} {t('dealer.credits')}</div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );

  // Pickups Section
  const PickupsSection = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div>
        <h2 className="text-3xl font-bold">{t('dealer.availableRequests')}</h2>
        <p className="text-muted-foreground mt-1">{t('dealer.availablePickups')}</p>
      </div>

      {loading ? (
        <div className="text-center py-12">{t('common.loading')}</div>
      ) : requests.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">{t('dealer.noRequests')}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => (
            <Card key={request.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <CardTitle>{t('dealer.requestDetails')}</CardTitle>
                    <CardDescription>
                      {request.waste_type} - {request.waste_volume} {t('dealer.kg')}
                      {request.waste_volume > 50 && (
                        <Badge variant="destructive" className="ml-2">{t('dealer.largeVolume')}</Badge>
                      )}
                    </CardDescription>
                  </div>
                  {getStatusBadge(request.status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{t('dealer.resident')}</p>
                    <p className="text-sm text-muted-foreground">{request.resident_name}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{t('dealer.contact')}</p>
                    <p className="text-sm text-muted-foreground">{request.contact_phone}</p>
                  </div>
                  <div className="space-y-1 col-span-2">
                    <p className="text-sm font-medium">{t('dealer.address')}</p>
                    <p className="text-sm text-muted-foreground">{request.address}</p>
                  </div>
                  {request.proposed_rate && (
                    <div className="space-y-1">
                      <p className="text-sm font-medium">{t('dealer.proposedRate')}</p>
                      <p className="text-sm text-muted-foreground">₹{request.proposed_rate}/{t('dealer.kg')}</p>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  {request.location_lat && request.location_lng && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(`https://www.google.com/maps?q=${request.location_lat},${request.location_lng}`, '_blank')}
                    >
                      <MapPin className="h-4 w-4 mr-2" />
                      {t('dealer.viewOnMap')}
                    </Button>
                  )}
                  {request.status === 'pending' && (
                    <Button size="sm" onClick={() => handleAcceptRequest(request.id)}>
                      {t('dealer.acceptRequest')}
                    </Button>
                  )}
                  {request.status === 'accepted' && (
                    <Button size="sm" onClick={() => handleCompletePickup(request.id)}>
                      {t('dealer.markComplete')}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </motion.div>
  );

  // Rates Section
  const RatesSection = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div>
        <h2 className="text-3xl font-bold">{t('dealer.myRates')}</h2>
        <p className="text-muted-foreground mt-1">{t('dealer.ratesServices')}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('dealer.updateRates')}</CardTitle>
          <CardDescription>{t('dealer.ratePerKg')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.keys(editedRates).map((material) => (
            <div key={material} className="grid grid-cols-2 gap-4 items-center">
              <Label htmlFor={material} className="capitalize">{material}</Label>
              <Input
                id={material}
                type="number"
                value={editedRates[material]}
                onChange={(e) => setEditedRates({ ...editedRates, [material]: e.target.value })}
                placeholder="0.00"
              />
            </div>
          ))}
          <Button onClick={handleUpdateRates} className="w-full">
            {t('dealer.saveChanges')}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('dealer.contactInfo')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3">
            <Clock className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">{t('dealer.workingHours')}</p>
              <p className="text-sm text-muted-foreground">{dealerProfile?.working_hours || '9:00 AM - 6:00 PM'}</p>
            </div>
          </div>
          <Separator />
          <div className="flex items-center gap-3">
            <Phone className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">{t('dealer.contact')}</p>
              <p className="text-sm text-muted-foreground">{dealerProfile?.contact_phone || 'N/A'}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  // Profile Section
  const ProfileSection = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div>
        <h2 className="text-3xl font-bold">{t('dealer.profile')}</h2>
        <p className="text-muted-foreground mt-1">{t('dealer.editProfile')}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{dealerProfile?.business_name}</CardTitle>
          <CardDescription>
            {t('dealer.dealerId')}: {dealerProfile?.id?.slice(0, 8)}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>{t('dealer.licenseNumber')}</Label>
              <p className="text-sm mt-1">{dealerProfile?.license_number || 'N/A'}</p>
            </div>
            <div>
              <Label>{t('dealer.serviceArea')}</Label>
              <p className="text-sm mt-1">{dealerProfile?.service_area || 'N/A'}</p>
            </div>
            <div>
              <Label>{t('dealer.verificationStatus')}</Label>
              <p className="text-sm mt-1">
                {dealerProfile?.is_verified ? t('dealer.verified') : t('dealer.pending')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  // History Section
  const HistorySection = () => {
    const completedRequests = requests.filter(r => r.status === 'completed');

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div>
          <h2 className="text-3xl font-bold">{t('dealer.history')}</h2>
          <p className="text-muted-foreground mt-1">{t('dealer.completedPickups')}</p>
        </div>

        {completedRequests.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">{t('dealer.noHistory')}</p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('dealer.date')}</TableHead>
                    <TableHead>{t('dealer.resident')}</TableHead>
                    <TableHead>{t('dealer.wasteType')}</TableHead>
                    <TableHead>{t('dealer.volume')}</TableHead>
                    <TableHead>{t('dealer.creditsEarned')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {completedRequests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell>
                        {new Date(request.completed_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>{request.resident_name}</TableCell>
                      <TableCell>{request.waste_type}</TableCell>
                      <TableCell>{request.waste_volume} {t('dealer.kg')}</TableCell>
                      <TableCell className="text-green-600 font-medium">
                        +{Math.floor(request.waste_volume * 5)} {t('dealer.credits')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </motion.div>
    );
  };

  // Registration Form for new dealers
  const RegistrationForm = () => {
    const [formData, setFormData] = useState({
      business_name: '',
      license_number: '',
      service_area: '',
      contact_phone: '',
      working_hours: '9:00 AM - 6:00 PM',
    });

    const handleRegister = async (e) => {
      e.preventDefault();
      
      try {
        const { error } = await supabase
          .from('scrap_dealers')
          .insert({
            user_id: user.id,
            ...formData,
          });

        if (error) throw error;

        toast({
          title: t('common.success'),
          description: t('dealer.registrationSuccess'),
        });

        fetchDealerData();
      } catch (error) {
        toast({
          title: t('common.error'),
          description: error.message,
          variant: 'destructive',
        });
      }
    };

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto space-y-6"
      >
        <div className="text-center">
          <h2 className="text-3xl font-bold">{t('dealer.registerAsDealer')}</h2>
          <p className="text-muted-foreground mt-2">{t('dealer.completeRegistration')}</p>
        </div>

        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <Label htmlFor="business_name">{t('dealer.businessName')} *</Label>
                <Input
                  id="business_name"
                  required
                  value={formData.business_name}
                  onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="license_number">{t('dealer.licenseNumber')}</Label>
                <Input
                  id="license_number"
                  value={formData.license_number}
                  onChange={(e) => setFormData({ ...formData, license_number: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="service_area">{t('dealer.serviceArea')} *</Label>
                <Input
                  id="service_area"
                  required
                  value={formData.service_area}
                  onChange={(e) => setFormData({ ...formData, service_area: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="contact_phone">{t('dealer.contactPhone')} *</Label>
                <Input
                  id="contact_phone"
                  required
                  type="tel"
                  value={formData.contact_phone}
                  onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="working_hours">{t('dealer.workingHours')}</Label>
                <Input
                  id="working_hours"
                  value={formData.working_hours}
                  onChange={(e) => setFormData({ ...formData, working_hours: e.target.value })}
                />
              </div>

              <Button type="submit" className="w-full">
                {t('dealer.submitRegistration')}
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  const renderSection = () => {
    switch (activeSection) {
      case 'dashboard':
        return <DashboardSection />;
      case 'pickups':
        return <PickupsSection />;
      case 'rates':
        return <RatesSection />;
      case 'history':
        return <HistorySection />;
      case 'profile':
        return <ProfileSection />;
      default:
        return <DashboardSection />;
    }
  };

  // Show registration form if dealer profile doesn't exist
  if (!loading && !dealerProfile) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-background to-muted/20 p-6">
        <RegistrationForm />
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-background to-muted/20">
        <Sidebar className="border-r">
          <SidebarContent>
            <div className="p-6">
              <h1 className="text-2xl font-bold">Waste Warrior</h1>
              <p className="text-sm text-muted-foreground">{t('dealer.dashboard')}</p>
            </div>

            <SidebarGroup>
              <SidebarGroupLabel>Menu</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {menuItems.map((item) => (
                    <SidebarMenuItem key={item.id}>
                      <SidebarMenuButton
                        onClick={() => setActiveSection(item.id)}
                        isActive={activeSection === item.id}
                        className="w-full"
                      >
                        <item.icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <div className="mt-auto p-4">
              <Button
                variant="outline"
                className="w-full"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4 mr-2" />
                {t('dealer.logout')}
              </Button>
            </div>
          </SidebarContent>
        </Sidebar>

        <main className="flex-1 overflow-y-auto">
          <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-4">
            <div className="flex items-center justify-between">
              <SidebarTrigger />
              <div className="flex items-center gap-4">
                <select
                  value={i18n.language}
                  onChange={(e) => i18n.changeLanguage(e.target.value)}
                  className="px-3 py-2 rounded-md border bg-background text-sm"
                >
                  <option value="en">English</option>
                  <option value="hi">हिंदी</option>
                  <option value="gu">ગુજરાતી</option>
                  <option value="ta">தமிழ்</option>
                </select>
              </div>
            </div>
          </header>

          <div className="container mx-auto p-6">
            {renderSection()}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
