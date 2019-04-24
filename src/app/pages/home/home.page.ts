import { environment } from './../../../environments/environment.prod';
import { Component, OnInit } from '@angular/core';
import { Platform, Events } from '@ionic/angular';
import Pusher from 'pusher-js';
import { UserService } from '../../services/user/user.service';
import { HelperService } from '../../services/helper/helper.service';
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
      private events: Events
    ) {
  }

  ngOnInit() {
    this.currentUser = this.userService.getCurrentUser();
    this.events.subscribe('userUpdate', (user) => {
      this.currentUser = user;
    });
    // this.connectToPusher();
    this.loadPatients();
  }

  async loadPatients() {
    try {
      await this.helperService.showLoading();
      const result: any = await this.userService.getPatients();
      this.patients = result.success;
      setTimeout(() => {
        this.helperService.removeLoading();
      }, 500);
    } catch (err) {
      console.log('loadPatients err', err);
      this.helperService.showError(err);
    }
  }

  connectToPusher() {
    // private-my-channel needs authEndpoint
    this.pusherSocket = new Pusher(environment.pusherToken, {
      cluster: 'eu',
      forceTLS: true,
      disableStats: true
      // authEndpoint: '/pusher/auth',
      // auth: {
      //   params: { foo: 'bar' },
      //   headers: { 'X-CSRF-Token': 'SOME_CSRF_TOKEN' }
      // }
    });

    this.channel = this.pusherSocket.subscribe(`channel_${this.currentUser.id}`);

    this.channel.bind(environment.pusherEvent, (data) => {
      console.log('data....', data);
      this.launchPackage(data.package, data.room_id);
    });

    this.pusherSocket.connection.bind('connected', (data) => {
      this.connected = true;
      this.loadPatients();
    });

    this.pusherSocket.connection.bind('error', (err) => {
      console.log('connection error!', err);
      if (err.error.data.code === 4004) {
        this.helperService.showError({ message: 'Over connections limit'});
      } else {
        this.helperService.showError({ message: 'connection error!' });
      }
    });

    this.pusherSocket.connection.bind('state_change', (states) => {
      // states = {previous: 'oldState', current: 'newState'}
      this.connected = ( states.current === 'connected');
    });
  }

  launchPackage(packageName, roomID: string) {
  //   const extras = [
  //     { 'name': 'room_id', 'value': roomID, 'dataType': 'String' },
  //     { 'name': 'token', 'value': this.currentUser.token, 'dataType': 'String' }
  //   ];

  //   this.platform.ready().then(() => {
  //     launcher.packageLaunch({ packageName: packageName, extras: extras });
  //   });
   }
}
