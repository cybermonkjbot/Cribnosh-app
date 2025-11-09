"use client";

import { useState } from 'react';
import { useSessionToken } from '@/hooks/useSessionToken';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  MapPin, 
  Search, 
  Filter,
  Plus,
  Edit,
  Trash2,
  Eye,
  Users,
  ChefHat,
  Clock,
  CheckCircle,
  XCircle,
  Globe,
  Building,
  Navigation
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils/number-format';

interface City {
  _id: Id<"cities">;
  name: string;
  slug: string;
  country: string;
  region: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  timezone: string;
  population: number;
  isActive: boolean;
  isLaunchCity: boolean;
  launchDate?: number;
  coverageRadius: number; // in km
  deliveryZones: {
    name: string;
    coordinates: { latitude: number; longitude: number }[];
    isActive: boolean;
  }[];
  stats: {
    totalUsers: number;
    totalChefs: number;
    totalOrders: number;
    averageOrderValue: number;
    lastOrderAt?: number;
  };
  settings: {
    minOrderValue: number;
    deliveryFee: number;
    estimatedDeliveryTime: number;
    operatingHours: {
      open: string;
      close: string;
      timezone: string;
    };
  };
  createdAt: number;
  updatedAt: number;
}

export default function CitiesManagementPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [countryFilter, setCountryFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('name');
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // New city form
  const [newCity, setNewCity] = useState({
    name: '',
    country: '',
    region: '',
    latitude: 0,
    longitude: 0,
    timezone: '',
    population: 0,
    isActive: true,
    isLaunchCity: false,
    coverageRadius: 10,
    minOrderValue: 0,
    deliveryFee: 0,
    estimatedDeliveryTime: 30,
    operatingHours: {
      open: '09:00',
      close: '22:00',
      timezone: 'GMT'
    }
  });

  // Fetch data
  const sessionToken = useSessionToken();
  const cities = useQuery(api.queries.cities.getCities, sessionToken ? { sessionToken } : "skip");
  const countries = useQuery(api.queries.cities.getCountries, sessionToken ? { sessionToken } : "skip");

  // Mutations
  const createCity = useMutation(api.mutations.cities.createCity);
  const updateCity = useMutation(api.mutations.cities.updateCity);
  const deleteCity = useMutation(api.mutations.cities.deleteCity);
  const toggleCityStatus = useMutation(api.mutations.cities.toggleCityStatus);

  const handleCreateCity = async () => {
    if (!newCity.name.trim() || !newCity.country.trim()) {
      setError('Name and country are required');
      return;
    }

    try {
      await createCity({...newCity,
        slug: newCity.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        coordinates: {
          latitude: newCity.latitude,
          longitude: newCity.longitude
        },
        deliveryZones: [],
        stats: {
          totalUsers: 0,
          totalChefs: 0,
          totalOrders: 0,
          averageOrderValue: 0
        },
        settings: {
          minOrderValue: newCity.minOrderValue,
          deliveryFee: newCity.deliveryFee,
          estimatedDeliveryTime: newCity.estimatedDeliveryTime,
          operatingHours: newCity.operatingHours
        },
        sessionToken: sessionToken || undefined
      });
      
      setNewCity({
        name: '',
        country: '',
        region: '',
        latitude: 0,
        longitude: 0,
        timezone: '',
        population: 0,
        isActive: true,
        isLaunchCity: false,
        coverageRadius: 10,
        minOrderValue: 0,
        deliveryFee: 0,
        estimatedDeliveryTime: 30,
        operatingHours: {
          open: '09:00',
          close: '22:00',
          timezone: 'GMT'
        }
      });
      setIsCreating(false);
      setSuccess('City created successfully');
      setError(null);
    } catch (err) {
      setError('Failed to create city');
    }
  };

  const handleUpdateCity = async (cityId: Id<"cities">, updates: Partial<City>) => {
    try {
      await updateCity({cityId, ...updates,
    sessionToken: sessionToken || undefined
  });
      setSuccess('City updated successfully');
      setError(null);
      setIsEditing(null);
    } catch (err) {
      setError('Failed to update city');
    }
  };

  const handleDeleteCity = async (cityId: Id<"cities">) => {
    if (confirm('Are you sure you want to delete this city?')) {
      try {
        await deleteCity({cityId,
    sessionToken: sessionToken || undefined
  });
        setSuccess('City deleted successfully');
        setError(null);
      } catch (err) {
        setError('Failed to delete city');
      }
    }
  };

  const handleToggleStatus = async (cityId: Id<"cities">) => {
    try {
      await toggleCityStatus({cityId,
    sessionToken: sessionToken || undefined
  });
      setSuccess('City status updated successfully');
      setError(null);
    } catch (err) {
      setError('Failed to update city status');
    }
  };

  const filteredCities = cities?.filter((city: any) => {
    const matchesSearch = 
      city.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      city.country.toLowerCase().includes(searchTerm.toLowerCase()) ||
      city.region.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && city.isActive) ||
      (statusFilter === 'inactive' && !city.isActive) ||
      (statusFilter === 'launch' && city.isLaunchCity);
    
    const matchesCountry = countryFilter === 'all' || city.country === countryFilter;
    
    return matchesSearch && matchesStatus && matchesCountry;
  }).sort((a: any, b: any) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'users':
        return b.stats.totalUsers - a.stats.totalUsers;
      case 'chefs':
        return b.stats.totalChefs - a.stats.totalChefs;
      case 'orders':
        return b.stats.totalOrders - a.stats.totalOrders;
      case 'recent':
        return b.updatedAt - a.updatedAt;
      default:
        return 0;
    }
  }) || [];

  const getStatusBadge = (city: City) => {
    if (city.isLaunchCity) {
      return <Badge className="bg-blue-100 text-blue-800">Launch City</Badge>;
    }
    if (city.isActive) {
      return <Badge className="bg-green-100 text-green-800">Active</Badge>;
    }
    return <Badge className="bg-gray-100 text-gray-800">Inactive</Badge>;
  };

  const uniqueCountries = Array.from(new Set(cities?.map((city: any) => city.country) || []));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-asgard text-gray-900">Cities Management</h1>
          <p className="text-gray-600 font-satoshi mt-2">Manage cities and delivery coverage areas</p>
        </div>
        <Button
          onClick={() => setIsCreating(true)}
          className="bg-[#F23E2E] hover:bg-[#F23E2E]/90 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add City
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <MapPin className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Cities</p>
                <p className="text-2xl font-bold text-gray-900">{cities?.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Active Cities</p>
                <p className="text-2xl font-bold text-gray-900">
                  {cities?.filter((c: any) => c.isActive).length || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Users className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">
                  {cities?.reduce((sum: any, c: any) => sum + c.stats.totalUsers, 0) || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <ChefHat className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Chefs</p>
                <p className="text-2xl font-bold text-gray-900">
                  {cities?.reduce((sum: any, c: any) => sum + c.stats.totalChefs, 0) || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {success && (
        <Alert>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Create City Form */}
      {isCreating && (
        <Card>
          <CardHeader>
            <CardTitle>Add New City</CardTitle>
            <CardDescription>Add a new city to the delivery network</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">City Name</label>
                <Input
                  value={newCity.name}
                  onChange={(e) => setNewCity(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter city name"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Country</label>
                <Input
                  value={newCity.country}
                  onChange={(e) => setNewCity(prev => ({ ...prev, country: e.target.value }))}
                  placeholder="Enter country"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Region/State</label>
                <Input
                  value={newCity.region}
                  onChange={(e) => setNewCity(prev => ({ ...prev, region: e.target.value }))}
                  placeholder="Enter region or state"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Population</label>
                <Input
                  type="number"
                  value={newCity.population}
                  onChange={(e) => setNewCity(prev => ({ ...prev, population: parseInt(e.target.value) || 0 }))}
                  placeholder="Enter population"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Latitude</label>
                <Input
                  type="number"
                  step="0.000001"
                  value={newCity.latitude}
                  onChange={(e) => setNewCity(prev => ({ ...prev, latitude: parseFloat(e.target.value) || 0 }))}
                  placeholder="0.000000"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Longitude</label>
                <Input
                  type="number"
                  step="0.000001"
                  value={newCity.longitude}
                  onChange={(e) => setNewCity(prev => ({ ...prev, longitude: parseFloat(e.target.value) || 0 }))}
                  placeholder="0.000000"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Timezone</label>
                <Input
                  value={newCity.timezone}
                  onChange={(e) => setNewCity(prev => ({ ...prev, timezone: e.target.value }))}
                  placeholder="GMT+0"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Coverage Radius (km)</label>
                <Input
                  type="number"
                  value={newCity.coverageRadius}
                  onChange={(e) => setNewCity(prev => ({ ...prev, coverageRadius: parseInt(e.target.value) || 10 }))}
                  placeholder="10"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Min Order Value (£)</label>
                <Input
                  type="number"
                  step="0.01"
                  value={newCity.minOrderValue}
                  onChange={(e) => setNewCity(prev => ({ ...prev, minOrderValue: parseFloat(e.target.value) || 0 }))}
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Delivery Fee (£)</label>
                <Input
                  type="number"
                  step="0.01"
                  value={newCity.deliveryFee}
                  onChange={(e) => setNewCity(prev => ({ ...prev, deliveryFee: parseFloat(e.target.value) || 0 }))}
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Operating Hours</label>
                <div className="flex gap-2">
                  <Input
                    type="time"
                    value={newCity.operatingHours.open}
                    onChange={(e) => setNewCity(prev => ({ 
                      ...prev, 
                      operatingHours: { ...prev.operatingHours, open: e.target.value }
                    }))}
                  />
                  <span className="flex items-center text-gray-700">to</span>
                  <Input
                    type="time"
                    value={newCity.operatingHours.close}
                    onChange={(e) => setNewCity(prev => ({ 
                      ...prev, 
                      operatingHours: { ...prev.operatingHours, close: e.target.value }
                    }))}
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Est. Delivery Time (min)</label>
                <Input
                  type="number"
                  value={newCity.estimatedDeliveryTime}
                  onChange={(e) => setNewCity(prev => ({ ...prev, estimatedDeliveryTime: parseInt(e.target.value) || 30 }))}
                  placeholder="30"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">City Settings</label>
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={newCity.isActive}
                    onChange={(e) => setNewCity(prev => ({ ...prev, isActive: e.target.checked }))}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm text-gray-700">Active</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={newCity.isLaunchCity}
                    onChange={(e) => setNewCity(prev => ({ ...prev, isLaunchCity: e.target.checked }))}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm text-gray-700">Launch City</span>
                </label>
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleCreateCity} className="bg-[#F23E2E] hover:bg-[#F23E2E]/90">
                Add City
              </Button>
              <Button variant="outline" onClick={() => setIsCreating(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="relative flex-1 min-w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4" />
          <Input
            placeholder="Search cities..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-32">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="launch">Launch Cities</SelectItem>
          </SelectContent>
        </Select>
        
        <Select value={countryFilter} onValueChange={setCountryFilter}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Country" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Countries</SelectItem>
            {uniqueCountries.map((country: any) => (
              <SelectItem key={country} value={country}>{country}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name">Name</SelectItem>
            <SelectItem value="users">Users</SelectItem>
            <SelectItem value="chefs">Chefs</SelectItem>
            <SelectItem value="orders">Orders</SelectItem>
            <SelectItem value="recent">Recent</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Cities Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredCities.map((city: any) => (
          <Card key={city._id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">{city.name}</CardTitle>
                  <CardDescription className="flex items-center gap-1">
                    <Globe className="w-4 h-4" />
                    {city.country}, {city.region}
                  </CardDescription>
                </div>
                {getStatusBadge(city)}
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* City Info */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-gray-500" />
                  <span>{city.stats.totalUsers} users</span>
                </div>
                <div className="flex items-center gap-2">
                  <ChefHat className="w-4 h-4 text-gray-500" />
                  <span>{city.stats.totalChefs} chefs</span>
                </div>
                <div className="flex items-center gap-2">
                  <Building className="w-4 h-4 text-gray-500" />
                  <span>{city.population.toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Navigation className="w-4 h-4 text-gray-500" />
                  <span>{city.coverageRadius}km</span>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                <div className="text-center">
                  <p className="font-medium">{city.stats.totalOrders}</p>
                  <p className="text-xs text-gray-600">Orders</p>
                </div>
                <div className="text-center">
                  <p className="font-medium">{formatCurrency(city.stats.averageOrderValue, { currency: 'GBP' })}</p>
                  <p className="text-xs text-gray-600">Avg Order</p>
                </div>
              </div>

              {/* Settings */}
              <div className="text-sm text-gray-600 space-y-1">
                <div className="flex justify-between">
                  <span>Min Order:</span>
                  <span>{formatCurrency(city.settings.minOrderValue, { currency: 'GBP' })}</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery Fee:</span>
                  <span>{formatCurrency(city.settings.deliveryFee, { currency: 'GBP' })}</span>
                </div>
                <div className="flex justify-between">
                  <span>Est. Time:</span>
                  <span>{city.settings.estimatedDeliveryTime} min</span>
                </div>
                <div className="flex justify-between">
                  <span>Hours:</span>
                  <span>{city.settings.operatingHours.open} - {city.settings.operatingHours.close}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  onClick={() => {/* View city details */}}
                >
                  <Eye className="w-4 h-4 mr-1" />
                  View
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsEditing(city._id)}
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleToggleStatus(city._id)}
                  className={city.isActive ? 'text-red-600 hover:text-red-700' : 'text-green-600 hover:text-green-700'}
                >
                  {city.isActive ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDeleteCity(city._id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredCities.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <MapPin className="w-12 h-12 mx-auto mb-4 text-gray-500" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No cities found</h3>
            <p className="text-gray-600">Add your first city to get started</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
