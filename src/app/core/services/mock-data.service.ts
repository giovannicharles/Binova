import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class MockDataService {
  // Mock Bins Data
  getMockBins(zone?: string) {
    const allBins = [
      { _id: '1', binId: 'BIN-001', name: 'BAC-001', fillLevel: 85, status: 'online', zone: 'Bastos', address: 'Rue 12, Bastos', latitude: 3.8667, longitude: 11.5167, battery: 78, wasteType: 'mixed', capacity: 240, thresholdAttention: 80, thresholdCritical: 95, lastReading: new Date().toISOString() },
      { _id: '2', binId: 'BIN-002', name: 'BAC-002', fillLevel: 45, status: 'online', zone: 'Bastos', address: 'Avenue 5, Bastos', latitude: 3.8680, longitude: 11.5180, battery: 92, wasteType: 'mixed', capacity: 240, thresholdAttention: 80, thresholdCritical: 95, lastReading: new Date(Date.now() - 3600000).toISOString() },
      { _id: '3', binId: 'BIN-003', name: 'BAC-003', fillLevel: 97, status: 'online', zone: 'Bastos', address: 'Rue 8, Bastos', latitude: 3.8650, longitude: 11.5150, battery: 65, wasteType: 'organic', capacity: 240, thresholdAttention: 80, thresholdCritical: 95, lastReading: new Date(Date.now() - 7200000).toISOString() },
      { _id: '4', binId: 'BIN-004', name: 'BAC-004', fillLevel: 32, status: 'online', zone: 'Bastos', address: 'Boulevard 3, Bastos', latitude: 3.8670, longitude: 11.5170, battery: 88, wasteType: 'recyclable', capacity: 240, thresholdAttention: 80, thresholdCritical: 95, lastReading: new Date(Date.now() - 1800000).toISOString() },
      { _id: '5', binId: 'BIN-005', name: 'BAC-005', fillLevel: 68, status: 'offline', zone: 'Bastos', address: 'Rue 15, Bastos', latitude: 3.8690, longitude: 11.5190, battery: 12, wasteType: 'mixed', capacity: 240, thresholdAttention: 80, thresholdCritical: 95, lastReading: new Date(Date.now() - 10800000).toISOString() },
      { _id: '6', binId: 'BIN-006', name: 'BAC-006', fillLevel: 55, status: 'online', zone: 'Mvan', address: 'Route Mvan 1', latitude: 3.8700, longitude: 11.5200, battery: 85, wasteType: 'mixed', capacity: 240, thresholdAttention: 80, thresholdCritical: 95, lastReading: new Date(Date.now() - 5400000).toISOString() },
      { _id: '7', binId: 'BIN-007', name: 'BAC-007', fillLevel: 72, status: 'online', zone: 'Mvan', address: 'Route Mvan 2', latitude: 3.8710, longitude: 11.5210, battery: 79, wasteType: 'organic', capacity: 240, thresholdAttention: 80, thresholdCritical: 95, lastReading: new Date(Date.now() - 2700000).toISOString() },
      { _id: '8', binId: 'BIN-008', name: 'BAC-008', fillLevel: 91, status: 'online', zone: 'Mvan', address: 'Quartier Mvan', latitude: 3.8720, longitude: 11.5220, battery: 71, wasteType: 'mixed', capacity: 240, thresholdAttention: 80, thresholdCritical: 95, lastReading: new Date(Date.now() - 900000).toISOString() },
      { _id: '9', binId: 'BIN-009', name: 'BAC-009', fillLevel: 28, status: 'online', zone: 'Nkoldongo', address: 'Avenue Nkoldongo', latitude: 3.8730, longitude: 11.5230, battery: 94, wasteType: 'recyclable', capacity: 240, thresholdAttention: 80, thresholdCritical: 95, lastReading: new Date(Date.now() - 4500000).toISOString() },
      { _id: '10', binId: 'BIN-010', name: 'BAC-010', fillLevel: 63, status: 'online', zone: 'Nkoldongo', address: 'Rue Nkoldongo', latitude: 3.8740, longitude: 11.5240, battery: 82, wasteType: 'mixed', capacity: 240, thresholdAttention: 80, thresholdCritical: 95, lastReading: new Date(Date.now() - 3600000).toISOString() },
    ];
    
    if (zone) {
      return allBins.filter(bin => bin.zone === zone);
    }
    return allBins;
  }

  // Mock Reports Data
  getMockReports() {
    return [
      { _id: '1', title: 'Débordement bac central', category: 'overflow', zone: 'Bastos', priority: 'high', status: 'pending', createdAt: new Date().toISOString(), description: 'Le bac central déborde complètement', images: [], userId: 'user1' },
      { _id: '2', title: 'Dépôt sauvage rue 12', category: 'illegal_dump', zone: 'Mvan', priority: 'medium', status: 'in_progress', createdAt: new Date(Date.now() - 86400000).toISOString(), description: 'Dépôt sauvage en face du marché', images: [], userId: 'user2' },
      { _id: '3', title: 'Odeur nauséabonde', category: 'odor', zone: 'Bastos', priority: 'low', status: 'resolved', createdAt: new Date(Date.now() - 172800000).toISOString(), description: 'Odeur forte près du bac 3', images: [], userId: 'user1' },
      { _id: '4', title: 'Bac cassé', category: 'damage', zone: 'Nkoldongo', priority: 'high', status: 'pending', createdAt: new Date(Date.now() - 259200000).toISOString(), description: 'Le couvercle du bac est cassé', images: [], userId: 'user3' },
      { _id: '5', title: 'Insectes autour du bac', category: 'pest', zone: 'Mvan', priority: 'medium', status: 'in_progress', createdAt: new Date(Date.now() - 345600000).toISOString(), description: 'Présence de mouches et insectes', images: [], userId: 'user2' },
    ];
  }

  // Mock Dashboard Stats
  getMockDashboardStats() {
    return {
      bins: { total: 42, avgFillLevel: 67, critical: 3, full: 8, offline: 2, active: 40 },
      reports: { pending: 5, resolvedToday: 12, inProgress: 3, totalThisWeek: 28 },
      collections: { today: 145, thisWeek: 892, thisMonth: 3456 },
      users: { total: 1250, active: 980, newToday: 15 }
    };
  }

  // Mock Fill Trend Data (7 days)
  getMockFillTrend(days: number = 7) {
    const today = new Date();
    return Array.from({ length: days }, (_, i) => {
      const date = new Date(today);
      date.setDate(date.getDate() - (days - 1 - i));
      return {
        date: date.toISOString().split('T')[0],
        avgFill: Math.floor(Math.random() * 40) + 50
      };
    });
  }

  // Mock Awareness Articles
  getMockArticles() {
    return [
      { _id: '1', title: 'Comment trier vos déchets correctement', category: 'tri', content: 'Article complet sur le tri des déchets...', author: 'Admin', createdAt: new Date(Date.now() - 86400000).toISOString(), image: '' },
      { _id: '2', title: 'Les dangers des dépôts sauvages', category: 'environnement', content: 'Article sur les impacts environnementaux...', author: 'Admin', createdAt: new Date(Date.now() - 172800000).toISOString(), image: '' },
      { _id: '3', title: 'Guide du recyclage à Yaoundé', category: 'recyclage', content: 'Guide pratique pour le recyclage...', author: 'Admin', createdAt: new Date(Date.now() - 259200000).toISOString(), image: '' },
    ];
  }

  // Mock Tours Data
  getMockTours() {
    return [
      { _id: '1', name: 'Tournée Bastos Matin', zone: 'Bastos', status: 'pending', bins: ['1', '2', '3'], driver: 'Jean Dupont', vehicle: 'CAM-1234', createdAt: new Date().toISOString() },
      { _id: '2', name: 'Tournée Mvan Après-midi', zone: 'Mvan', status: 'in_progress', bins: ['6', '7', '8'], driver: 'Pierre Martin', vehicle: 'CAM-5678', createdAt: new Date(Date.now() - 3600000).toISOString() },
      { _id: '3', name: 'Tournée Nkoldongo', zone: 'Nkoldongo', status: 'completed', bins: ['9', '10'], driver: 'Marie Curie', vehicle: 'CAM-9012', createdAt: new Date(Date.now() - 7200000).toISOString() },
    ];
  }

  // Mock Users Data
  getMockUsers() {
    return [
      { _id: '1', name: 'Jean Dupont', email: 'jean@example.com', phone: '670000001', zone: 'Bastos', level: 'Gold', points: 1250, status: 'active', createdAt: new Date(Date.now() - 2592000000).toISOString() },
      { _id: '2', name: 'Marie Martin', email: 'marie@example.com', phone: '670000002', zone: 'Mvan', level: 'Silver', points: 850, status: 'active', createdAt: new Date(Date.now() - 1728000000).toISOString() },
      { _id: '3', name: 'Pierre Curie', email: 'pierre@example.com', phone: '670000003', zone: 'Nkoldongo', level: 'Bronze', points: 420, status: 'active', createdAt: new Date(Date.now() - 864000000).toISOString() },
    ];
  }

  // Mock Leaderboard
  getMockLeaderboard(zone?: string) {
    const allUsers = [
      { rank: 1, name: 'Jean Dupont', points: 1250, zone: 'Bastos', avatar: '' },
      { rank: 2, name: 'Marie Martin', points: 850, zone: 'Mvan', avatar: '' },
      { rank: 3, name: 'Pierre Curie', points: 420, zone: 'Nkoldongo', avatar: '' },
      { rank: 4, name: 'Sophie Bernard', points: 380, zone: 'Bastos', avatar: '' },
      { rank: 5, name: 'Luc Petit', points: 320, zone: 'Mvan', avatar: '' },
    ];
    
    if (zone) {
      return allUsers.filter(user => user.zone === zone);
    }
    return allUsers;
  }

  // Mock Fill by Zone for Admin
  getMockFillByZone() {
    return [
      { _id: 'Bastos', avgFill: 72, totalBins: 15, critical: 2 },
      { _id: 'Mvan', avgFill: 65, totalBins: 12, critical: 1 },
      { _id: 'Nkoldongo', avgFill: 88, totalBins: 10, critical: 3 },
      { _id: 'Messa', avgFill: 55, totalBins: 8, critical: 0 },
      { _id: 'Ekoumdoum', avgFill: 78, totalBins: 7, critical: 1 },
    ];
  }

  // Mock Waste Types Distribution
  getMockWasteTypes() {
    return [
      { type: 'Organique', percentage: 35, color: 'rgba(44, 122, 62, 0.85)' },
      { type: 'Plastique', percentage: 25, color: 'rgba(0, 210, 255, 0.85)' },
      { type: 'Papier', percentage: 20, color: 'rgba(245, 158, 11, 0.85)' },
      { type: 'Verre', percentage: 12, color: 'rgba(139, 92, 246, 0.85)' },
      { type: 'Métal', percentage: 8, color: 'rgba(239, 68, 68, 0.85)' },
    ];
  }
}
