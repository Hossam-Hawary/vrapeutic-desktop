import { Component } from '@angular/core';

import { Platform, Events } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { HelperService } from './services/helper/helper.service';
import { UserService } from './services/user/user.service';
import { ConfigService } from './services/config/config.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html'
})
export class AppComponent {
  dir;
  currentUser;
  constructor(
    private platform: Platform,
    private translate: TranslateService,
    private helperService: HelperService,
    private userService: UserService,
    private router: Router,
    private events: Events,
    configService: ConfigService
  ) {
    this.initializeApp();
    this.trackcurrentUser();
    configService.getConfig().then((config: any) => {
      this.translate.use(config.lang);
      this.dir = config.dir;
    });
  }

  initializeApp() {
    this.platform.ready().then(() => {
      this.translate.setDefaultLang('en');
    });
  }

  trackcurrentUser() {
    this.events.subscribe('userUpdate', (user) => {
      this.currentUser = user;
      this.navigateCurrentUser();
    });
  }

  navigateCurrentUser() {
    if (this.currentUser) {
      return this.router.navigate(['home']);
    }
    this.router.navigate(['']);
  }
}
