import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ReportService {
  private api = `${environment.apiUrl}/reports`;
  constructor(private http: HttpClient) {}

  private download(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  attendanceReport(groupId: number) {
    return this.http.get(`${this.api}/attendance?groupId=${groupId}`, { responseType: 'blob' });
  }

  gradesReport(groupId: number) {
    return this.http.get(`${this.api}/grades?groupId=${groupId}`, { responseType: 'blob' });
  }

  groupSummaryReport(groupId: number) {
    return this.http.get(`${this.api}/group-summary?groupId=${groupId}`, { responseType: 'blob' });
  }

  studentProgressReport(studentId?: number) {
    const url = studentId ? `${this.api}/student-progress?studentId=${studentId}` : `${this.api}/student-progress`;
    return this.http.get(url, { responseType: 'blob' });
  }

  downloadBlob(blob: Blob, filename: string) { this.download(blob, filename); }
}
