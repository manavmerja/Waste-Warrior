import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Play, MapPin, Truck } from 'lucide-react';

export default function MapTracking() {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [workers, setWorkers] = useState([]);
  const [reports, setReports] = useState([]);
  const [collectionPoints, setCollectionPoints] = useState([]);
  const [selectedWorker, setSelectedWorker] = useState('all');
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    const mapboxToken = import.meta.env.VITE_MAPBOX_PUBLIC_TOKEN || 'pk.eyJ1IjoibG92YWJsZS1kZXYiLCJhIjoiY20yZ2t2anJoMDRkcDJyczVzaGVpYnZ6ZyJ9.5koDA9n6i6f_HR6BQyRSyg';
    mapboxgl.accessToken = mapboxToken;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [78.9629, 20.5937], // India center
      zoom: 5
    });

    map.current.on('load', () => {
      setMapReady(true);
    });

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (mapReady && map.current) {
      updateMapMarkers();
    }
  }, [mapReady, workers, reports, collectionPoints, selectedWorker]);

  const fetchData = async () => {
    try {
      const [workersRes, reportsRes, pointsRes] = await Promise.all([
        supabase.from('users').select('*').eq('role', 'worker'),
        supabase.from('reports').select('*'),
        supabase.from('collection_points').select('*')
      ]);

      if (workersRes.data) setWorkers(workersRes.data);
      if (reportsRes.data) setReports(reportsRes.data);
      if (pointsRes.data) setCollectionPoints(pointsRes.data);
    } catch (error) {
      console.error('Error fetching map data:', error);
      toast.error('Failed to load map data');
    }
  };

  const updateMapMarkers = () => {
    if (!map.current) return;

    // Clear existing markers
    const existingMarkers = document.querySelectorAll('.mapboxgl-marker');
    existingMarkers.forEach(marker => marker.remove());

    // Add worker markers
    const filteredWorkers = selectedWorker === 'all' 
      ? workers 
      : workers.filter(w => w.id === selectedWorker);

    filteredWorkers.forEach(worker => {
      if (worker.current_location_lat && worker.current_location_lng) {
        const el = document.createElement('div');
        el.className = 'worker-marker';
        el.innerHTML = `<div style="background: #3b82f6; color: white; padding: 8px; border-radius: 50%; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">🚛</div>`;
        
        new mapboxgl.Marker(el)
          .setLngLat([worker.current_location_lng, worker.current_location_lat])
          .setPopup(new mapboxgl.Popup().setHTML(`
            <strong>${worker.full_name || 'Worker'}</strong><br>
            <small>Vehicle: ${worker.vehicle_id || 'N/A'}</small>
          `))
          .addTo(map.current);
      }
    });

    // Add report markers
    reports.forEach(report => {
      if (report.location_lng && report.location_lat) {
        const el = document.createElement('div');
        el.innerHTML = `<div style="background: ${report.status === 'completed' ? '#10b981' : '#f59e0b'}; color: white; padding: 6px; border-radius: 50%; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">📍</div>`;
        
        new mapboxgl.Marker(el)
          .setLngLat([report.location_lng, report.location_lat])
          .setPopup(new mapboxgl.Popup().setHTML(`
            <strong>${report.title}</strong><br>
            <small>Status: ${report.status}</small>
          `))
          .addTo(map.current);
      }
    });

    // Add collection point markers
    collectionPoints.forEach(point => {
      if (point.location_lng && point.location_lat) {
        const el = document.createElement('div');
        el.innerHTML = `<div style="background: #8b5cf6; color: white; padding: 8px; border-radius: 50%; width: 35px; height: 35px; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">🏢</div>`;
        
        new mapboxgl.Marker(el)
          .setLngLat([point.location_lng, point.location_lat])
          .setPopup(new mapboxgl.Popup().setHTML(`
            <strong>${point.name}</strong><br>
            <small>${point.address}</small><br>
            <small>Capacity: ${point.current_load}/${point.capacity}kg</small>
          `))
          .addTo(map.current);
      }
    });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Map & Real-Time Tracking
          </CardTitle>
          <CardDescription>Track workers, reports, and collection points in real-time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <Select value={selectedWorker} onValueChange={setSelectedWorker}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Filter by worker" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Workers</SelectItem>
                {workers.map(worker => (
                  <SelectItem key={worker.id} value={worker.id}>
                    {worker.full_name || worker.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={fetchData}>
              Refresh Map
            </Button>
          </div>
          
          <div 
            ref={mapContainer} 
            className="w-full h-[600px] rounded-lg border"
          />

          <div className="mt-4 grid grid-cols-3 gap-4">
            <div className="flex items-center gap-2 p-3 bg-blue-500/10 rounded-lg">
              <Truck className="h-5 w-5 text-blue-500" />
              <div>
                <div className="text-sm font-medium">Workers</div>
                <div className="text-xs text-muted-foreground">{workers.length} active</div>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 bg-amber-500/10 rounded-lg">
              <MapPin className="h-5 w-5 text-amber-500" />
              <div>
                <div className="text-sm font-medium">Reports</div>
                <div className="text-xs text-muted-foreground">{reports.length} total</div>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 bg-purple-500/10 rounded-lg">
              <MapPin className="h-5 w-5 text-purple-500" />
              <div>
                <div className="text-sm font-medium">Collection Points</div>
                <div className="text-xs text-muted-foreground">{collectionPoints.length} locations</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
