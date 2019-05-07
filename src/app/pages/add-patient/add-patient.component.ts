import { Component, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { UserService } from '../../services/user/user.service';
import { HelperService } from './../../services/helper/helper.service';
import { Validators, FormBuilder, FormGroup } from '@angular/forms';
import { Validation } from '../../utils/validations';

@Component({
  selector: 'app-add-patient',
  templateUrl: './add-patient.component.html',
  styleUrls: ['./add-patient.component.scss']
})
export class AddPatientComponent implements OnInit {
  public patientForm: FormGroup;

  constructor(
    private formBuilder: FormBuilder,
    private modalController: ModalController,
    private helperService: HelperService,
    private userService: UserService) { }

  ngOnInit() {
    this.patientForm = this.formBuilder.group({
      email: ['', Validators.compose([Validation.emailValidator, Validators.required])],
      name: ['', Validators.compose([Validators.minLength(3), Validators.maxLength(100), Validators.required])],
      phone: ['', Validators.compose([Validation.phoneValidator, Validators.required])],
      gender: ['male', Validators.compose([Validators.required])],
      age: ['', Validators.compose([Validators.required])],
      diagnosis: ['', Validators.compose([Validators.minLength(6), Validators.maxLength(200), Validators.required])],
      has_guardian: [true, Validators.compose([Validators.required])],
      guardian_name: ['', Validators.compose([Validators.minLength(3), Validators.maxLength(100)])],
      notes: ['', Validators.compose([Validators.minLength(6), Validators.maxLength(200)])],
    });
  }

  async save() {
    try {
      this.helperService.showLoading();
      const result: any = await this.userService.addPatient(this.patientForm.value);
      if (result.success) {
        this.helperService.showToast(this.helperService.translate('PATIENT.Add_PATEINT_MSG'));
        this.dismiss(result.success);
      }

    } catch (err) {
      this.helperService.showError(err);
    }
  }

  dismiss(patient = null) {
    this.modalController.dismiss({
      patient
    });
  }

}
