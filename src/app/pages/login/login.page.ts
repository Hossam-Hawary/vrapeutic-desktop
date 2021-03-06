import { Component, OnInit } from '@angular/core';
import { Validators, FormBuilder, FormGroup } from '@angular/forms';
import { Validation } from '../../utils/validations';
import { Router } from '@angular/router';
import { UserService } from '../../services/user/user.service';
import { HelperService } from '../../services/helper/helper.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage implements OnInit {
  public loginForm: FormGroup;

  constructor(private formBuilder: FormBuilder,
              private userService: UserService,
              private helperService: HelperService) {

  }

  ngOnInit() {
    this.loginForm = this.formBuilder.group({
      email: ['', Validators.compose([Validation.emailValidator, Validators.required])],
      password: ['', Validators.compose([Validators.minLength(6), Validators.maxLength(100), Validators.required])],
    });
  }

  async save() {
    try {
      await this.helperService.showLoading();
      const result: any = await this.userService.login(this.loginForm.value);
      this.userService.updateAndSaveCarrentUser(result);
      this.helperService.removeLoading();
    } catch (err) {
      this.helperService.showError(err);
    }
  }
}
