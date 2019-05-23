import { Injectable } from '@angular/core';
import { ApiService } from '../api/api.service';
import { Events } from '@ionic/angular';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  currentUser;

  constructor(private api: ApiService,
              private events: Events) {
  }

  login(userData) {
    return this.api.post('/login', userData);
  }

  getPatients() {
    return this.api.get(`/doctors/${this.currentUser.id}/patients`);
  }

  getPatient(patientId) {
    return this.api.get(`/patients/${patientId}`);
  }

  addPatient(patientData) {
    return this.api.post(`/doctors/${this.currentUser.id}/patients/`, patientData );
  }

  editPatient(patientId, patientData) {
    return this.api.put(`/patients/${patientId}`, patientData );
  }

  getPatientModules(patientId) {
    return this.api.get(`/patients/${patientId}/vr_modules`);
  }

  getPatientSessionId(patientId, moduleId) {
    return this.api.post('/module_sessions', { patient_id: patientId, vr_module_id: moduleId});
  }

  async refreshUserData() {
    try {
      const result: any = await this.api.get(`/doctors/${this.currentUser.id}`);
      this.updateAndSaveCarrentUser(result);
    } catch (err) {
      console.log('refreshUserData Error', err);
    }
  }

  getCurrentUser() {
    return this.currentUser;
  }

  async updateAndSaveCarrentUser(user) {
    if (JSON.stringify(this.currentUser) === JSON.stringify(user)) { return; }
    this.updateCarrentUser(user);
  }

  async updateCarrentUser(user) {
    this.currentUser = user;
    this.events.publish('userUpdate', user);
  }

  logout() {
    this.currentUser = null;
    this.events.publish('userUpdate', null);
  }

}
