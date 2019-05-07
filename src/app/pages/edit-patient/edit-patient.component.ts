import { Component, OnInit, Input} from '@angular/core';
import { ModalController } from '@ionic/angular';
import { UserService } from '../../services/user/user.service';
import { HelperService } from './../../services/helper/helper.service';
import { Validators, FormBuilder, FormGroup } from '@angular/forms';
import { Validation } from '../../utils/validations';

@Component({
  selector: 'app-edit-patient',
  templateUrl: './edit-patient.component.html',
  styleUrls: ['./edit-patient.component.scss']
})
export class EditPatientComponent implements OnInit {
  public patientForm: FormGroup;
  @Input() patient;

  constructor(
    private formBuilder: FormBuilder,
    private modalController: ModalController,
    private helperService: HelperService,
    private userService: UserService) { }

  ngOnInit() {
    this.patientForm = this.formBuilder.group({
      email: [this.patient.email, Validators.compose([Validation.emailValidator, Validators.required])],
      name: [this.patient.name, Validators.compose([Validators.minLength(3), Validators.maxLength(100), Validators.required])],
      phone: [this.patient.phone, Validators.compose([Validation.phoneValidator, Validators.required])],
      gender: [this.patient.gender, Validators.compose([Validators.required])],
      age: [this.patient.age, Validators.compose([Validators.required])],
      diagnosis: [this.patient.diagnosis, Validators.compose([Validators.minLength(6), Validators.maxLength(200), Validators.required])],
      has_guardian: [this.patient.has_guardian, Validators.compose([Validators.required])],
      guardian_name: [this.patient.guardian_name, Validators.compose([Validators.minLength(3), Validators.maxLength(100)])],
      notes: [this.patient.notes, Validators.compose([Validators.minLength(6), Validators.maxLength(200)])]
    });
  }

  async save() {
    try {
      this.helperService.showLoading();
      const result: any = await this.userService.editPatient(this.patient.user_id, this.patientForm.value);
      if (result.success) {
        this.helperService.showToast(this.helperService.translate('PATIENT.EDIT_PATEINT_MSG'));
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
