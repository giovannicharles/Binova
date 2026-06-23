import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class BinService {
  private api = `${environment.apiUrl}/bins`;

  constructor(private http: HttpClient) {}

  getBins(params?: any): Observable<any> {
    return this.http.get(this.api, { params });
  }

  getMyBins(): Observable<any> {
    return this.http.get(`${this.api}/my`);
  }

  getGeoJSON(zone?: string): Observable<any> {
    let httpParams = new HttpParams();
    if (zone) {
      httpParams = httpParams.set('zone', zone);
    }
    return this.http.get(`${this.api}/map/geojson`, { params: httpParams });
  }

  getBin(id: string): Observable<any> {
    return this.http.get(`${this.api}/${id}`);
  }

  getBinHistory(id: string, days = 7): Observable<any> {
    return this.http.get(`${this.api}/${id}/history`, { params: { days: days.toString() } });
  }

  getZones(): Observable<any> {
    return this.http.get(`${this.api}/zones`);
  }

  createBin(data: any): Observable<any> {
    return this.http.post(this.api, data);
  }

  updateBin(id: string, data: any): Observable<any> {
    return this.http.put(`${this.api}/${id}`, data);
  }

  deleteBin(id: string): Observable<any> {
    return this.http.delete(`${this.api}/${id}`);
  }

  markEmptied(id: string): Observable<any> {
    return this.http.patch(`${this.api}/${id}/empty`, {});
  }
}

@Injectable({ providedIn: 'root' })
export class ReportService {
  private api = `${environment.apiUrl}/reports`;

  constructor(private http: HttpClient) {}

  getReports(params?: any): Observable<any> {
    return this.http.get(this.api, { params });
  }

  getMyReports(): Observable<any> {
    return this.http.get(`${this.api}/my`);
  }

  getReport(id: string): Observable<any> {
    return this.http.get(`${this.api}/${id}`);
  }

  createReport(formData: FormData): Observable<any> {
    return this.http.post(this.api, formData);
  }

  updateStatus(id: string, data: any): Observable<any> {
    return this.http.put(`${this.api}/${id}/status`, data);
  }

  deleteReport(id: string): Observable<any> {
    return this.http.delete(`${this.api}/${id}`);
  }
}

@Injectable({ providedIn: 'root' })
export class StatsService {
  private api = `${environment.apiUrl}/stats`;

  constructor(private http: HttpClient) {}

  getDashboard(): Observable<any> {
    return this.http.get(`${this.api}/dashboard`);
  }

  getOpensByArea(): Observable<any> {
    return this.http.get(`${this.api}/opens-by-area`);
  }

  getWasteTypes(): Observable<any> {
    return this.http.get(`${this.api}/waste-types`);
  }

  getFillTrend(days = 7): Observable<any> {
    return this.http.get(`${this.api}/fill-trend`, { params: { days: days.toString() } });
  }

  exportPDF(): Observable<Blob> {
    return this.http.get(`${this.api}/export/pdf`, { responseType: 'blob' });
  }

  exportCSV(): Observable<Blob> {
    return this.http.get(`${this.api}/export/csv`, { responseType: 'blob' });
  }
}

@Injectable({ providedIn: 'root' })
export class AwarenessService {
  private api = `${environment.apiUrl}/awareness`;

  constructor(private http: HttpClient) {}

  getArticles(params?: any): Observable<any> {
    return this.http.get(this.api, { params });
  }

  getArticle(id: string): Observable<any> {
    return this.http.get(`${this.api}/${id}`);
  }

  createArticle(data: any): Observable<any> {
    return this.http.post(this.api, data);
  }

  updateArticle(id: string, data: any): Observable<any> {
    return this.http.put(`${this.api}/${id}`, data);
  }

  deleteArticle(id: string): Observable<any> {
    return this.http.delete(`${this.api}/${id}`);
  }
}

@Injectable({ providedIn: 'root' })
export class TourService {
  private api = `${environment.apiUrl}/tours`;

  constructor(private http: HttpClient) {}

  getTours(params?: any): Observable<any> {
    return this.http.get(this.api, { params });
  }

  createTour(data: any): Observable<any> {
    return this.http.post(this.api, data);
  }

  updateTour(id: string, data: any): Observable<any> {
    return this.http.put(`${this.api}/${id}`, data);
  }

  markBinCollected(tourId: string, binId: string, note?: string): Observable<any> {
    return this.http.patch(`${this.api}/${tourId}/bins/${binId}/collect`, { note });
  }

  deleteTour(id: string): Observable<any> {
    return this.http.delete(`${this.api}/${id}`);
  }
}

@Injectable({ providedIn: 'root' })
export class UserService {
  private api = `${environment.apiUrl}/users`;

  constructor(private http: HttpClient) {}

  getUsers(params?: any): Observable<any> {
    return this.http.get(this.api, { params });
  }

  getUser(id: string): Observable<any> {
    return this.http.get(`${this.api}/${id}`);
  }

  createUser(data: any): Observable<any> {
    return this.http.post(this.api, data);
  }

  updateUser(id: string, data: any): Observable<any> {
    return this.http.put(`${this.api}/${id}`, data);
  }

  updateProfile(data: any): Observable<any> {
    return this.http.patch(`${this.api}/profile`, data);
  }

  suspendUser(id: string): Observable<any> {
    return this.http.patch(`${this.api}/${id}/suspend`, {});
  }

  activateUser(id: string): Observable<any> {
    return this.http.patch(`${this.api}/${id}/activate`, {});
  }

  adminResetPassword(id: string, newPassword: string): Observable<any> {
    return this.http.patch(`${this.api}/${id}/reset-password`, { newPassword });
  }

  deleteUser(id: string): Observable<any> {
    return this.http.delete(`${this.api}/${id}`);
  }

  getLeaderboard(zone?: string): Observable<any> {
    let params = new HttpParams();
    if (zone) {
      params = params.set('zone', zone);
    }
    return this.http.get(`${this.api}/leaderboard`, { params });
  }
}