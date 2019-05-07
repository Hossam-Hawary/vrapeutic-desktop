import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';

import { IonicModule } from '@ionic/angular';

import { PatientPage } from './patient.page';
import { TranslateModule } from '@ngx-translate/core';
import { EditPatientComponent } from '../edit-patient/edit-patient.component';
import { ComponentsModule } from '../../components/components.module';

const routes: Routes = [
  {
    path: '',
    component: PatientPage
  }
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RouterModule.forChild(routes),
    TranslateModule.forChild(),
    ReactiveFormsModule,
    ComponentsModule
  ],
  declarations: [PatientPage, EditPatientComponent],
  entryComponents: [EditPatientComponent]
})
export class PatientPageModule {}
