import { Injectable } from '@angular/core';
import { HttpClient, HttpEvent, HttpEventType } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';

export interface UploadResult { fileUrl: string; originalName: string; sizeBytes: number; }

@Injectable({ providedIn: 'root' })
export class FileUploadService {
  private api = `${environment.apiUrl}/files`;
  constructor(private http: HttpClient) {}

  uploadPdf(file: File): Observable<HttpEvent<UploadResult>> {
    const formData = new FormData();
    formData.append('file', file, file.name);
    return this.http.post<UploadResult>(`${this.api}/upload-pdf`, formData, {
      reportProgress: true,
      observe: 'events'
    });
  }
}
