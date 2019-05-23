import { Component, OnInit } from '@angular/core';
import { Platform, Events } from '@ionic/angular';
import { UserService } from '../../services/user/user.service';
import { HelperService } from '../../services/helper/helper.service';
import { ModalController } from '@ionic/angular';
import { AddPatientComponent } from './../add-patient/add-patient.component';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
})

export class HomePage implements OnInit {
currentUser: any;
  pusherSocket;
  channel;
  patients: any[];
  connected: boolean;
    constructor(
      private platform: Platform,
      public userService: UserService,
      private helperService: HelperService,
      private events: Events,
      public modalController: ModalController
    ) {
  }

  ngOnInit() {
    this.currentUser = this.userService.getCurrentUser();
    this.events.subscribe('userUpdate', (user) => {
      this.currentUser = user;
      if (user) { this.loadPatients(); } else {this.patients = []; }
    });
    this.loadPatients();
  }

  async loadPatients() {
    try {
      await this.helperService.showLoading();
      const result: any = await this.userService.getPatients();
      this.patients = result;
      setTimeout(() => {
        this.helperService.removeLoading();
      }, 500);
    } catch (err) {
      console.log('loadPatients err', err);
      this.helperService.showError(err);
    }
  }

  async addPatient() {
    const modal = await this.modalController.create({
      component: AddPatientComponent,
      animated: true,
      backdropDismiss: true,
      keyboardClose: true,
      showBackdrop: true
    });
    await modal.present();
    const { data } = await modal.onDidDismiss();
    if (data.patient) { this.patients.push(data.patient); }
  }

}
